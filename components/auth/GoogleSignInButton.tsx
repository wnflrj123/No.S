'use client';

/**
 * Google 로그인 버튼 컴포넌트
 */

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
      className="flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
    >
      <FcGoogle className="text-2xl" />
      <span className="font-medium text-gray-700">
        {isLoading ? '로그인 중...' : 'Google로 로그인'}
      </span>
    </button>
  );
}
