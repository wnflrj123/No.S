import Image from 'next/image';

interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  src: string;
  alt: string;
  /** crop이 있으면 그 영역만 표시. 없으면 object-cover 기본 동작. */
  crop?: Crop;
  /** next/image sizes 속성 (crop 없을 때만 사용) */
  sizes?: string;
}

function isValidCrop(crop: Crop | undefined): crop is Crop {
  return (
    !!crop &&
    typeof crop.x === 'number' &&
    typeof crop.y === 'number' &&
    typeof crop.width === 'number' &&
    typeof crop.height === 'number' &&
    crop.width > 0 &&
    crop.height > 0
  );
}

/**
 * 캐스팅/제작진 사진 표시 컴포넌트. 부모 컨테이너가 적절한 aspect ratio +
 * `relative overflow-hidden`을 가져야 한다.
 *
 * - crop 없음(또는 무효): next/image fill + object-cover (원본 비율 따라 자동 크롭)
 * - crop 있음: 원본 img를 절대 위치로 띄워서 crop 영역이 frame을 정확히 채움
 *   `data-cropped="true"` 속성으로 dev tools에서 적용 여부 확인 가능
 */
export default function CastingPhoto({ src, alt, crop, sizes }: Props) {
  if (!isValidCrop(crop)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
      />
    );
  }

  // crop 좌표 = react-easy-crop의 croppedArea (원본 이미지 % 단위).
  // 부모 frame과 crop이 같은 aspect ratio여야 정확히 채워진다.
  const widthPct = (100 / crop.width) * 100;
  const leftPct = -(crop.x / crop.width) * 100;
  const topPct = -(crop.y / crop.height) * 100;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- next/image fill mode와 호환 불가, crop 메타데이터로 정밀 위치/크기 제어
    <img
      src={src}
      alt={alt}
      data-cropped="true"
      style={{
        position: 'absolute',
        width: `${widthPct}%`,
        maxWidth: 'none',
        height: 'auto',
        maxHeight: 'none',
        left: `${leftPct}%`,
        top: `${topPct}%`,
      }}
    />
  );
}
