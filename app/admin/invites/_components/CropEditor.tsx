'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

interface Props {
  src: string;
  /** 기존 crop이 있으면 그 값으로 초기화 */
  initialCrop?: { x: number; y: number; width: number; height: number };
  /** crop 결과(원본 이미지 % 좌표). null = 사용자가 crop 제거(원래대로) */
  onSave: (crop: { x: number; y: number; width: number; height: number } | null) => void;
  onClose: () => void;
}

const ASPECT = 3 / 4;

/**
 * 캐스팅 사진 자르기 모달. 3:4 비율 고정.
 * react-easy-crop의 croppedArea (% 좌표)를 그대로 onSave에 전달.
 */
export default function CropEditor({ src, initialCrop, onSave, onClose }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPct, setCroppedAreaPct] = useState<Area | null>(
    initialCrop ? { ...initialCrop } : null,
  );

  const onCropComplete = useCallback((areaPct: Area) => {
    setCroppedAreaPct(areaPct);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 자르기"
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
      >
        <header className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">사진 자르기 (3:4)</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-xl leading-none"
          >
            ×
          </button>
        </header>

        <div className="relative w-full aspect-[3/4] bg-gray-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            objectFit="contain"
          />
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-600 shrink-0 w-8">확대</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#0066B3]"
            />
            <span className="text-xs text-gray-500 shrink-0 w-10 text-right">{zoom.toFixed(2)}x</span>
          </div>
          <p className="text-xs text-gray-500">
            드래그해서 위치를 조정하고, 슬라이더로 확대 비율을 맞춰주세요.
          </p>
        </div>

        <div className="border-t border-gray-100 px-5 py-3 flex justify-between gap-2">
          <button
            type="button"
            onClick={() => onSave(null)}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
          >
            크롭 해제
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                if (croppedAreaPct) {
                  onSave({
                    x: croppedAreaPct.x,
                    y: croppedAreaPct.y,
                    width: croppedAreaPct.width,
                    height: croppedAreaPct.height,
                  });
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 text-sm font-semibold bg-[#0066B3] text-white rounded-lg hover:bg-[#0055a0]"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
