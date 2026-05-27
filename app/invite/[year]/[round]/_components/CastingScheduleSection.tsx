import type { InviteRole, InviteRound } from '@/lib/invites/types';
import { resolveCasting } from './casting-utils';
import CastingScheduleTable from './CastingScheduleTable';
import type { CastingModalRound } from './CastingModal';

interface Props {
  rounds: InviteRound[];
  roles: InviteRole[];
  inviteId: string;
}

/**
 * 회차별 캐스팅 스케줄 — Editorial Programbook Luxe.
 * - cream paper + 단일 ring + 안전 영역에 위치한 4 코너 filigree
 *   (이전 이중 프레임은 코너 ornament와 충돌해 모서리가 잘려 보이는 문제로 제거)
 * - 표 헤더는 색 블록 대신 ◆ 핀스트라이프와 small-caps 라벨로 정제
 * - 날짜·시각·요일 컬러는 팀명(블루/레드)을 따름 — 본 동호회는 같은 요일에
 *   블루·레드가 섞이므로(예: 토 점심=블루, 토 저녁=레드) 요일 기반 컬러는
 *   의미 충돌을 일으켜 팀 컬러로 매핑하는 편이 정확함
 * - 행 클릭 시 해당 회차 캐스팅 모달 (RoundsList와 동일한 CastingModal 재사용)
 */
export default function CastingScheduleSection({ rounds, roles, inviteId }: Props) {
  if (rounds.length === 0) return null;

  const sortedRounds = [...rounds].sort(
    (a, b) => a.startAt.toDate().getTime() - b.startAt.toDate().getTime()
  );

  const tableRows: CastingModalRound[] = sortedRounds.map(r => ({
    roundNo: r.roundNo,
    teamName: r.teamName,
    startAtMs: r.startAt.toDate().getTime(),
    castings: resolveCasting(r, roles),
  }));

  // 표시할 배역 컬럼: 마스터 순 → 그 외 레거시(첫 등장 순)
  const displayRoleNames: string[] = [];
  const pushed = new Set<string>();
  for (const role of roles) {
    if (
      tableRows.some(r =>
        r.castings.some(c => c.roleName === role.name && (c.actorName?.trim() ?? '') !== '')
      )
    ) {
      displayRoleNames.push(role.name);
      pushed.add(role.name);
    }
  }
  for (const r of tableRows) {
    for (const c of r.castings) {
      const name = c.roleName;
      const actor = c.actorName?.trim() ?? '';
      if (name && actor && !pushed.has(name)) {
        displayRoleNames.push(name);
        pushed.add(name);
      }
    }
  }

  if (displayRoleNames.length === 0) return null;

  return (
    <section className="relative px-5 sm:px-6 py-16 bg-gradient-to-b from-[#FAF7F2] via-white to-[#FAF7F2] overflow-hidden">
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-3 text-[#0066B3]/50">
          <span aria-hidden className="h-px w-10 sm:w-14 bg-current" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold">
            CASTING SCHEDULE
          </span>
          <span aria-hidden className="h-px w-10 sm:w-14 bg-current" />
        </div>
        <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight break-keep">
          캐스팅 스케줄
        </h2>
        <div
          aria-hidden
          className="mt-5 flex items-center justify-center gap-2.5 text-[#0066B3]/30"
        >
          <span className="h-px w-10 bg-current" />
          <span className="text-[9px] leading-none">◆</span>
          <span className="h-px w-10 bg-current" />
        </div>
        <p className="mt-4 text-xs sm:text-sm text-gray-600 italic break-keep">
          회차를 누르면 해당 회차 캐스팅을 볼 수 있어요.
        </p>
      </header>

      {/* Programbook frame card */}
      <div
        className="relative max-w-3xl mx-auto bg-[#FDFBF6] rounded-2xl shadow-[0_18px_60px_-25px_rgba(15,23,42,0.18)] ring-1 ring-[#E8DFCC]/70 animate-fade-in-up"
        style={{ animationDelay: '120ms', animationFillMode: 'both' }}
      >
        {/* 4 코너 filigree — 안전 영역에 배치 (충분한 inset + 카드 패딩) */}
        <CornerFiligree className="absolute top-3.5 left-3.5" />
        <CornerFiligree className="absolute top-3.5 right-3.5 -scale-x-100" />
        <CornerFiligree className="absolute bottom-3.5 left-3.5 -scale-y-100" />
        <CornerFiligree className="absolute bottom-3.5 right-3.5 -scale-100" />

        <div className="relative px-4 sm:px-7 pt-9 sm:pt-11 pb-8 sm:pb-10">
          <CastingScheduleTable
            rows={tableRows}
            displayRoleNames={displayRoleNames}
            inviteId={inviteId}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * 정제된 코너 filigree — 메인 곡선 1줄 + 보조 곡선 1줄 + 꼭짓점 닷 1개.
 * 이전 버전은 path가 너무 많아 작은 사이즈에서 뭉개졌음.
 */
function CornerFiligree({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 32 32"
      className={`pointer-events-none w-6 h-6 sm:w-8 sm:h-8 text-[#0066B3]/45 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 17 C3 9 9 3 17 3" strokeWidth="0.9" />
      <path d="M3 24 C8 24 13 19 13 14" strokeWidth="0.7" opacity="0.55" />
      <circle cx="3" cy="3" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
