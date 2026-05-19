'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit2, FiUsers } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/lib/hooks/useAuth';
import { listInvites, togglePublished } from '@/lib/invites/client';
import type { Invite } from '@/lib/invites/types';

export default function AdminInvitesPage() {
  const { user, loading, isAdmin, isOwner } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = isAdmin || isOwner;

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !canManage) return;
    listInvites()
      .then(setInvites)
      .catch(e => setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.'))
      .finally(() => setListLoading(false));
  }, [user, canManage]);

  const handleToggle = async (inv: Invite) => {
    const next = !inv.isPublished;
    setInvites(prev => prev.map(i => (i.id === inv.id ? { ...i, isPublished: next } : i)));
    try {
      await togglePublished(inv.id, next);
    } catch {
      setError('공개 상태 변경 실패');
      setInvites(prev => prev.map(i => (i.id === inv.id ? { ...i, isPublished: !next } : i)));
    }
  };

  if (loading) return <FullPageMessage message="로그인 정보를 확인 중입니다…" />;
  if (!user) return null;
  if (!canManage) return <NotAuthorized />;

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">초청 신청 관리</h1>
            <p className="text-sm text-gray-500 mt-1">정기공연 공개 페이지와 신청자를 관리합니다.</p>
          </div>
          <Link
            href="/admin/invites/new"
            className="inline-flex items-center gap-1 px-4 py-2 bg-[#0066B3] text-white rounded-lg text-sm font-medium hover:bg-[#0055a0]"
          >
            <FiPlus /> 새 공연
          </Link>
        </header>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {listLoading ? (
          <p className="text-center text-gray-400 py-12">불러오는 중…</p>
        ) : invites.length === 0 ? (
          <div className="text-center text-gray-500 py-16 bg-gray-50 rounded-xl">
            등록된 공연이 없습니다.
            <br />
            <Link href="/admin/invites/new" className="inline-block mt-3 text-[#0066B3] underline">
              첫 공연 만들기
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {invites.map(inv => (
              <li
                key={inv.id}
                className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">
                    {inv.year}년 {inv.round}회 · ID <code>{inv.id}</code>
                  </div>
                  <div className="text-base font-semibold text-gray-900 mt-0.5">{inv.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    신청 {inv.stats?.totalRegistrations ?? 0}건 · 총 {inv.stats?.totalHeadcount ?? 0}명 · 후원 {inv.stats?.totalSponsors ?? 0}명
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(inv)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      inv.isPublished
                        ? 'bg-[#0066B3] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {inv.isPublished ? '공개됨' : '비공개'}
                  </button>
                  <Link
                    href={`/admin/invites/${inv.year}/${inv.round}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0066B3] hover:bg-blue-50 rounded-lg"
                  >
                    <FiUsers /> 신청자
                  </Link>
                  <Link
                    href={`/admin/invites/${inv.year}/${inv.round}/edit`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <FiEdit2 /> 수정
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}

function FullPageMessage({ message }: { message: string }) {
  return <div className="min-h-dvh flex items-center justify-center text-gray-500">{message}</div>;
}

function NotAuthorized() {
  return (
    <>
      <Header />
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-gray-800">접근 권한이 없습니다</h1>
        <p className="text-sm text-gray-500 mt-2">관리자만 접근할 수 있는 페이지입니다.</p>
      </main>
      <Footer />
    </>
  );
}
