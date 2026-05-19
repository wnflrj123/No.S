'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import InviteForm from '../../../_components/InviteForm';
import { getInviteClient } from '@/lib/invites/client';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Invite } from '@/lib/invites/types';

export default function EditInvitePage() {
  const params = useParams<{ year: string; round: string }>();
  const router = useRouter();
  const { user, loading, isAdmin, isOwner } = useAuth();
  const canManage = isAdmin || isOwner;
  const [invite, setInvite] = useState<Invite | null | undefined>(undefined);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !canManage) return;
    const y = Number(params.year);
    const r = Number(params.round);
    const loadPromise = (!y || !r) ? Promise.resolve(null) : getInviteClient(y, r);
    let cancelled = false;
    loadPromise
      .then(result => { if (!cancelled) setInvite(result); })
      .catch(() => { if (!cancelled) setInvite(null); });
    return () => { cancelled = true; };
  }, [user, canManage, params.year, params.round]);

  if (loading) return null;
  if (!user) return null;
  if (!canManage) {
    return (
      <>
        <Header />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <h1 className="text-xl font-bold">접근 권한이 없습니다</h1>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">{params.year}년 {params.round}회</div>
            <h1 className="text-2xl font-bold text-gray-900">공연 정보 수정</h1>
          </div>
          <Link href="/admin/invites" className="text-sm text-gray-500 hover:text-gray-700">
            ← 목록으로
          </Link>
        </header>

        {invite === undefined ? (
          <p className="text-center text-gray-400 py-12">불러오는 중…</p>
        ) : invite === null ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-700 font-medium">존재하지 않는 공연입니다.</p>
            <p className="text-sm text-gray-500 mt-1">URL을 확인하거나 새 공연을 만들어주세요.</p>
            <div className="mt-4 flex gap-2 justify-center">
              <Link href="/admin/invites" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">목록으로</Link>
              <Link href="/admin/invites/new" className="px-4 py-2 bg-[#0066B3] text-white rounded-lg text-sm">새 공연 만들기</Link>
            </div>
          </div>
        ) : (
          <InviteForm
            initial={invite}
            createdBy={user.uid}
            onSaved={() => router.push('/admin/invites')}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
