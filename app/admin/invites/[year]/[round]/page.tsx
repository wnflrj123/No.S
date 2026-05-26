'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Invite, InviteRegistration, InviteSupporter } from '@/lib/invites/types';
import StatsCards from '../../_components/StatsCards';
import RegistrationsTable from '../../_components/RegistrationsTable';
import BulkSmsPanel from '../../_components/BulkSmsPanel';

// 기본 탭이 아닌 컴포넌트는 코드 스플리팅 — 초기 번들 축소.
const AnswersDigest = dynamic(() => import('../../_components/AnswersDigest'), { ssr: false });
const SponsorsTab = dynamic(() => import('../../_components/SponsorsTab'), { ssr: false });

type Tab = 'all' | 'answers' | 'sponsors';

interface DashboardCache {
  invite: Invite | null;
  registrations: InviteRegistration[];
  supporters: InviteSupporter[];
  cachedAt: number;
}

const CACHE_TTL_MS = 30 * 1000; // 30초 — 그 이후엔 stale 표시 후 refetch

function cacheKey(year: string | number, round: string | number): string {
  return `admin-dashboard:${year}-${round}`;
}

function readCache(year: string | number, round: string | number): DashboardCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(year, round));
    if (!raw) return null;
    return JSON.parse(raw) as DashboardCache;
  } catch {
    return null;
  }
}

function writeCache(year: string | number, round: string | number, data: Omit<DashboardCache, 'cachedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: DashboardCache = { ...data, cachedAt: Date.now() };
    sessionStorage.setItem(cacheKey(year, round), JSON.stringify(entry));
  } catch {
    // 용량 초과 등 무시
  }
}

export default function InviteAdminDetailPage() {
  const params = useParams<{ year: string; round: string }>();
  const router = useRouter();
  const { user, loading, isAdmin, isOwner } = useAuth();
  const canManage = isAdmin || isOwner;

  const [invite, setInvite] = useState<Invite | null | undefined>(undefined);
  const [regs, setRegs] = useState<InviteRegistration[]>([]);
  const [supporters, setSupporters] = useState<InviteSupporter[]>([]);
  const [regsLoading, setRegsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('all');

  // 인증 완료 + 권한 없을 때만 로그인으로 보냄. canManage는 user 로드 후에야 의미가 있다.
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  // SWR: sessionStorage 캐시가 있으면 즉시 화면에 표시하고, 백그라운드에서 fresh fetch.
  useEffect(() => {
    if (!user || !canManage) return;
    const y = Number(params.year);
    const r = Number(params.round);
    if (!y || !r) {
      setRegsLoading(false);
      return;
    }

    // Step 1: 캐시 hit이면 즉시 화면에 그리기
    const cached = readCache(y, r);
    const hasFreshCache = cached && Date.now() - cached.cachedAt < CACHE_TTL_MS;
    if (cached) {
      setInvite(cached.invite);
      setRegs(cached.registrations);
      setSupporters(cached.supporters);
      setRegsLoading(false);
      // fresh 캐시는 fetch 자체를 생략 — 30초 내 재방문은 0 round-trip
      if (hasFreshCache) return;
      // stale 캐시: 화면은 띄우되 백그라운드로 갱신
      setRefreshing(true);
    }

    let cancelled = false;
    (async () => {
      try {
        const idToken = await getAuth().currentUser?.getIdToken();
        if (!idToken) {
          if (!cancelled) {
            setError('로그인 정보를 확인해주세요.');
            setRegsLoading(false);
            setRefreshing(false);
          }
          return;
        }
        const res = await fetch(`/api/admin/invites/${y}/${r}/dashboard`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) {
          if (!cancelled && !cached) {
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
        writeCache(y, r, data);
      } catch (err) {
        console.error('[admin dashboard] load failed', err);
        if (!cancelled && !cached) setError('네트워크 오류가 발생했습니다.');
      } finally {
        if (!cancelled) {
          setRegsLoading(false);
          setRefreshing(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [user, canManage, params.year, params.round]);

  // 인증 로딩 중에도 페이지 셸은 렌더 — blank screen 방지.
  if (!loading && !user) return null;
  if (!loading && user && !canManage) {
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

  const initialLoading = invite === undefined || regsLoading;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-gray-500">{params.year}년 {params.round}회</div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {invite?.title ?? '신청자 관리'}
              {refreshing && (
                <span className="text-xs font-normal text-gray-400">갱신 중…</span>
              )}
            </h1>
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

        {initialLoading ? (
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
