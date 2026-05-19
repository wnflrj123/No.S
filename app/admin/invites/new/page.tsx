'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import InviteForm from '../_components/InviteForm';
import { useAuth } from '@/lib/hooks/useAuth';

export default function NewInvitePage() {
  const { user, loading, isAdmin, isOwner } = useAuth();
  const router = useRouter();
  const canManage = isAdmin || isOwner;

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

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
          <h1 className="text-2xl font-bold text-gray-900">새 공연 만들기</h1>
          <Link href="/admin/invites" className="text-sm text-gray-500 hover:text-gray-700">
            ← 목록으로
          </Link>
        </header>
        <InviteForm
          initial={null}
          createdBy={user.uid}
          onSaved={(year, round) => router.push(`/admin/invites/${year}/${round}/edit`)}
        />
      </main>
      <Footer />
    </>
  );
}
