'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/useI18n';

type Session = {
  id: string;
  startedAt: string;
  avgHz: number | null;
  deviceId: string;
  userId: string;
  device?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    email: string;
  };
  pdfUrl?: string;
};

export default function DashboardPage() {
  // 从 URL 或浏览器语言获取 locale，默认为中文
  const [locale, setLocale] = useState<string>('zh');
  const t = useI18n(locale);
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 从 URL 参数获取语言，或从浏览器语言设置
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLocale = urlParams.get('lang') || urlParams.get('locale');
        if (urlLocale && (urlLocale === 'en' || urlLocale === 'zh')) {
          setLocale(urlLocale);
        } else {
          // 从浏览器语言设置获取
          const browserLang = navigator.language.toLowerCase();
          if (browserLang.startsWith('en')) {
            setLocale('en');
          } else {
            setLocale('zh');
          }
        }
      } catch (error) {
        console.error('Error setting locale:', error);
        setLocale('zh'); // 默认使用中文
      }
    }
  }, []);

  useEffect(() => {
    // 确保在客户端执行
    if (typeof window === 'undefined') {
      return;
    }

    fetch('/api/session')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch sessions: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        const sessionsData = data.sessions || [];
        console.log('Fetched sessions:', sessionsData);
        // 验证 session IDs
        sessionsData.forEach((session: Session, index: number) => {
          if (!session.id || session.id === '<id>' || session.id.length < 10) {
            console.warn(`Invalid session ID at index ${index}:`, session.id);
          }
        });
        setSessions(sessionsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching sessions:', err);
        setError(err.message || 'Failed to load sessions');
        setLoading(false);
      });
  }, []);

  // 语言切换函数
  const switchLanguage = (newLocale: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    setLocale(newLocale);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLocale);
      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.error('Error updating URL:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{t('error')}: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  // 调试信息
  console.log('Current locale:', locale);
  console.log('Translation function available:', typeof t === 'function');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 语言切换 - 固定在顶部右侧 */}
        <div className="mb-6 flex justify-end">
          <div className="inline-flex gap-2 bg-white rounded-lg shadow-md p-1 border-2 border-gray-300">
            <button
              onClick={() => {
                console.log('Switching to Chinese');
                switchLanguage('zh');
              }}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                locale === 'zh'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => {
                console.log('Switching to English');
                switchLanguage('en');
              }}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                locale === 'en'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">{t('dashboard.subtitle')}</p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">{t('dashboard.noSessions')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.sessionId')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.startTime')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.avgFrequency')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.device')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map(session => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {session.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(session.startedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.avgHz ? session.avgHz.toFixed(1) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.device?.name || t('dashboard.unknownDevice')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.user?.email || (session.userId ? session.userId.substring(0, 8) : 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {session.id && session.id !== '<id>' && session.id !== '[id]' && !session.id.includes('<') && !session.id.includes('>') && session.id.length > 10 ? (
                          <div className="flex gap-3 items-center">
                            <a
                              href={`http://localhost:3000/dashboard/session/${encodeURIComponent(session.id)}?lang=${locale}`}
                              target="_blank"
                              className="text-blue-600 hover:text-blue-900 underline"
                            >
                              {t('dashboard.viewDetails')}
                            </a>
                            <span className="text-gray-300">|</span>
                            <a
                              href={`http://localhost:6001/api/session/${encodeURIComponent(session.id)}/pdf?lang=${locale}`}
                              target="_blank"
                              onClick={(e) => {
                                // 双重验证 sessionId
                                if (!session.id || session.id === '<id>' || session.id === '[id]' || session.id.includes('<') || session.id.includes('>') || session.id.length <= 10) {
                                  e.preventDefault();
                                  alert(locale === 'zh' 
                                    ? `无效的会话ID: ${session.id}。请刷新页面重试。`
                                    : `Invalid session ID: ${session.id}. Please refresh the page and try again.`);
                                  return false;
                                }
                                console.log('Downloading PDF for session:', session.id);
                                console.log('PDF URL:', `http://localhost:6001/api/session/${encodeURIComponent(session.id)}/pdf?lang=${locale}`);
                              }}
                              className="text-green-600 hover:text-green-900 underline font-medium"
                            >
                              {t('dashboard.downloadPDF')}
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400" title={session.id || 'No ID'}>
                            {t('dashboard.actions')} (ID: {session.id || 'N/A'})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p>{t('dashboard.totalSessions').replace('{count}', sessions.length.toString())}</p>
        </div>
      </div>
    </div>
  );
}

