'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

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

        {/* About Section - with stage illustration */}
        <section className="py-24 md:py-32 px-6 bg-secondary">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
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
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-xl mb-5">🔒</div>
                <h3 className="text-[15px] font-bold text-foreground mb-2">회원 전용 공간</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b95a1' }}>
                  Google 계정 하나로, 우리끼리만 쓰는 공간이에요
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
