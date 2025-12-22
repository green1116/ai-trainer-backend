import { redirect } from 'next/navigation';

/**
 * 根页面
 * 重定向到 dashboard
 */
export default function HomePage() {
  redirect('/dashboard');
}

