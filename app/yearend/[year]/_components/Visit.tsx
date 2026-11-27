import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import type { YearEndConcert } from '@/lib/yearend/types';
import Lozenge from './Lozenge';
import Phrases from './Phrases';
import { ApplyCard, hasApply } from './ApplyButton';
import { ACCENTS, BRAND, BRAND_TEXT, HEADING, SHADOW_RAISED, SUNKEN, TEXT_SUBTLE } from './theme';

const KST = 'Asia/Seoul';

// 지도 임베드를 허용할 신뢰 호스트 (정기공연 VenueSection과 같은 목록)
const ALLOWED_MAP_HOSTS = ['www.google.com', 'maps.google.com', 'map.naver.com', 'pcmap.place.naver.com', 'map.kakao.com'];

function isSafeEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED_MAP_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

/** 오시는 길(일시·장소·지도) + 관람 안내 */
export default function Visit({ concert }: { concert: YearEndConcert }) {
  const { venue, startAt, notices = [] } = concert;
  const dateLabel = startAt
    ? formatInTimeZone(new Date(startAt), KST, 'yyyy년 M월 d일 (EEE) a h시 mm분', { locale: ko }).replace(' 00분', '')
    : null;
  const showMap = venue?.mapEmbedUrl && isSafeEmbedUrl(venue.mapEmbedUrl);
  const links = venue?.mapLinks;
  const mapButtons = [
    links?.naver && { href: links.naver, label: '네이버지도에서 보기' },
    links?.kakao && { href: links.kakao, label: '카카오맵에서 보기' },
    links?.google && { href: links.google, label: '구글지도에서 보기' },
  ].filter((b): b is { href: string; label: string } => Boolean(b));

  return (
    <section
      id="visit"
      aria-labelledby="visit-title"
      className="relative scroll-mt-14 overflow-hidden py-16 md:py-24"
      style={{ background: SUNKEN }}
    >
      <div aria-hidden className="yearend-snowfield pointer-events-none absolute inset-0" />
      <div className="relative max-w-3xl mx-auto px-5">
        <h2 id="visit-title" className={`${HEADING} text-center text-4xl md:text-5xl`}>
          오시는 길 📍
        </h2>

        <div className="yearend-reveal mt-10 overflow-hidden rounded-xl bg-white" style={{ boxShadow: SHADOW_RAISED }}>
          <dl className="grid gap-4 p-5 md:p-7 sm:grid-cols-2">
            <div>
              <dt>
                <Lozenge bg="#E9F2FF" fg={BRAND_TEXT}>
                  언제
                </Lozenge>
              </dt>
              <dd className={`${HEADING} mt-2 text-lg break-keep`}>{dateLabel ?? '곧 알려 줄게요'}</dd>
            </div>
            <div>
              <dt>
                <Lozenge bg="#FFECF8" fg="#943D73">
                  어디서
                </Lozenge>
              </dt>
              <dd className="mt-2 break-keep">
                {venue ? (
                  <>
                    <span className={`${HEADING} block text-lg`}>{venue.name}</span>
                    {venue.address && (
                      <span className="block mt-0.5 text-[15px]" style={{ color: TEXT_SUBTLE }}>
                        {venue.address}
                      </span>
                    )}
                    {venue.directions && <span className="block mt-2 whitespace-pre-line leading-relaxed">{venue.directions}</span>}
                  </>
                ) : (
                  '곧 알려 줄게요'
                )}
              </dd>
            </div>
          </dl>

          {showMap && (
            <div className="aspect-[4/3] md:aspect-[16/9] border-y border-[#091E42]/[0.14]">
              <iframe
                src={venue!.mapEmbedUrl}
                title={`${venue!.name} 지도`}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}

          {mapButtons.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 md:px-7">
              {mapButtons.map((b, i) => (
                <a
                  key={b.href}
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-9 items-center rounded-md px-3.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#388BFF] ${
                    i === 0 ? 'text-white hover:brightness-110' : 'bg-[#091E42]/[0.06] text-[#172B4D] hover:bg-[#091E42]/[0.12]'
                  }`}
                  style={i === 0 ? { background: BRAND } : undefined}
                >
                  {b.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {notices.length > 0 && (
          <div className="mt-20">
            <h3 className={`${HEADING} text-center text-3xl md:text-4xl`}>오기 전에 꼭 체크! ✅</h3>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {notices.map((n, i) => {
                const a = ACCENTS[i % ACCENTS.length];
                return (
                  <li
                    key={n.title}
                    className={`yearend-reveal flex gap-4 rounded-xl bg-white p-5 md:p-6 ${
                      i === notices.length - 1 && notices.length % 2 === 1 ? 'sm:col-span-2' : ''
                    }`}
                    style={{ boxShadow: SHADOW_RAISED }}
                  >
                    <span
                      aria-hidden
                      className="flex size-12 shrink-0 items-center justify-center rounded-[25%] text-2xl"
                      style={{ background: a.bg }}
                    >
                      {n.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className={`${HEADING} text-[17px] md:text-lg leading-snug break-keep`}>{n.title}</p>
                      <p className="mt-1 text-sm md:text-[15px] leading-relaxed whitespace-pre-line break-keep" style={{ color: TEXT_SUBTLE }}>
                        <Phrases text={n.body} />
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {hasApply(concert.apply) && <ApplyCard url={concert.apply.url} note={concert.apply.note} />}
      </div>
    </section>
  );
}
