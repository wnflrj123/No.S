'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-white px-6 overflow-hidden">
      {/* Background orbs */}
      <div className="orb orb-1 top-10 -right-40" />
      <div className="orb orb-2 -bottom-20 -left-20" />

      <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <Image
            src="/logo.svg"
            alt="No.S 로고"
            width={56}
            height={56}
            className="mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">돌아오셨군요!</h1>
          <p className="text-sm text-gray-400">로그인하고 예약 현황을 확인해 보세요</p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <GoogleSignInButton />
        </div>

        <p className="mt-10 text-center text-xs text-gray-300">
          No.S 회원만 이용할 수 있는 서비스예요
        </p>
      </div>
    </div>
  );
}
