import type { Credit, EventItem, PlayItem, ProgramPartWithItems, SongItem, SongSource } from '@/lib/yearend/types';
import { songNumbers } from '@/lib/yearend';
import Lozenge from './Lozenge';
import Phrases from './Phrases';
import { Garland } from './ChristmasDecor';
import { HEADING, SHADOW_OVERLAY, SHADOW_RAISED, TEXT_SUBTLE, TEXT_SUBTLEST } from './theme';

/**
 * 프로그램 — 부마다 아이콘 타일 + 제목, 이어지는 곡들은 흰 카드 하나에 목록으로,
 * 이벤트·단막극은 따로 떠 있는 카드로 보여 준다 (ADS 카드·로젠지·elevation).
 */
export default function Program({ parts }: { parts: ProgramPartWithItems[] }) {
  return (
    <div id="program">
      {parts.map(part => (
        <PartSection key={part.no} part={part} />
      ))}
    </div>
  );
}

export function StickyNav({ parts }: { parts: ProgramPartWithItems[] }) {
  const linkClass =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 font-medium text-[#44546F] hover:bg-[#091E42]/[0.06] hover:text-[#172B4D] focus-visible:outline-2 focus-visible:outline-[#388BFF]';
  return (
    <nav aria-label="페이지 바로가기" className="sticky top-0 z-20 border-b border-[#091E42]/[0.14] bg-white/90 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-1 overflow-x-auto text-sm">
        {parts.map(part => (
          <a key={part.no} href={`#part-${part.no}`} className={linkClass}>
            <span aria-hidden>{part.icon}</span>
            {part.no}부
          </a>
        ))}
        <a href="#cast" className={linkClass}>
          <span aria-hidden>🌟</span>
          출연진
        </a>
        <a href="#visit" className={linkClass}>
          <span aria-hidden>📍</span>
          오시는 길
        </a>
      </div>
    </nav>
  );
}

type Segment = { kind: 'songs'; entries: { item: SongItem; no: number }[] } | { kind: 'card'; item: EventItem | PlayItem };

/** 연속된 곡은 한 카드로 묶고, 이벤트·단막극은 따로 뺀다. */
function segment(part: ProgramPartWithItems): Segment[] {
  const numbers = songNumbers(part.items);
  const out: Segment[] = [];
  part.items.forEach((item, i) => {
    if (item.kind === 'song') {
      const last = out[out.length - 1];
      const entry = { item, no: numbers[i] ?? 0 };
      if (last?.kind === 'songs') last.entries.push(entry);
      else out.push({ kind: 'songs', entries: [entry] });
    } else {
      out.push({ kind: 'card', item });
    }
  });
  return out;
}

function PartSection({ part }: { part: ProgramPartWithItems }) {
  const headingId = `part-${part.no}-title`;
  return (
    <section
      id={`part-${part.no}`}
      aria-labelledby={headingId}
      className="relative scroll-mt-14 overflow-hidden pt-24 pb-16 md:pt-28 md:pb-24"
      style={{ background: `linear-gradient(180deg, ${part.surface} 0%, #FFFFFF 100%)` }}
    >
      {/* 눈송이 무늬 + 부마다 위에 걸린 전구 가랜드 */}
      <div aria-hidden className="yearend-snowfield pointer-events-none absolute inset-0" />
      <Garland />
      <div className="relative max-w-3xl mx-auto px-5">
        <header className="yearend-reveal flex flex-col items-center text-center">
          <span
            aria-hidden
            className="flex size-16 md:size-20 items-center justify-center rounded-[25%] text-3xl md:text-4xl"
            style={{ background: part.tint }}
          >
            {part.icon}
          </span>
          <Lozenge bg={part.bold} fg="#FFFFFF" className="mt-5 !text-sm !px-2.5">
            {part.no}부
          </Lozenge>
          <h2 id={headingId} className={`${HEADING} mt-3 text-4xl md:text-5xl break-keep`}>
            {part.title}
          </h2>
          <p className="mt-3 text-lg md:text-xl font-semibold break-keep" style={{ color: part.accent }}>
            <Phrases text={part.subtitle} />
          </p>
          <p className="mt-2 max-w-lg text-[15px] md:text-base leading-relaxed whitespace-pre-line break-keep" style={{ color: TEXT_SUBTLE }}>
            <Phrases text={part.description} />
          </p>
        </header>

        <div className="mt-10 space-y-4">
          {segment(part).map((seg, i) =>
            seg.kind === 'songs' ? (
              <ol key={i} className="yearend-reveal rounded-xl bg-white divide-y divide-[#091E42]/[0.1]" style={{ boxShadow: SHADOW_RAISED }}>
                {seg.entries.map(({ item, no }) => (
                  <li key={no}>
                    <SongRow item={item} no={no} part={part} />
                  </li>
                ))}
              </ol>
            ) : (
              <SpecialCard key={i} item={seg.item} part={part} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function sourceLabel(source: SongSource): string {
  return source.kind === 'musical' ? `뮤지컬 〈${source.name}〉` : source.name;
}

/** 가족 무대 배지 색 (ADS red subtler) */
const FAMILY_BG = '#FFD5D2';
const FAMILY_FG = '#AE2E24';

/** 가족과 함께하는 무대 표시 — 배지 + 한 줄 설명 */
export function FamilyNote({ text, className = '' }: { text: string; className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold break-keep ${className}`} style={{ color: FAMILY_FG }}>
      <Lozenge bg={FAMILY_BG} fg={FAMILY_FG}>
        💞 가족 무대
      </Lozenge>
      <span className="whitespace-pre-line [text-wrap:pretty]">
        <Phrases text={text} />
      </span>
    </p>
  );
}

function SongRow({ item, no, part }: { item: SongItem; no: number; part: ProgramPartWithItems }) {
  return (
    <div className="flex gap-4 px-4 py-5 md:px-6">
      {/* 곡 번호 — 금색 뚜껑을 단 트리 볼 오너먼트 모양 */}
      <span className="relative mt-1 shrink-0">
        <span aria-hidden className="absolute -top-1.5 left-1/2 h-2 w-3 -translate-x-1/2 rounded-[2px] bg-[#C9A227]" />
        <span
          className="flex size-9 md:size-10 items-center justify-center rounded-full text-sm md:text-base font-bold tabular-nums"
          style={{
            background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9) 0 10%, transparent 11%), ${part.tint}`,
            color: part.accent,
          }}
        >
          {no}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        {/* 제목 오른쪽에 출처(가수명 또는 뮤지컬 〈작품〉)를 옅게 붙인다. 좁은 화면에선 다음 줄로 넘어간다 */}
        <h3 className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 break-keep">
          <span className={`${HEADING} text-lg md:text-xl leading-snug`}>{item.title}</span>
          {item.source && (
            <span className="text-sm font-medium" style={{ color: TEXT_SUBTLEST }}>
              {sourceLabel(item.source)}
            </span>
          )}
        </h3>
        {item.family && <FamilyNote text={item.family} className="mt-2" />}
        {item.blurb && (
          <p className="mt-2 text-sm font-semibold leading-relaxed whitespace-pre-line break-keep" style={{ color: part.accent }}>
            <Phrases text={item.blurb} />
          </p>
        )}
        {item.group && <p className={`${HEADING} mt-3 text-[15px]`}>{item.group}</p>}
        <Credits
          credits={item.credits}
          part={part}
          // 배역이 많은 곡(라비보엠 등)은 두 개씩 끊어 읽기 쉽게, 밴드처럼 적으면 한 줄로
          perLine={item.credits.filter(c => !c.lead && c.label && c.names.length === 1).length > 5 ? 2 : undefined}
          className={item.group ? 'mt-1.5' : 'mt-3'}
        />
        {item.note && (
          <p className="mt-1.5 text-sm font-medium" style={{ color: TEXT_SUBTLE }}>
            {item.note}
          </p>
        )}
      </div>
    </div>
  );
}

function SpecialCard({ item, part }: { item: EventItem | PlayItem; part: ProgramPartWithItems }) {
  const label =
    item.kind === 'play' ? `${item.label ?? '단막극'}${item.durationMin ? ` ${item.durationMin}분` : ''}` : '이벤트';
  const title = item.kind === 'play' ? `〈${item.title}〉` : item.title;
  return (
    <div className="yearend-reveal relative overflow-hidden rounded-xl bg-white p-5 pt-7 md:p-7 md:pt-9" style={{ boxShadow: SHADOW_OVERLAY }}>
      {/* 위쪽 띠 — 캔디케인 줄무늬 */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-2"
        style={{ background: 'repeating-linear-gradient(135deg, #E2483D 0 12px, #FFFFFF 12px 24px)' }}
      />
      <div className="flex gap-4">
        {item.emoji && (
          <span
            aria-hidden
            className="flex size-12 md:size-14 shrink-0 items-center justify-center rounded-[25%] text-2xl md:text-3xl"
            style={{ background: part.tint }}
          >
            {item.emoji}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <Lozenge bg={part.bold} fg="#FFFFFF">
            {label}
          </Lozenge>
          <h3 className={`${HEADING} mt-2 text-2xl md:text-[28px] leading-tight break-keep`}>{title}</h3>
          {item.description && (
            <p className="mt-2 text-[15px] md:text-base leading-relaxed whitespace-pre-line break-keep" style={{ color: TEXT_SUBTLE }}>
              <Phrases text={item.description} />
            </p>
          )}
          {item.kind === 'play' && item.family && <FamilyNote text={item.family} className="mt-3" />}
          {item.kind === 'play' && <Credits credits={item.credits} part={part} perLine={2} className="mt-4" />}
        </div>
      </div>
    </div>
  );
}

/**
 * 크레딧 표시 규칙
 *  - lead(연출·강사·반장): 진한 로젠지 + 이름, 맨 위에 한 줄씩
 *  - 라벨 + 한 명(밴드 파트·배역 등): 한 줄에 이어서 배치
 *  - 그 외: 라벨(있으면) + 이름 나열
 */
function Credits({
  credits,
  part,
  perLine,
  className = '',
}: {
  credits: Credit[];
  part: ProgramPartWithItems;
  /** 라벨+한 명 크레딧을 한 줄에 몇 개씩 놓을지 (없으면 한 줄에 이어서) */
  perLine?: number;
  className?: string;
}) {
  const leads = credits.filter(c => c.lead);
  const parts = credits.filter(c => !c.lead && c.label && c.names.length === 1);
  const rest = credits.filter(c => !c.lead && !(c.label && c.names.length === 1));
  const partRows = perLine
    ? Array.from({ length: Math.ceil(parts.length / perLine) }, (_, r) => parts.slice(r * perLine, r * perLine + perLine))
    : [parts];

  return (
    <div className={`space-y-1.5 text-sm md:text-[15px] leading-relaxed break-keep ${className}`} style={{ color: TEXT_SUBTLE }}>
      {leads.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {leads.map((c, i) => (
            <span key={`lead-${i}`} className="inline-flex items-center gap-2">
              <Lozenge bg={part.bold} fg="#FFFFFF">
                {c.label}
              </Lozenge>
              <span className="font-semibold text-[#172B4D]">{c.names.join(', ')}</span>
            </span>
          ))}
        </p>
      )}
      {parts.length > 0 &&
        partRows.map((row, r) => (
          <p key={`parts-${r}`} className="flex flex-wrap gap-x-4 gap-y-1">
            {row.map((c, i) => (
              <span key={i} className="whitespace-nowrap">
                <span className="mr-1.5" style={{ color: TEXT_SUBTLEST }}>
                  {c.label}
                </span>
                <span className="text-[#172B4D]">{c.names[0]}</span>
              </span>
            ))}
          </p>
        ))}
      {rest.map((c, i) => (
        <p key={`rest-${i}`}>
          {c.label && (
            <span className="mr-1.5" style={{ color: TEXT_SUBTLEST }}>
              {c.label}
            </span>
          )}
          <span className="text-[#172B4D]">{c.names.join(', ')}</span>
        </p>
      ))}
    </div>
  );
}
