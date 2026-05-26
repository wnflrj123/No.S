'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Invite, InviteRegistration, InviteSupporter } from '@/lib/invites/types';
import StatsCards from '../../_components/StatsCards';
import RegistrationsTable from '../../_components/RegistrationsTable';
import AnswersDigest from '../../_components/AnswersDigest';
import SponsorsTab from '../../_components/SponsorsTab';
import BulkSmsPanel from '../../_components/BulkSmsPanel';

type Tab = 'all' | 'answers' | 'sponsors';

export default function InviteAdminDetailPage() {
  const params = useParams<{ year: string; round: string }>();
  const router = useRouter();
  const { user, loading, isAdmin, isOwner } = useAuth();
  const canManage = isAdmin || isOwner;

  const [invite, setInvite] = useState<Invite | null | undefined>(undefined);
  const [regs, setRegs] = useState<InviteRegistration[]>([]);
  const [supporters, setSupporters] = useState<InviteSupporter[]>([]);
  const [regsLoading, setRegsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !canManage) return;
    const y = Number(params.year);
    const r = Number(params.round);
    if (!y || !r) {
      setRegsLoading(false);
      return;
    }
    let cancelled = false;

    // 어드민 대시보드 번들 API로 invite/regs/supporters를 한 번에 fetch.
    // 기존 3개 client SDK 호출을 1회 fetch + 서버 admin SDK 병렬 read로 대체.
    (async () => {
      try {
        const idToken = await getAuth().currentUser?.getIdToken();
        if (!idToken) {
          if (!cancelled) {
            setError('로그인 정보를 확인해주세요.');
            setRegsLoading(false);
          }
          return;
        }
        const res = await fetch(`/api/admin/invites/${y}/${r}/dashboard`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) {
          if (!cancelled) {
            setError('데이터를 불러오지 못했습니다.');
            setInvite(null);
          }
          return;
        }
        const data = (await res.json()) as {
          invite: Invite | null;
          registrations: InviteRegistration[];
          supporters: InviteSupporter[];
        };
        if (cancelled) return;
        setInvite(data.invite);
        setRegs(data.registrations);
        setSupporters(data.supporters);
      } catch (err) {
        console.error('[admin dashboard] load failed', err);
        if (!cancelled) setError('네트워크 오류가 발생했습니다.');
      } finally {
        if (!cancelled) setRegsLoading(false);
      }
    })();

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-gray-500">{params.year}년 {params.round}회</div>
            <h1 className="text-2xl font-bold text-gray-900">{invite?.title ?? '신청자 관리'}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href={`/invite/${params.year}/${params.round}/wall`}
              target="_blank"
              className="px-3 py-1.5 bg-[#0066B3] text-white rounded-lg font-medium hover:bg-[#0055a0]"
            >
              💐 후원자 Wall 열기
            </Link>
            <Link href="/admin/invites" className="text-gray-500 hover:text-gray-700">
              ← 목록으로
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {invite === undefined || regsLoading ? (
          <p className="text-center text-gray-400 py-16">불러오는 중…</p>
        ) : invite === null ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <p className="text-gray-700 font-medium">존재하지 않는 공연입니다.</p>
            <Link href="/admin/invites" className="inline-block mt-4 text-sm text-[#0066B3] underline">
              목록으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            <StatsCards invite={invite} registrations={regs} supporters={supporters} />

            <div className="mt-6">
              <BulkSmsPanel invite={invite} registrations={regs} />
            </div>

            <nav className="mt-8 border-b border-gray-200 flex">
              <TabButton active={tab === 'all'} onClick={() => setTab('all')}>
                전체 신청자 ({regs.length})
              </TabButton>
              <TabButton active={tab === 'answers'} onClick={() => setTab('answers')}>
                항목별 답변
              </TabButton>
              <TabButton active={tab === 'sponsors'} onClick={() => setTab('sponsors')}>
                후원자 ({regs.filter(r => r.isSponsor && (r.status ?? 'active') === 'active').length + supporters.length})
              </TabButton>
            </nav>

            <section className="mt-6">
              {tab === 'all' && (
                <RegistrationsTable
                  registrations={regs}
                  year={Number(params.year)}
                  round={Number(params.round)}
                  onDeleted={regId => setRegs(prev => prev.filter(r => r.id !== regId))}
                  onSponsorChanged={(regId, isSponsor) =>
                    setRegs(prev => prev.map(r => (r.id === regId ? { ...r, isSponsor } : r)))
                  }
                />
              )}
              {tab === 'answers' && <AnswersDigest registrations={regs} />}
              {tab === 'sponsors' && (
                <SponsorsTab
                  registrations={regs}
                  supporters={supporters}
                  year={Number(params.year)}
                  round={Number(params.round)}
                  onSupporterAdded={s => setSupporters(prev => [s, ...prev])}
                  onSupporterDeleted={id => setSupporters(prev => prev.filter(x => x.id !== id))}
                />
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-[#0066B3] text-[#0066B3]' : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  );
}
