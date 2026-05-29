'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layout/Header';
import CheersForActors, {
  type CheersActor,
  type CheersItem,
} from '@/app/invite/[year]/[round]/_components/CheersForActors';

interface CheersData {
  invite: {
    id: string;
    year: number;
    round: number;
    title: string;
    overline?: string;
    isPublished: boolean;
  };
  actors: CheersActor[];
  items: CheersItem[];
  totalRegistrations: number;
  totalSeats: number;
  roundStats: Array<{ roundNo: number; teamName: string; headcount: number }>;
}

export default function CheersPage() {
  const params = useParams<{ year: string; round: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [data, setData] = useState<CheersData | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // 비로그인 → 로그인 페이지로 보냄. (login 페이지는 next param 미지원이라 그대로 보냄)
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const idToken = await getAuth().currentUser?.getIdToken();
        if (!idToken) {
          if (!cancelled) setError('로그인 정보를 확인해주세요.');
          return;
        }
        const res = await fetch(`/api/cheers/${params.year}/${params.round}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.status === 401) {
          if (!cancelled) router.replace('/login');
          return;
        }
        if (res.status === 404) {
          if (!cancelled) setData(null);
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError('데이터를 불러오지 못했습니다.');
          return;
        }
        const json = (await res.json()) as CheersData;
        if (!cancelled) setData(json);
      } catch (err) {
        console.error('[cheers] load failed', err);
        if (!cancelled) setError('네트워크 오류가 발생했습니다.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, params.year, params.round, router]);

  // 브라우저 탭 타이틀
  useEffect(() => {
    if (data?.invite?.title) {
      document.title = `배우 응원 | ${data.invite.title}`;
    } else {
      document.title = '배우 응원';
    }
  }, [data]);

  if (loading || data === undefined) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center bg-[#FAF7F2]">
          <p className="text-sm text-gray-400">불러오는 중…</p>
        </main>
      </>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex flex-col items-center justify-center bg-[#FAF7F2] px-5">
          <p className="text-sm text-red-600 text-center">{error}</p>
          <button
            type="button"
            onClick={() => location.reload()}
            className="mt-4 px-4 py-2 text-sm bg-[#0066B3] text-white rounded-lg hover:bg-[#0055a0]"
          >
            다시 시도
          </button>
        </main>
      </>
    );
  }

  if (data === null || !data.invite.isPublished) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex flex-col items-center justify-center bg-[#FAF7F2] px-5 text-center">
          <h1 className="text-xl font-bold text-gray-900">존재하지 않거나 비공개된 페이지예요</h1>
          <p className="mt-2 text-sm text-gray-500">{params.year}년 {params.round}회</p>
          <Link
            href="/"
            className="mt-5 px-4 py-2 text-sm bg-[#0066B3] text-white rounded-lg hover:bg-[#0055a0]"
          >
            홈으로
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <CheersForActors
        invite={data.invite}
        actors={data.actors}
        items={data.items}
        totalRegistrations={data.totalRegistrations}
        totalSeats={data.totalSeats}
        roundStats={data.roundStats}
      />
    </>
  );
}
