/**
 * ADS Lozenge — 상태·분류를 나타내는 작은 배지 (radius 4px, 굵은 작은 글씨).
 * subtle: 옅은 배경 + 진한 글자, bold: 진한 배경 + 흰 글자
 */
export default function Lozenge({
  children,
  bg,
  fg,
  className = '',
}: {
  children: React.ReactNode;
  bg: string;
  fg: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-[4px] px-1.5 py-px text-[12px] font-bold leading-[18px] whitespace-nowrap ${className}`}
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}
