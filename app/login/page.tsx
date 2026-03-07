'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { FiExternalLink } from 'react-icons/fi';

function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /KAKAOTALK|NAVER|LINE|Instagram|FB_IAB|FBAN|FBAV|Twitter|Snapchat|SamsungBrowser\/\d.*Mobile VR/i.test(ua)
    || (/iPhone|iPad|iPod|Android/i.test(ua) && !/Safari/i.test(ua) && !/Chrome/i.test(ua));
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [inApp, setInApp] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleOpenExternal = () => {
    const url = window.location.href;
    // Android: intent scheme으로 외부 브라우저 열기
    if (/Android/i.test(navigator.userAgent)) {
      window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }
    // iOS: Safari로 열기 시도
    window.open(url, '_system');
  };

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

        {inApp ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full p-4 bg-orange-50 rounded-2xl text-center">
              <p className="text-sm font-medium text-orange-700 mb-1">
                인앱 브라우저에서는 구글 로그인이 제한돼요
              </p>
              <p className="text-xs text-orange-500">
                외부 브라우저(Chrome, Safari)에서 열어주세요
              </p>
            </div>
            <button
              onClick={handleOpenExternal}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors active:scale-[0.98]"
            >
              <FiExternalLink size={16} />
              외부 브라우저에서 열기
            </button>
            <p className="text-xs text-center" style={{ color: '#b0b8c1' }}>
              또는 브라우저 메뉴에서 &quot;기본 브라우저로 열기&quot;를 선택해주세요
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <GoogleSignInButton />
          </div>
        )}

        <p className="mt-10 text-center text-xs text-gray-300">
          No.S 회원만 이용할 수 있는 서비스예요
        </p>
      </div>
    </div>
  );
}
