interface Props {
  /** 표시할 이름 (첫 글자 사용). 빈 값이면 '?' */
  name?: string;
  /** 사이즈 (컨테이너 비율에 맞춰 글자 크기 조정). 기본 'md' */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 사진이 없을 때 표시하는 자연스러운 placeholder.
 * - 이름 첫 글자 + 이름 해시 기반 pastel gradient 배경
 * - 부모는 position:relative + 적절한 aspect-ratio (이 컴포넌트는 absolute inset-0)
 *
 * 같은 이름은 항상 같은 색 — 시각 일관성 유지.
 */

// 6색 파스텔 팔레트. 글자 색은 같은 톤의 짙은 버전으로 대비 확보.
const PALETTE = [
  'from-rose-100 to-pink-100 text-rose-600',
  'from-amber-100 to-orange-100 text-amber-700',
  'from-emerald-100 to-teal-100 text-emerald-700',
  'from-sky-100 to-blue-100 text-sky-700',
  'from-violet-100 to-purple-100 text-violet-600',
  'from-cyan-100 to-sky-100 text-cyan-700',
] as const;

const SIZE_TEXT: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-xl md:text-2xl',
  md: 'text-3xl md:text-4xl',
  lg: 'text-5xl md:text-6xl',
};

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default function PhotoPlaceholder({ name = '', size = 'md' }: Props) {
  const trimmed = name.trim();
  const initial = trimmed ? Array.from(trimmed)[0] : '?';
  const palette = PALETTE[hashName(trimmed) % PALETTE.length];
  const sizeClass = SIZE_TEXT[size];

  return (
    <div
      aria-hidden
      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${palette}`}
    >
      <span className={`font-semibold ${sizeClass} opacity-80 select-none`}>{initial}</span>
    </div>
  );
}
