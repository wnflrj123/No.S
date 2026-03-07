'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FiChevronRight, FiBell, FiX } from 'react-icons/fi';

interface PinnedNotice {
  id: string;
  title: string;
  createdAt: Date;
}

export default function Home() {
  const { user } = useAuth();
  const [pinnedNotices, setPinnedNotices] = useState<PinnedNotice[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // 로그인 시 고정 공지사항 가져오기
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notices'),
      where('pinned', '==', true)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data: PinnedNotice[] = snapshot.docs.map((d) => ({
          id: d.id,
          title: d.data().title,
          createdAt: d.data().createdAt?.toDate() || new Date(),
        }));
        data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setPinnedNotices(data);
      },
      (error) => {
        console.error('고정 공지 조회 실패:', error);
      }
    );

    return () => unsub();
  }, [user]);

  const visiblePinned = pinnedNotices.filter((n) => !dismissedIds.has(n.id));

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Pinned Notice Banner */}
      {user && visiblePinned.length > 0 && (
        <div className="bg-primary text-white">
          <div className="max-w-5xl mx-auto px-6">
            {visiblePinned.map((notice, i) => (
              <div
                key={notice.id}
                className={`flex items-center gap-3 py-3 ${i > 0 ? 'border-t border-white/15' : ''}`}
              >
                <div className="shrink-0 w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiBell size={13} />
                </div>
                <Link
                  href={`/notices?id=${notice.id}`}
                  className="flex-1 min-w-0 flex items-center gap-2 group"
                >
                  <span className="text-[13px] sm:text-sm font-semibold truncate group-hover:underline">
                    📌 {notice.title}
                  </span>
                  <FiChevronRight size={14} className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                </Link>
                <button
                  onClick={() =>
                    setDismissedIds((prev) => new Set([...prev, notice.id]))
                  }
                  className="shrink-0 w-7 h-7 flex items-center justify-center hover:bg-white/15 rounded-lg transition-colors opacity-70 hover:opacity-100"
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              {/* Text */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight animate-fade-in-up">
                  연습실 예약,<br />이제 한눈에
                </h1>
                <p className="text-base md:text-lg text-gray-400 mb-10 leading-relaxed animate-fade-in-up animation-delay-100" style={{ color: '#8b95a1' }}>
                  누가, 언제, 어디서 연습하는지<br />
                  더 이상 물어보지 않아도 돼요
                </p>

                <div className="animate-fade-in-up animation-delay-200">
                  {user ? (
                    <Link
                      href="/reservations"
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white text-[15px] font-semibold rounded-xl hover:bg-primary-dark transition-all"
                    >
                      예약 현황 보러가기
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-0.5">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white text-[15px] font-semibold rounded-xl hover:bg-primary-dark transition-all"
                    >
                      3초만에 시작하기
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-0.5">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  )}
                </div>
              </div>

              {/* 3D Illustration */}
              <div className="flex-1 animate-fade-in-up animation-delay-200">
                <div className="animate-float">
                  <Image
                    src="/hero-illustration.svg"
                    alt="예약 캘린더 일러스트"
                    width={560}
                    height={440}
                    className="w-full max-w-lg mx-auto"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notice Section */}
        <section className="py-24 md:py-32 px-6 bg-secondary">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              {/* Illustration */}
              <div className="flex-1 animate-fade-in-up animation-delay-200">
                <div className="animate-float" style={{ animationDelay: '0.5s' }}>
                  <Image
                    src="/notice-illustration.svg"
                    alt="공지사항 일러스트"
                    width={560}
                    height={440}
                    className="w-full max-w-lg mx-auto"
                  />
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-primary font-semibold text-sm mb-4 tracking-wide animate-fade-in-up">놓치지 마세요</p>
                <h2 className="text-3xl md:text-[40px] font-bold text-foreground mb-6 tracking-tight leading-tight animate-fade-in-up animation-delay-100">
                  중요한 소식,<br />한곳에서 확인해요
                </h2>
                <p className="text-base leading-relaxed animate-fade-in-up animation-delay-200" style={{ color: '#6b7684' }}>
                  공연 안내, 연습 일정 변경, 회비 안내까지.<br />
                  동호회의 모든 공지사항을<br />
                  빠르고 간편하게 확인할 수 있어요.
                </p>
                {user && (
                  <div className="mt-8 animate-fade-in-up animation-delay-300">
                    <Link
                      href="/notices"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all"
                    >
                      공지사항 보러가기
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-0.5">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* About Section - with stage illustration */}
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              {/* Text */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-primary font-semibold text-sm mb-4 tracking-wide animate-fade-in-up">No.S를 소개해요</p>
                <h2 className="text-3xl md:text-[40px] font-bold text-foreground mb-6 tracking-tight leading-tight animate-fade-in-up animation-delay-100">
                  같은 무대를 꿈꾸는<br />사람들이 모였어요
                </h2>
                <p className="text-base leading-relaxed animate-fade-in-up animation-delay-200" style={{ color: '#6b7684' }}>
                  관람도 좋고, 직접 서는 무대는 더 좋으니까요.<br />
                  No.S는 그런 마음이 모여 만들어진<br />
                  삼성전자 뮤지컬 동호회예요.
                </p>
              </div>

              {/* Stage Illustration */}
              <div className="flex-1 animate-fade-in-up animation-delay-200">
                <div className="animate-float" style={{ animationDelay: '1s' }}>
                  <Image
                    src="/stage-illustration.svg"
                    alt="뮤지컬 무대 일러스트"
                    width={560}
                    height={360}
                    className="w-full max-w-lg mx-auto rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Activities Section */}
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm mb-4 tracking-wide animate-fade-in-up">우리는 이런 걸 해요</p>
              <h2 className="text-3xl md:text-[40px] font-bold text-foreground tracking-tight leading-tight animate-fade-in-up animation-delay-100">
                보고, 연습하고,<br />무대에 서요
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-7 bg-secondary rounded-2xl animate-fade-in-up animation-delay-200 hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl mb-5 shadow-sm">🎭</div>
                <h3 className="text-[17px] font-bold text-foreground mb-2">함께 보는 즐거움</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b95a1' }}>
                  좋은 공연은 나누면 두 배가 되더라고요. 함께 관람하고, 이야기 나눠요.
                </p>
              </div>

              <div className="p-7 bg-secondary rounded-2xl animate-fade-in-up animation-delay-300 hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl mb-5 shadow-sm">🎵</div>
                <h3 className="text-[17px] font-bold text-foreground mb-2">직접 만드는 무대</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b95a1' }}>
                  보는 것만으로는 부족했던 분들, 여기서 직접 무대에 서보세요.
                </p>
              </div>

              <div className="p-7 bg-secondary rounded-2xl animate-fade-in-up animation-delay-400 hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl mb-5 shadow-sm">📅</div>
                <h3 className="text-[17px] font-bold text-foreground mb-2">깔끔한 예약 관리</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b95a1' }}>
                  &quot;그 날 연습실 비어있나요?&quot; 이제 여기서 바로 확인할 수 있어요.
                </p>
              </div>

              <div className="p-7 bg-secondary rounded-2xl animate-fade-in-up animation-delay-500 hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl mb-5 shadow-sm">🤝</div>
                <h3 className="text-[17px] font-bold text-foreground mb-2">편하게 소통해요</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b95a1' }}>
                  일정 공유부터 연습 조율까지, 회원들과 자연스럽게 연결돼요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 md:py-32 px-6 bg-secondary">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold text-sm mb-4 tracking-wide animate-fade-in-up">이런 걸 할 수 있어요</p>
              <h2 className="text-3xl md:text-[40px] font-bold text-foreground tracking-tight leading-tight animate-fade-in-up animation-delay-100">
                복잡한 건 빼고,<br />필요한 것만 담았어요
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-7 bg-white rounded-2xl animate-fade-in-up animation-delay-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-xl mb-5">📍</div>
                <h3 className="text-[15px] font-bold text-foreground mb-2">한눈에 보는 현황</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b95a1' }}>
                  오늘, 내일, 이번 주 예약을 캘린더에서 바로 확인해요
                </p>
              </div>

              <div className="p-7 bg-white rounded-2xl animate-fade-in-up animation-delay-300 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-xl mb-5">✏️</div>
                <h3 className="text-[15px] font-bold text-foreground mb-2">쉬운 예약 등록</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b95a1' }}>
                  회사에서 잡은 연습실, 여기에 공유만 하면 끝이에요
                </p>
              </div>

              <div className="p-7 bg-white rounded-2xl animate-fade-in-up animation-delay-400 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-xl mb-5">📢</div>
                <h3 className="text-[15px] font-bold text-foreground mb-2">공지사항 확인</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b95a1' }}>
                  동호회 소식과 안내를 놓치지 않고 확인할 수 있어요
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 md:py-32 px-6 bg-foreground overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute w-[600px] h-[600px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary/20 to-accent/10 blur-[120px]" />
          </div>

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight animate-fade-in-up">
              시작은 가볍게,<br />무대는 멋지게
            </h2>
            <p className="text-lg mb-10 animate-fade-in-up animation-delay-100" style={{ color: '#8b95a1' }}>
              No.S 회원이라면 누구나 쓸 수 있어요
            </p>
            <div className="animate-fade-in-up animation-delay-200">
              {user ? (
                <Link
                  href="/reservations"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-foreground text-[15px] font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  예약 현황 보러가기
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-foreground text-[15px] font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  지금 시작하기
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
