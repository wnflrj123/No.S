'use client';

import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/lib/hooks/useAuth';
import { useState } from 'react';

export default function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
    >
      <FcGoogle className="text-xl" />
      <span>{isLoading ? '로그인 중...' : 'Google로 계속하기'}</span>
    </button>
  );
}
