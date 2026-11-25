import { ImageResponse } from 'next/og';
import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import { getYearEndConcert, listYearEndYears } from '@/lib/yearend';

/**
 * 송년 공연 공유 미리보기 이미지 (카카오톡·문자·SNS 링크 미리보기).
 *
 * 잘림 대비: 메신저마다 가로를 2:1로 자르거나 가운데 정사각형만 보여 주기도 해서
 * 제목·숫자·일시·장소는 가운데 약 620px 폭 안에, 장식(전구·오너먼트·선물)은 가장자리에만 둔다.
 */
export const alt = '우리의 525,600분 | No.S 2026 송년 공연';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export const dynamicParams = false;
export function generateStaticParams() {
  return listYearEndYears().map(year => ({ year: String(year) }));
}

const KST = 'Asia/Seoul';
const BRAND = '#0C66E4';
const GOLD = '#F5CD47';
const RED = '#E2483D';
const GREEN = '#22A06B';
const BULBS = [GOLD, RED, '#4BCE97', '#6CC3E0', '#E774BB'];

const FONT_BASE = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff';

async function loadFont(weight: 'Black' | 'Bold') {
  try {
    const res = await fetch(`${FONT_BASE}/Pretendard-${weight}.woff`);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null; // 글꼴을 못 받으면 next/og 기본 글꼴로 그린다
  }
}

export default async function Image({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const concert = getYearEndConcert(year);
  const [black, bold] = await Promise.all([loadFont('Black'), loadFont('Bold')]);
  // 글꼴을 하나도 못 받았으면 fonts를 넘기지 않아야 next/og 기본 글꼴로 그려진다
  const fonts = [
    ...(black ? [{ name: 'Pretendard', data: black, weight: 900 as const, style: 'normal' as const }] : []),
    ...(bold ? [{ name: 'Pretendard', data: bold, weight: 700 as const, style: 'normal' as const }] : []),
  ];

  const start = concert?.startAt ? new Date(concert.startAt) : null;
  const dateLabel = start ? formatInTimeZone(start, KST, 'M월 d일 (EEE) a h시', { locale: ko }) : '';
  const venue = concert?.venue?.name ?? '';
  const number = (concert?.heroNumber ?? 525600).toLocaleString('en-US');

  // 전구 가랜드 — 25% 간격으로 늘어진 곡선 위에 전구를 놓는다
  const bulbs = Array.from({ length: 22 }, (_, i) => {
    const x = ((i + 0.5) / 22) * 1200;
    const sag = Math.sin((((x / 1200) * 100) % 25) / 25 * Math.PI);
    return { x, y: 10 + sag * 34, color: BULBS[i % BULBS.length] };
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: BRAND,
          backgroundImage: 'linear-gradient(160deg, #0C66E4 0%, #0B4FB3 100%)',
          fontFamily: 'Pretendard',
          color: 'white',
        }}
      >
        {/* 전구 가랜드 */}
        <svg width="1200" height="70" viewBox="0 0 1200 70" style={{ position: 'absolute', top: 0, left: 0 }}>
          <path
            d="M0,8 Q150,64 300,8 Q450,64 600,8 Q750,64 900,8 Q1050,64 1200,8"
            fill="none"
            stroke="#0B3B2C"
            strokeWidth="3"
          />
        </svg>
        {bulbs.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x - 8,
              top: b.y,
              width: 16,
              height: 26,
              borderRadius: '40% 40% 50% 50%',
              background: b.color,
              boxShadow: `0 0 18px 4px ${b.color}`,
            }}
          />
        ))}

        {/* 오너먼트 — 가장자리에만 (잘려도 괜찮은 자리) */}
        <div style={{ position: 'absolute', top: 40, right: 60, width: 2, height: 70, background: 'rgba(255,255,255,0.5)' }} />
        <div
          style={{
            position: 'absolute',
            top: 108,
            right: 18,
            width: 88,
            height: 88,
            borderRadius: 999,
            backgroundColor: GOLD,
            backgroundImage: 'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.6) 9%, transparent 10%)',
          }}
        />
        <div style={{ position: 'absolute', top: 100, right: 52, width: 22, height: 12, borderRadius: 3, background: '#C9A227' }} />

        <div style={{ position: 'absolute', top: 46, left: 76, width: 2, height: 96, background: 'rgba(255,255,255,0.5)' }} />
        <div
          style={{
            position: 'absolute',
            top: 148,
            left: 40,
            width: 74,
            height: 74,
            borderRadius: 999,
            backgroundColor: RED,
            backgroundImage: 'radial-gradient(circle at 32% 30%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.6) 9%, transparent 10%)',
          }}
        />
        <div style={{ position: 'absolute', top: 140, left: 67, width: 20, height: 11, borderRadius: 3, background: '#C9A227' }} />

        {/* 선물 상자 (왼쪽 아래) */}
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            left: 70,
            width: 96,
            height: 96,
            borderRadius: 18,
            background: GREEN,
            display: 'flex',
            transform: 'rotate(-8deg)',
          }}
        >
          <div style={{ position: 'absolute', left: 39, top: 0, width: 18, height: 96, background: GOLD }} />
          <div style={{ position: 'absolute', left: 0, top: 39, width: 96, height: 18, background: GOLD }} />
        </div>

        {/* 캔디케인 (오른쪽 아래) */}
        <div
          style={{
            position: 'absolute',
            bottom: 96,
            right: 56,
            width: 150,
            height: 30,
            borderRadius: 999,
            transform: 'rotate(-14deg)',
            backgroundImage: `repeating-linear-gradient(45deg, ${RED} 0px, ${RED} 14px, #FFFFFF 14px, #FFFFFF 28px)`,
          }}
        />

        {/* 눈 쌓인 바닥 */}
        <svg width="1200" height="80" viewBox="0 0 1200 80" style={{ position: 'absolute', bottom: 0, left: 0 }}>
          <path d="M0,80 L0,40 C100,14 200,12 300,36 C400,58 500,18 600,30 C700,42 800,6 900,28 C1000,50 1100,22 1200,36 L1200,80 Z" fill="#FFFFFF" />
        </svg>

        {/* 가운데 안전 영역 — 잘려도 남는 핵심 정보 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10 }}>
          <div
            style={{
              display: 'flex',
              padding: '8px 22px',
              borderRadius: 999,
              background: 'white',
              color: '#0055CC',
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {concert?.overline.replace(/\s*🎄\s*$/, '') ?? 'No.S 송년 공연'}
          </div>
          <div style={{ display: 'flex', marginTop: 26, fontSize: 46, fontWeight: 700 }}>{concert?.heroLead ?? '우리의'}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 2, lineHeight: 1 }}>
            <div style={{ display: 'flex', fontSize: 136, fontWeight: 900, letterSpacing: '-5px', textShadow: '0 6px 0 rgba(9,30,66,0.2)' }}>
              {number}
            </div>
            <div style={{ display: 'flex', fontSize: 72, fontWeight: 900, color: GOLD, marginLeft: 8, marginBottom: 12 }}>
              {concert?.heroUnit ?? '분'}
            </div>
          </div>
          {(dateLabel || venue) && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 30, gap: 12 }}>
              {dateLabel && (
                <div
                  style={{
                    display: 'flex',
                    padding: '10px 20px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.16)',
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  {dateLabel}
                </div>
              )}
              {venue && (
                <div
                  style={{
                    display: 'flex',
                    padding: '10px 20px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.16)',
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  {venue}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    fonts.length > 0 ? { ...size, fonts } : size,
  );
}
