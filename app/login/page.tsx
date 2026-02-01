'use client';

/**
 * 로그인 페이지
 */

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-primary text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.svg"
              alt="No.S 로고"
              width={80}
              height={80}
              className="drop-shadow-md"
            />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">No.S</h1>
          <p className="text-xl text-gray-600 mb-1">넘버에스</p>
          <p className="text-sm text-gray-500">삼성전자 뮤지컬 동호회</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-700 text-center mb-4">
            동호회 예약 현황을 공유하려면
            <br />
            Google 계정으로 로그인하세요
          </p>
          <GoogleSignInButton />
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>회원만 이용할 수 있는 서비스입니다</p>
        </div>
      </div>
    </div>
  );
}
