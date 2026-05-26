interface Props {
  /** 표시할 이름 (initial variant에서 첫 글자 사용) */
  name?: string;
  /** 사이즈 (기본 'md') */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 표시 방식:
   *  - 'initial' (기본): 이름 첫 글자 + 이름 해시 기반 pastel gradient. 사람 식별 가능.
   *  - 'silhouette': 사람 silhouette 아이콘 + 중성 회색 gradient. 사진 없음을 부드럽게.
   */
  variant?: 'initial' | 'silhouette';
}

/**
 * 사진 없을 때의 자연스러운 placeholder. 부모는 position:relative + 적절한 aspect-ratio.
 */

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

export default function PhotoPlaceholder({
  name = '',
  size = 'md',
  variant = 'initial',
}: Props) {
  if (variant === 'silhouette') {
    return (
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-1/2 h-1/2 text-gray-400"
        >
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  // initial variant
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
