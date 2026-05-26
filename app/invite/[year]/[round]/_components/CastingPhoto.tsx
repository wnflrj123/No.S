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

/**
 * 캐스팅 사진 표시 컴포넌트.
 * - crop이 없으면: next/image fill + object-cover (기본 동작, 원본 비율 따라 가장자리 크롭)
 * - crop이 있으면: 원본 img를 절대 위치로 띄워서 crop 영역이 frame을 정확히 채우게 함.
 *
 * 부모 컨테이너가 aspect 3:4를 갖고 있어야 한다 (CastingTabs/RoundsList 모두 그렇게 설정).
 */
export default function CastingPhoto({ src, alt, crop, sizes }: Props) {
  if (!crop) {
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

  // crop 좌표는 react-easy-crop의 croppedArea — 원본 이미지 % 단위.
  // frame이 3:4이고 crop도 3:4 aspect로 잡혔다고 가정 (CropEditor가 aspect 잠금).
  // width = 100/crop.width * 100, left = -(crop.x/crop.width) * 100 ... 등으로 변환하면
  // frame을 정확히 채우는 위치/크기로 원본을 배치할 수 있다.
  const w = (100 / crop.width) * 100;
  const left = -(crop.x / crop.width) * 100;
  const top = -(crop.y / crop.height) * 100;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- crop 메타데이터 기반 정밀 위치/크기 제어. next/image의 fill mode와 호환되지 않음. */}
      <img
        src={src}
        alt={alt}
        style={{
          position: 'absolute',
          width: `${w}%`,
          height: 'auto',
          left: `${left}%`,
          top: `${top}%`,
          maxWidth: 'none',
        }}
      />
    </>
  );
}
