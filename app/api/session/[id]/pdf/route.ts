import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { db } from "@/lib/db";
import { analyzeSessionStability } from "@/lib/services/ai/sessionAnalysis";
import { generateNarrative } from "@/lib/services/ai/llmNarrative";
import { buildSessionStats } from "@/src/services/sessionStats";
import { DeviceService } from "@/src/devices/device.service";

// 服务器端翻译函数（不使用React hook）
function getTranslation(locale: string) {
  const translations: Record<string, Record<string, string>> = {
    en: {
      title: "Session Report",
      sessionId: "Session ID",
      date: "Date",
      participantInfo: "Participant Information",
      user: "User",
      device: "Device",
      trainingSummary: "Training Summary",
      averageHz: "Average Hz",
      duration: "Duration",
      aiScore: "AI Score",
      frequencyCurve: "Frequency Curve",
      frequencyInterpretation: "Frequency Interpretation",
      trainingRecommendation: "Training Recommendation",
      min: "min",
      aiStabilityAnalysis: "AI Stability Analysis",
      stabilityScore: "Stability Score"
    },
    zh: {
      title: "训练报告",
      sessionId: "会话 ID",
      date: "日期",
      participantInfo: "参与信息",
      user: "用户",
      device: "设备",
      trainingSummary: "训练总结",
      averageHz: "平均频率",
      duration: "时长",
      aiScore: "AI 评分",
      frequencyCurve: "频率曲线",
      frequencyInterpretation: "频率解释",
      trainingRecommendation: "训练建议",
      min: "分钟",
      aiStabilityAnalysis: "AI 稳定性分析",
      stabilityScore: "稳定性评分"
    }
  };
  
  return (key: string) => {
    return translations[locale]?.[key] || key;
  };
}

