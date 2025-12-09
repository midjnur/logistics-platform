import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function Home() {
  const t = useTranslations('HomePage');
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <p className="text-xl">{t('subtitle')}</p>

        <div className="flex gap-4">
          <Link href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Login
          </Link>
          <Link href="/auth/register" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
