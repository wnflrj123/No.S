'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ACCESS_TOKEN_LENGTH } from '@/lib/invites/constants';
import ThanksContent, { type ThanksContentProps } from '../../_components/ThanksContent';

export default function ThanksPage() {
  const params = useParams<{ year: string; round: string; token: string }>();
  const isInvalidToken = !params.token || params.token.length !== ACCESS_TOKEN_LENGTH;
  const [data, setData] = useState<ThanksContentProps | null | undefined>(
    isInvalidToken ? null : undefined,
  );

  useEffect(() => {
    if (isInvalidToken) return;
    const token = params.token;

    // 1. sessionStorage 캐시 우선 (신청 직후 ApplyForm이 저장한 데이터)
    try {
      const cached = sessionStorage.getItem(`invite-thanks:${token}`);
      if (cached) {
        const parsed = JSON.parse(cached) as ThanksContentProps;
        if (parsed?.token === token) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage는 client-only라 effect에서만 접근 가능
          setData(parsed);
          return;
        }
      }
    } catch {
      // 무시하고 API fetch fallback
    }

    // 2. 새로고침/직접 진입 시 API로 데이터 fetch
    let cancelled = false;
    fetch(`/api/invites/${params.year}/${params.round}/thanks/${token}`)
      .then(async r => {
        if (!r.ok) return null;
        return (await r.json()) as ThanksContentProps;
      })
      .then(d => {
        if (cancelled) return;
        setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [params.year, params.round, params.token, isInvalidToken]);

  if (data === undefined) {
    return (
      <main className="min-h-dvh flex items-center justify-center text-gray-400 text-sm">
        불러오는 중…
      </main>
    );
  }

  if (data === null) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-5 text-center">
        <div className="text-4xl mb-3">😅</div>
        <p className="text-gray-700 font-medium">신청 내역을 찾을 수 없습니다</p>
        <p className="text-sm text-gray-500 mt-1">링크가 만료되었거나 잘못된 주소일 수 있어요.</p>
      </main>
    );
  }

  return <ThanksContent {...data} />;
}
