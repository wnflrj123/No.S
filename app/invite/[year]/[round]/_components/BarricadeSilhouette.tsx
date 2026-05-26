/**
 * 페이지 하단 바리케이드 실루엣 워터마크.
 * 레이아웃 하단에 절대 배치 + 음수 z-index로 콘텐츠 뒤에 깔린다.
 * 매우 옅은 불투명도로 시인성에 영향을 주지 않으면서 레미제라블 무드를 더한다.
 * - 들쭉날쭉한 잡동사니 더미(path) + 양옆 수레바퀴 + 깃대·작은 깃발
 * - 색상은 currentColor로 받아 부모에서 톤을 결정한다.
 */
export default function BarricadeSilhouette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 overflow-hidden text-slate-900 opacity-[0.06] sm:h-40"
    >
      <svg
        viewBox="0 0 1200 220"
        preserveAspectRatio="xMidYMax meet"
        className="block h-full w-full"
      >
        <g fill="currentColor">
          {/* 들쭉날쭉한 잡동사니 더미 */}
          <path d="M0 220 L0 165 L60 158 L110 145 L160 165 L200 130 L240 150 L290 120 L340 145 L380 115 L430 135 L470 100 L520 125 L570 95 L610 115 L660 105 L720 130 L760 110 L800 140 L840 100 L880 125 L920 105 L980 135 L1020 115 L1080 145 L1120 125 L1160 150 L1200 130 L1200 220 Z" />
          {/* 양옆 수레바퀴 */}
          <circle cx="200" cy="180" r="30" />
          <circle cx="940" cy="175" r="26" />
          {/* 깃대 + 작은 혁명 깃발 */}
          <rect x="640" y="50" width="3" height="150" />
          <path d="M643 60 L700 70 L685 82 L700 94 L643 90 Z" />
        </g>
      </svg>
    </div>
  );
}
