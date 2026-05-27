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
 * - cream paper + 이중 hairline 프레임 + 4 코너 filigree ornament
 * - 표 헤더는 색 블록 대신 ◆ 핀스트라이프와 small-caps 라벨로 정제
 * - 토=blue / 일=rose 전통 스케줄표 컨벤션은 유지하되 채도 낮춰 종이톤과 조화
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 rounded-[14px] ring-1 ring-[#0066B3]/15"
        />

        <CornerFiligree className="absolute top-2.5 left-2.5" />
        <CornerFiligree className="absolute top-2.5 right-2.5 -scale-x-100" />
        <CornerFiligree className="absolute bottom-2.5 left-2.5 -scale-y-100" />
        <CornerFiligree className="absolute bottom-2.5 right-2.5 -scale-100" />

        <div className="relative px-2 sm:px-5 py-6 sm:py-8">
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

function CornerFiligree({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 36 36"
      className={`pointer-events-none w-7 h-7 sm:w-9 sm:h-9 text-[#0066B3]/35 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 18 C2 9 9 2 18 2" strokeWidth="1" />
      <path d="M2 26 C7 26 11 22 11 17" strokeWidth="0.7" opacity="0.55" />
      <path d="M8 8 L12 4" strokeWidth="0.7" opacity="0.5" />
      <circle cx="2" cy="2" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="18" cy="2" r="0.9" fill="currentColor" stroke="none" opacity="0.55" />
      <circle cx="2" cy="18" r="0.9" fill="currentColor" stroke="none" opacity="0.55" />
    </svg>
  );
}
