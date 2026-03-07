'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.svg"
              alt="No.S 로고"
              width={32}
              height={32}
            />
            <span className="text-lg font-bold text-foreground tracking-tight">No.S</span>
          </Link>

          <nav className="flex items-center gap-2">
            {user && (
              <Link
                href="/reservations"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors"
              >
                예약 현황
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || '사용자'}
                      className="w-7 h-7 rounded-full ring-2 ring-gray-100"
                    />
                  )}
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {user.displayName}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 text-sm font-medium bg-foreground text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
