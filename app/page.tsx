'use client';

/**
 * 메인 랜딩 페이지
 */

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.svg"
                alt="No.S 로고"
                width={120}
                height={120}
                className="drop-shadow-lg"
                priority
              />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-primary mb-4">
              No.S
            </h1>
            <p className="text-3xl md:text-4xl text-gray-700 mb-6">넘버에스</p>
            <p className="text-xl text-gray-600 mb-12">
              삼성전자 뮤지컬 동호회 예약 공유 플랫폼
            </p>

            {user ? (
              <Link
                href="/reservations"
                className="inline-block px-8 py-4 bg-primary text-white text-lg font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                예약 현황 보기
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-block px-8 py-4 bg-primary text-white text-lg font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                시작하기
              </Link>
            )}
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
              동호회 소개
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 bg-blue-50 rounded-xl">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  🎭 뮤지컬 감상
                </h3>
                <p className="text-gray-700">
                  다양한 뮤지컬 공연을 함께 관람하고 감상을 나눕니다
                </p>
              </div>

              <div className="p-6 bg-blue-50 rounded-xl">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  🎵 공연 활동
                </h3>
                <p className="text-gray-700">
                  동호회 회원들과 함께 연습하고 공연을 준비합니다
                </p>
              </div>

              <div className="p-6 bg-blue-50 rounded-xl">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  📅 예약 공유
                </h3>
                <p className="text-gray-700">
                  연습실 예약 현황을 공유하여 효율적으로 관리합니다
                </p>
              </div>

              <div className="p-6 bg-blue-50 rounded-xl">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  🤝 소통과 협업
                </h3>
                <p className="text-gray-700">
                  회원들과 활발하게 소통하며 즐거운 활동을 이어갑니다
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              주요 기능
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-xl shadow-md">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  예약 현황 확인
                </h3>
                <p className="text-gray-600 text-sm">
                  날짜별로 동호회 예약 현황을 한눈에 확인하세요
                </p>
              </div>

              <div className="p-6 bg-white rounded-xl shadow-md">
                <div className="text-4xl mb-4">✏️</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  예약 정보 등록
                </h3>
                <p className="text-gray-600 text-sm">
                  회사 시스템에서 예약한 내용을 쉽게 공유하세요
                </p>
              </div>

              <div className="p-6 bg-white rounded-xl shadow-md">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  회원 전용
                </h3>
                <p className="text-gray-600 text-sm">
                  Google 계정으로 간편하게 로그인하세요
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
