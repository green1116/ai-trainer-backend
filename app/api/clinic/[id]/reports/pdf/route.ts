import { db } from '@/lib/db';
import { analyzeSessionStability } from '@/lib/services/ai/sessionAnalysis';
import { VibrationSample } from '@/src/types/ble';
import puppeteer from 'puppeteer';

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * 生成 Clinic 报告 PDF
 * POST /api/clinic/{id}/reports/pdf?period=week|month
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const period = (url.searchParams.get('period') || 'week') as 'week' | 'month';
    const locale = (url.searchParams.get('lang') || 'zh') as 'zh' | 'en';

    const clinic = await db.clinic.findUnique({
      where: { id },
    });

    if (!clinic) {
      return Response.json(
        { error: 'Clinic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 计算时间范围
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    startDate.setHours(0, 0, 0, 0);

    // 查询 Session 数据
    const sessions = await db.session.findMany({
      where: {
        clinicId: id,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
        endedAt: { not: null },
      },
      include: {
        device: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startedAt: 'asc',
      },
    });

    // 计算统计数据
    let totalStability = 0;
    let scoredSessionCount = 0;

    for (const session of sessions) {
      const samples = session.samples as VibrationSample[] | null;
      if (samples && Array.isArray(samples) && samples.length > 0) {
        const frequencies = samples
          .filter(s => typeof s.hz === 'number')
          .map(s => s.hz);
        
        if (frequencies.length > 0) {
          const analysis = analyzeSessionStability(frequencies);
          totalStability += analysis.score;
          scoredSessionCount++;
        }
      }
    }

    const avgStability = scoredSessionCount > 0
      ? Math.round(totalStability / scoredSessionCount)
      : 0;

    // 生成 HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${locale === 'zh' ? 'Clinic 报告' : 'Clinic Report'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            h1 {
              color: #1a1a1a;
              border-bottom: 3px solid #007AFF;
              padding-bottom: 10px;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin: 30px 0;
            }
            .stat-card {
              background: #f5f5f5;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .stat-value {
              font-size: 32px;
              font-weight: bold;
              color: #007AFF;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
              margin-top: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #007AFF;
              color: white;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>${clinic.name} - ${period === 'week' ? (locale === 'zh' ? '周报' : 'Weekly Report') : (locale === 'zh' ? '月报' : 'Monthly Report')}</h1>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">${sessions.length}</div>
              <div class="stat-label">${locale === 'zh' ? '总 Session 数' : 'Total Sessions'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${avgStability}</div>
              <div class="stat-label">${locale === 'zh' ? '平均稳定性' : 'Avg Stability'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${startDate.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</div>
              <div class="stat-label">${locale === 'zh' ? '开始日期' : 'Start Date'}</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${endDate.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</div>
              <div class="stat-label">${locale === 'zh' ? '结束日期' : 'End Date'}</div>
            </div>
          </div>

          <h2>${locale === 'zh' ? 'Session 列表' : 'Session List'}</h2>
          <table>
            <thead>
              <tr>
                <th>${locale === 'zh' ? '设备' : 'Device'}</th>
                <th>${locale === 'zh' ? '开始时间' : 'Start Time'}</th>
                <th>${locale === 'zh' ? '结束时间' : 'End Time'}</th>
                <th>${locale === 'zh' ? '时长（秒）' : 'Duration (s)'}</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.map(session => {
                const duration = session.endedAt && session.startedAt
                  ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
                  : 0;
                return `
                  <tr>
                    <td>${session.device.name || session.device.id}</td>
                    <td>${new Date(session.startedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</td>
                    <td>${session.endedAt ? new Date(session.endedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US') : '-'}</td>
                    <td>${duration}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            ${locale === 'zh' ? '生成时间' : 'Generated at'}: ${new Date().toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
          </div>
        </body>
      </html>
    `;

    // 使用 Puppeteer 生成 PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // 等待图表渲染（如果有）
    await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await browser.close();

    // 修复：将 Uint8Array 转换为 Blob
    // page.pdf() 返回的是 Uint8Array，需要转换为 Blob 或 ArrayBuffer
    return new Response(new Blob([pdf], { type: 'application/pdf' }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="clinic-report-${period}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('生成 PDF 错误:', error);
    return Response.json(
      {
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

