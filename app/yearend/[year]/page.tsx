import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getYearEndConcert, listCast, listYearEndYears } from '@/lib/yearend';
import Hero from './_components/Hero';
import Program, { StickyNav } from './_components/Program';
import Cast from './_components/Cast';
import Visit from './_components/Visit';
import { ACCENTS, TEXT } from './_components/theme';
import { Garland } from './_components/ChristmasDecor';
import ScrollTopButton from './_components/ScrollTopButton';

interface PageParams {
  params: Promise<{ year: string }>;
}

// 데이터 파일에 있는 연도만 페이지로 만든다. 그 외 연도는 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return listYearEndYears().map(year => ({ year: String(year) }));
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { year } = await params;
  const concert = getYearEndConcert(year);
  if (!concert) return { title: '존재하지 않는 페이지' };
  const description = concert.tagline.replace(/\n/g, ' ');
  return {
    // 미리보기 이미지 주소를 www로 만든다. 루트 metadataBase(www 없음)는 www로 리다이렉트되는데,
    // 카카오톡 미리보기는 리다이렉트를 따라가지 않아 이미지가 안 보인다.
    metadataBase: new URL('https://www.samsung-musical.com'),
    title: concert.title,
    description,
    alternates: { canonical: `/yearend/${concert.year}` },
    openGraph: {
      title: concert.title,
      description,
      url: `/yearend/${concert.year}`,
      siteName: 'No.S',
      locale: 'ko_KR',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: concert.title, description },
  };
}

export default async function YearEndPage({ params }: PageParams) {
  const { year } = await params;
  const concert = getYearEndConcert(year);
  if (!concert) notFound();

  const cast = listCast(concert);
  const hashtags = concert.hashtags ?? [];

  return (
    <main>
      <Hero concert={concert} />
      <StickyNav parts={concert.parts} />

      <section aria-label="공연 소개" className="relative overflow-hidden bg-white">
        <div aria-hidden className="yearend-snowfield pointer-events-none absolute inset-0" />
        <div className="relative max-w-2xl mx-auto px-6 py-16 md:py-24 text-center">
          <p className="yearend-reveal text-base md:text-xl font-medium leading-[1.8] whitespace-pre-line break-keep" style={{ color: TEXT }}>
            {concert.intro}
          </p>
          {hashtags.length > 0 && (
            <ul className="mt-8 flex flex-wrap justify-center gap-2">
              {hashtags.map((tag, i) => {
                const a = ACCENTS[i % ACCENTS.length];
                return (
                  <li key={tag} className="whitespace-nowrap rounded-[4px] px-2 py-0.5 text-sm font-semibold" style={{ background: a.bg, color: a.fg }}>
                    #{tag}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <Program parts={concert.parts} />
      <Cast names={cast} crew={concert.crew} />
      <Visit concert={concert} />
      <ScrollTopButton />

      <footer className="relative overflow-hidden bg-[#172B4D] text-sm text-white/65">
        <Garland wire="rgba(255,255,255,0.45)" />
        <p className="relative pt-20 text-center text-xl md:text-2xl font-bold tracking-[-0.02em] text-white">
          Merry Christmas &amp; Happy New Year 🎄
        </p>
        <div className="relative max-w-3xl mx-auto mt-8 px-5 pb-10 pt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
          <p>삼성전자 뮤지컬 동호회 No.S</p>
          <Link href="/" className="font-medium text-white/85 hover:text-white hover:underline underline-offset-4">
            No.S 홈페이지 가기
          </Link>
        </div>
      </footer>
    </main>
  );
}
