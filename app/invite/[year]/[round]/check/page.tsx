import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getInvite } from '@/lib/invites/server';
import CheckForm from '../_components/CheckForm';

export const dynamic = 'force-dynamic';

interface PageParams {
  params: Promise<{ year: string; round: string }>;
}

export default async function CheckPage({ params }: PageParams) {
  const { year, round } = await params;
  const invite = await getInvite(year, round);
  if (!invite || !invite.isPublished) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 pb-16">
      <header className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          {invite.overline?.trim() && (
            <div className="text-xs font-semibold text-[#0066B3] mb-1">{invite.overline}</div>
          )}
          <div className="text-xs text-gray-500">{invite.year}년 {invite.round}회</div>
          <h1 className="text-xl font-bold text-gray-900 mt-0.5">{invite.title} 신청 확인</h1>
          {invite.subtitle && (
            <p className="text-sm text-gray-600 mt-0.5">{invite.subtitle}</p>
          )}
        </div>
        <Link
          href={`/invite/${year}/${round}`}
          className="text-sm text-gray-500 hover:text-gray-700 shrink-0 mt-1"
        >
          ← 공연 정보
        </Link>
      </header>

      <p className="text-sm text-gray-600 mb-6">
        신청하신 이름과 휴대폰 번호를 입력하시면 신청 내역을 확인하실 수 있어요.
      </p>

      <CheckForm year={invite.year} round={invite.round} />
    </main>
  );
}
