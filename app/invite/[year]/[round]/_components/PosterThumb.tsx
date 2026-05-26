'use client';

import { useEffect, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  /** above-the-fold면 true → eager load + fetchpriority=high */
  priority?: boolean;
}

/**
 * 포스터 thumbnail. 원본 비율 그대로 표시 (크롭 없음).
 * 클릭하면 fullscreen 모달로 확대.
 * - ESC 또는 backdrop 클릭으로 닫힘
 * - 모달 열린 동안 body 스크롤 잠금
 *
 * next/image 대신 native img 사용: 컨테이너 고정 비율 없이 이미지 원본 비율대로
 * 표시하기 위함. 포스터 크기가 작아 next/image 최적화 이점이 미미.
 */
export default function PosterThumb({ src, alt, priority }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="포스터 크게 보기"
        className="block w-full overflow-hidden rounded-lg md:rounded-xl bg-gray-100 shadow-md cursor-zoom-in transition-transform hover:scale-[1.015] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066B3]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 원본 비율 그대로 표시. */}
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="block w-full h-auto"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="포스터 확대 보기"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl leading-none transition-colors"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- 사용자 액션 후 1회 로드, 원본 비율 그대로. */}
          <img
            src={src}
            alt={alt}
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
          />
        </div>
      )}
    </>
  );
}