// 架构流程：
// Hz 数据 → 规则分析 → 结构化 AI 结果 (JSON) → 大模型 → 自然语言解释

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("PDF generation request for session ID:", id);
    
    // 验证 sessionId 格式
    if (!id || id === '<id>' || id === 'xxx' || id.includes('<') || id.length < 10) {
      return NextResponse.json({ 
        error: "Invalid session ID",
        message: `The provided session ID "${id}" is invalid. Please ensure you are accessing this page from the session list.`,
        receivedId: id
      }, { status: 400 });
    }
    
    // 从查询参数获取语言
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') || 'en';
    const locale = (lang === 'zh' || lang === 'en') ? lang : 'en';
    
    const session = await db.session.findUnique({
      where: { id },
      include: {
        device: true,
        clinic: {
          include: {
            users: {
              take: 1, // 只取第一个用户作为示例
            },
          },
        },
      },
    });

    if (!session) {
      console.error('Session not found in database:', id);
      return NextResponse.json({ 
        error: "Session not found",
        message: `No session found with ID: ${id}. Please check if the session exists in the database.`,
        sessionId: id
      }, { status: 404 });
    }
    
    console.log('Session found:', session.id);

    // B3. Profile 在系统中的作用：PDF 标注"设备支持能力"
    // 获取设备能力描述
    let deviceProfile = null;
    if (session.device) {
      try {
        const deviceModel = session.device.name || session.device.id;
        deviceProfile = DeviceService.getDeviceCapability(deviceModel);
      } catch (error) {
        console.log('[PDF] 无法获取设备能力描述:', error);
      }
    }

    // ============================================
    // 正确的数据流：DeviceData（原始）→ SessionStats（计算）→ PDF（训练总结）
    // PDF 不是设备日志，而是"训练总结"，所以必须有聚合层
    // 重要：不要在 PDF 里计算这些，应该使用 buildSessionStats 函数
    // ============================================
    
    // 1. 从 DeviceData 表读取原始数据（原始）
    let deviceDataRecords;
    try {
      deviceDataRecords = await db.deviceData.findMany({
        where: { sessionId: id },
        orderBy: { timestamp: 'asc' },
      });
    } catch (error) {
      // 兼容旧 schema
      console.log('[PDF] timestamp 字段不存在，使用 createdAt 排序');
      deviceDataRecords = await db.deviceData.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: 'asc' },
      });
    }

    // 2. 使用统计函数计算 SessionStats（聚合层）
    // 重要：不要在 PDF 里计算这些，应该在这里计算
    const sessionStats = buildSessionStats(
      deviceDataRecords as any,
      session.startedAt,
      session.endedAt
    );

    // 使用聚合后的统计数据
    const avgHz = sessionStats.avgHz;
    const duration = sessionStats.duration;
    const frequencyData = sessionStats.frequencyData;
    const frequencySamples = sessionStats.frequencySamples;
    
    // 架构流程：Hz 数据 → 规则分析 → 结构化 AI 结果 (JSON)
    // 使用从 SessionStats 获取的数据进行分析（已经在 buildSessionStats 中计算了 stabilityScore）
    const structuredAnalysis = frequencySamples.length > 0 
      ? analyzeSessionStability(frequencySamples)
      : analyzeSessionStability([avgHz]); // 如果没有数据，使用平均值
    
    // 架构流程：结构化 AI 结果 (JSON) → 大模型 → 自然语言解释
    const narrative = await generateNarrative(structuredAnalysis, locale);

    // 生成频率解释和建议
    let interpretation = "";
    let recommendation = "";
    if (avgHz === 0 || avgHz < 20) {
      interpretation = locale === 'zh' 
        ? "低频震动通常用于恢复、放松和改善血液循环。"
        : "Low frequency vibration is typically used for recovery, relaxation, and circulation improvement.";
      recommendation = locale === 'zh'
        ? "建议在恢复日或高强度训练后继续使用低频训练。"
        : "Recommended to continue low-frequency sessions for recovery days or post-intensive workouts.";
    } else if (avgHz < 40) {
      interpretation = locale === 'zh'
        ? "中频震动适用于肌肉激活、平衡训练和康复训练。"
        : "Medium frequency vibration is suitable for muscle activation, balance training, and rehabilitation.";
      recommendation = locale === 'zh'
        ? "这个频率范围适合常规训练。建议每周保持2-4次训练。"
        : "This frequency range is ideal for regular training. Maintain 2–4 sessions per week.";
    } else {
      interpretation = locale === 'zh'
        ? "高频震动通常应用于力量训练和神经肌肉刺激。"
        : "High frequency vibration is commonly applied in strength training and neuromuscular stimulation.";
      recommendation = locale === 'zh'
        ? "高频训练应选择性使用。确保训练之间有足够的休息时间。"
        : "High-frequency sessions should be used selectively. Ensure adequate rest between sessions.";
    }

    const t = getTranslation(locale);

    // 生成 HTML 内容
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 50px;
      color: #333;
    }
    h1 {
      text-align: center;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .header {
      color: #666;
      font-size: 10px;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 10px;
    }
    .content {
      font-size: 10px;
      line-height: 1.6;
    }
    .metrics {
      display: flex;
      gap: 30px;
      margin: 20px 0;
    }
    .metric-card {
      flex: 1;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    .metric-label {
      font-size: 10px;
      color: #666;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
    .chart-container {
      width: 100%;
      height: 300px;
      margin: 20px 0;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 10px;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
  <h1>${t('title')}</h1>
  <div class="header">
    <div>${t('sessionId')}: ${session.id}</div>
    <div>${t('date')}: ${new Date(session.startedAt).toLocaleString()}</div>
  </div>

  <div class="section">
    <div class="section-title">${t('participantInfo')}</div>
    <div class="content">
      <div>${t('user')}: ${session.clinic?.users?.[0]?.email ?? 'N/A'}</div>
      <div>${t('device')}: ${session.device?.name ?? "Unknown Device"}</div>
      ${deviceProfile ? `<div>${locale === 'zh' ? '设备型号' : 'Device Model'}: ${deviceProfile.model}</div>` : ''}
      ${deviceProfile?.type ? `<div>${locale === 'zh' ? '设备类型' : 'Device Type'}: ${deviceProfile.type}</div>` : ''}
    </div>
  </div>

  ${deviceProfile ? `
  <div class="section">
    <div class="section-title">${locale === 'zh' ? '设备支持能力' : 'Device Support Capabilities'}</div>
    <div class="content">
      <div style="margin-bottom: 10px;">
        <strong>${locale === 'zh' ? '频率范围' : 'Frequency Range'}:</strong> 
        ${deviceProfile.frequencyHz.min} - ${deviceProfile.frequencyHz.max} Hz
      </div>
      <div style="margin-bottom: 10px;">
        <strong>${locale === 'zh' ? '强度级别' : 'Intensity Levels'}:</strong> 
        ${deviceProfile.intensityLevels} ${locale === 'zh' ? '级' : 'levels'}
      </div>
      ${deviceProfile.modes && deviceProfile.modes.length > 0 ? `
      <div style="margin-bottom: 10px;">
        <strong>${locale === 'zh' ? '支持的模式' : 'Supported Modes'}:</strong>
        <ul style="margin-top: 5px; padding-left: 20px;">
          ${deviceProfile.modes.map(mode => `
            <li>
              <strong>${locale === 'zh' ? mode.label.zh : mode.label.en}</strong> 
              (${mode.key}) - 
              ${locale === 'zh' ? '频率范围' : 'Frequency Range'}: 
              ${mode.frequencyRange[0]}-${mode.frequencyRange[1]} Hz
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}
      ${deviceProfile.supports ? `
      <div style="margin-bottom: 10px;">
        <strong>${locale === 'zh' ? '其他功能' : 'Other Features'}:</strong>
        <ul style="margin-top: 5px; padding-left: 20px;">
          ${deviceProfile.supports.realTimeStream ? `<li>✓ ${locale === 'zh' ? '实时数据流' : 'Real-time Data Stream'}</li>` : ''}
          ${deviceProfile.supports.presetPrograms ? `<li>✓ ${locale === 'zh' ? '预设程序' : 'Preset Programs'}</li>` : ''}
        </ul>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">${t('trainingSummary')}</div>
    <div class="metrics">
      <div class="metric-card">
        <div class="metric-label">${t('averageHz')}</div>
        <div class="metric-value">${avgHz.toFixed(1)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">${t('duration')}</div>
        <div class="metric-value">${duration} ${t('min')}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">${t('aiScore')}</div>
        <div class="metric-value">${sessionStats.stabilityScore}</div>
      </div>
      ${sessionStats.dataPointCount > 0 ? `
      <div class="metric-card">
        <div class="metric-label">${locale === 'zh' ? '数据点数' : 'Data Points'}</div>
        <div class="metric-value">${sessionStats.dataPointCount}</div>
      </div>
      ` : ''}
    </div>
    ${sessionStats.dataPointCount > 0 ? `
    <div class="content" style="margin-top: 15px; font-size: 9px; color: #666;">
      ${locale === 'zh' 
        ? `频率范围: ${sessionStats.minHz.toFixed(1)} - ${sessionStats.maxHz.toFixed(1)} Hz` 
        : `Frequency Range: ${sessionStats.minHz.toFixed(1)} - ${sessionStats.maxHz.toFixed(1)} Hz`}
      ${Object.keys(sessionStats.modeDistribution).length > 0 ? `
      <br>${locale === 'zh' ? '模式分布: ' : 'Mode Distribution: '}
      ${Object.entries(sessionStats.modeDistribution).map(([mode, count]) => 
        `${mode}: ${count}`
      ).join(', ')}
      ` : ''}
    </div>
    ` : ''}
  </div>

  <div class="section">
    <div class="section-title">${t('aiStabilityAnalysis')}</div>
    <div class="content">
      <div style="margin-bottom: 10px;">
        <strong>${t('stabilityScore')}:</strong> ${structuredAnalysis.score} / 100
      </div>
      <div style="margin-bottom: 15px;">${narrative.summary}</div>
      ${narrative.recommendations.length > 0 ? `
      <div style="margin-top: 10px;">
        <strong>${locale === 'zh' ? '训练建议' : 'Training Recommendations'}:</strong>
        <ul style="margin-top: 5px; padding-left: 20px;">
          ${narrative.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">${t('frequencyCurve')}</div>
    <div class="chart-container">
      <canvas id="frequencyChart"></canvas>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${t('frequencyInterpretation')}</div>
    <div class="content">${interpretation}</div>
  </div>

  <div class="section">
    <div class="section-title">${t('trainingRecommendation')}</div>
    <div class="content">${recommendation}</div>
  </div>

  <script>
    const ctx = document.getElementById('frequencyChart').getContext('2d');
    const frequencyData = ${JSON.stringify(frequencyData)};
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: frequencyData.map(d => d.time),
        datasets: [{
          label: 'Frequency (Hz)',
          data: frequencyData.map(d => d.hz),
          borderColor: '#000000',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Frequency (Hz)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          }
        }
      }
    });
  </script>
</body>
</html>
    `;

    // 使用 Puppeteer 生成 PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // 等待图表渲染完成
      await page.evaluate(() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 1500);
        });
      });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '50px',
          right: '50px',
          bottom: '50px',
          left: '50px',
        },
        printBackground: true,
      });

      await browser.close();

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="session-${session.id}.pdf"`,
        },
      });
    } catch (browserError) {
      await browser.close().catch(() => {});
      throw browserError;
    }
  } catch (error) {
    console.error("PDF 生成错误:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
