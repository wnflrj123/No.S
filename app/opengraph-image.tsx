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
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 3D Sphere - top right (large, blue) */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -30,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #a5d4ff 0%, #3182f6 60%, #1b64da 100%)',
            opacity: 0.7,
          }}
        />
        {/* Sphere shine overlay */}
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -10,
            width: 140,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.5) 0%, transparent 70%)',
          }}
        />

        {/* 3D Sphere - bottom left (purple, medium) */}
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            left: -20,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #c9a5ff 0%, #8b5cf6 70%)',
            opacity: 0.5,
          }}
        />

        {/* 3D Sphere - small accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            right: 120,
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6db6ff 0%, #3182f6 100%)',
            opacity: 0.3,
          }}
        />

        {/* 3D Sphere - tiny */}
        <div
          style={{
            position: 'absolute',
            top: 100,
            left: 80,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #a5d4ff 0%, #3182f6 100%)',
            opacity: 0.25,
          }}
        />

        {/* Soft dot accents */}
        <div
          style={{
            position: 'absolute',
            top: 180,
            right: 200,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#3182f6',
            opacity: 0.12,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 160,
            left: 200,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#8b5cf6',
            opacity: 0.1,
          }}
        />

        {/* Floating card element (like notification card in hero) */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 80,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'white',
            border: '1px solid #e5e8eb',
            borderRadius: 16,
            padding: '14px 20px',
            boxShadow: '0 8px 24px rgba(25,31,40,0.06)',
          }}
        >
          <div style={{ fontSize: 20 }}>🎵</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#191f28' }}>합동연습실 예약</span>
            <span style={{ fontSize: 11, color: '#8b95a1' }}>18:00 ~ 21:00</span>
          </div>
        </div>

        {/* Floating card element (bottom right) */}
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            right: 80,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'white',
            border: '1px solid #e5e8eb',
            borderRadius: 14,
            padding: '12px 18px',
            boxShadow: '0 6px 20px rgba(25,31,40,0.05)',
          }}
        >
          <div style={{ fontSize: 18 }}>📅</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#191f28' }}>일정 공유</span>
            <span style={{ fontSize: 10, color: '#8b95a1' }}>한눈에 확인</span>
          </div>
        </div>

        {/* Center content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            position: 'relative',
          }}
        >
          {/* Logo */}
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
              marginTop: 2,
            }}
          >
            같은 무대를 꿈꾸는 사람들의 공간
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
