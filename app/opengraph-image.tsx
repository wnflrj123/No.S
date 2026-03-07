import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'No.S - 삼성전자 뮤지컬 동호회';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
          background: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative soft circles (like main page orbs) */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -60,
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(49,130,246,0.08) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -100,
            left: -80,
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(49,130,246,0.06) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 200,
            left: 100,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #3182f6, #5b9cf6, #3182f6)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          {/* Logo text */}
          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              color: '#3182f6',
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            No.S
          </div>

          {/* Divider */}
          <div
            style={{
              width: 60,
              height: 3,
              background: 'linear-gradient(90deg, transparent, #3182f6, transparent)',
              borderRadius: 2,
            }}
          />

          {/* Title */}
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: '#191f28',
              letterSpacing: '-0.5px',
            }}
          >
            삼성전자 뮤지컬 동호회
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 22,
              color: '#8b95a1',
              fontWeight: 500,
              marginTop: 4,
            }}
          >
            같은 무대를 꿈꾸는 사람들의 공간
          </div>
        </div>

        {/* Bottom info */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            color: '#8b95a1',
            fontSize: 16,
          }}
        >
          <span>🎭 뮤지컬</span>
          <span style={{ color: '#b0b8c1' }}>·</span>
          <span>🎵 연습실 예약</span>
          <span style={{ color: '#b0b8c1' }}>·</span>
          <span>📅 일정 공유</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
