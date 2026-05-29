'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import CastingPhoto from './CastingPhoto';
import PhotoPlaceholder from './PhotoPlaceholder';

const PAGE_SIZE = 12;

export interface CheersActor {
  roleName: string;
  actorName: string;
  photoFile?: string;
  photoCrop?: { x: number; y: number; width: number; height: number };
}

export interface CheersItem {
  id: string;
  name: string;
  supportingActors: string;
  cheerMessage: string;
  headcount: number;
  /** 회차별 좌석 내역 (회차 번호 오름차순) */
  roundSelections: Array<{ roundNo: number; headcount: number }>;
  isSponsor: boolean;
  createdAtMs: number;
}

interface Props {
  invite: {
    id: string;
    year: number;
    round: number;
    title: string;
    overline?: string;
  };
  actors: CheersActor[];
  items: CheersItem[];
  /** 모든 active 신청 건수 (메시지/응원하는배우 작성 여부와 무관). */
  totalRegistrations: number;
  /** 모든 active 신청의 좌석 합. items에 포함되지 않은(메시지 없는) 신청까지 포함. */
  totalSeats: number;
  /** 회차별 좌석 합계. roundNo 오름차순. */
  roundStats: Array<{ roundNo: number; teamName: string; headcount: number }>;
}

interface ActorEntry extends CheersActor {
  key: string;
  /** 매칭에 쓸 별칭들 (정식 이름·이름만·배역명) */
  aliases: string[];
}

/**
 * 배우 이름을 매칭용 별칭들로 확장한다.
 *  - 정식 이름 ("서주리")
 *  - 한글 3자 이상이면 이름 부분(성 제외) ("주리")
 *    "서주리최고" / "주리 배우님" 같은 부분 호명도 인식되도록.
 *  - 공백 포함(주로 영문) 이름이면 각 단어 토큰
 */
function buildActorAliases(actorName: string): string[] {
  const out = new Set<string>();
  const trimmed = actorName.trim();
  if (!trimmed) return [];
  out.add(trimmed);

  // 한글로만 구성된 3자 이상의 이름 → 성 제외한 이름 부분(last 2자)을 별칭으로
  if (/^[가-힣]+$/.test(trimmed) && trimmed.length >= 3) {
    out.add(trimmed.slice(-2));
  }

  // 공백 포함(영문 풀네임 등) → 각 토큰을 별칭으로
  const tokens = trimmed.split(/\s+/).filter(t => t.length >= 2);
  if (tokens.length > 1) {
    for (const t of tokens) out.add(t);
  }

  return Array.from(out);
}

function matchesEntry(text: string, entry: { aliases: string[]; roleName: string }): boolean {
  if (!text) return false;
  for (const a of entry.aliases) {
    if (text.includes(a)) return true;
  }
  if (entry.roleName && text.includes(entry.roleName)) return true;
  return false;
}

function actorKey(a: CheersActor): string {
  return `${a.roleName}::${a.actorName}`;
}

export default function CheersForActors({
  invite,
  actors,
  items,
  totalRegistrations,
  totalSeats,
  roundStats,
}: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0); // 0-indexed
  const messagesRef = useRef<HTMLDivElement>(null);

  // 배우 카드 — 캐스팅 순서를 그대로 유지 (랭킹/카운트 노출 없음).
  // aliases는 매칭에만 사용하며 UI에 노출하지 않는다.
  const actorList = useMemo<ActorEntry[]>(() => {
    return actors.map(a => ({
      ...a,
      key: actorKey(a),
      aliases: buildActorAliases(a.actorName),
    }));
  }, [actors]);

  // 응원 카드 한 건 = cheerMessage 또는 supportingActors 중 하나라도 채워진 신청.
  // 서버에서 이미 둘 다 비어있는 신청은 제외해 items에 넣어 보내준다.
  const totalMessages = items.length;

  const selectedActor = selectedKey
    ? actorList.find(r => r.key === selectedKey) ?? null
    : null;

  const filteredItems = useMemo(() => {
    if (!selectedActor) return items;
    return items.filter(it => matchesEntry(it.supportingActors, selectedActor));
  }, [items, selectedActor]);

  // 검색: 이름·응원하는 배우·응원 메시지 합쳐 substring 매칭
  const searchedItems = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return filteredItems;
    return filteredItems.filter(
      it =>
        it.name.includes(q) ||
        it.supportingActors.includes(q) ||
        it.cheerMessage.includes(q),
    );
  }, [filteredItems, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(searchedItems.length / PAGE_SIZE));
  // 데이터/필터 변화로 현재 페이지가 범위를 벗어날 수 있으므로 매 렌더 시 clamp.
  // (setState in effect로 보정하는 대신 derived value — 불필요한 re-render 회피)
  const effectivePage = Math.min(page, totalPages - 1);
  const pageItems = useMemo(
    () => searchedItems.slice(effectivePage * PAGE_SIZE, (effectivePage + 1) * PAGE_SIZE),
    [searchedItems, effectivePage],
  );

  const goToPage = (next: number) => {
    setPage(Math.max(0, Math.min(totalPages - 1, next)));
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        messagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const onSelectActor = (key: string) => {
    setSelectedKey(prev => (prev === key ? null : key));
    setPage(0); // 필터 변경 시 첫 페이지로
    // 메시지 섹션으로 부드럽게 스크롤 (필터 직후 결과 확인 유도)
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        messagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const onClearFilter = () => {
    setSelectedKey(null);
    setPage(0);
  };

  const onSearchChange = (q: string) => {
    setSearchQuery(q);
    setPage(0);
  };

  return (
    <main className="relative isolate text-gray-900 bg-gradient-to-b from-[#FAF7F2] via-white to-[#FAF7F2] min-h-screen pb-24">
      {/* 헤더 */}
      <header className="px-5 pt-10 pb-6 text-center">
        {invite.overline?.trim() && (
          <div className="text-[11px] sm:text-xs font-semibold text-[#0066B3] tracking-wide mb-3">
            {invite.overline}
          </div>
        )}
        <div className="inline-flex items-center gap-3 text-[#0066B3]/50">
          <span aria-hidden className="h-px w-10 sm:w-14 bg-current" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold">For the cast</span>
          <span aria-hidden className="h-px w-10 sm:w-14 bg-current" />
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight break-keep">
          배우들에게 전하는 응원
        </h1>
        <p className="mt-3 text-sm text-gray-600 max-w-md mx-auto leading-relaxed break-keep">
          <span className="block font-medium text-gray-800">{invite.title}</span>
          관객분들이 신청 폼에 적어주신 응원 메시지와 응원하는 배우 명단입니다.
        </p>

        {/* 요약 stats */}
        {(totalRegistrations > 0 || totalSeats > 0 || items.length > 0) && (
          <div className="mt-6 inline-flex items-center gap-4 sm:gap-6 px-5 py-3 bg-white/80 rounded-full ring-1 ring-[#E8DFCC]/80 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]">
            <Stat label="총 신청" value={totalRegistrations} unit="건" />
            <span aria-hidden className="h-6 w-px bg-gray-200" />
            <Stat label="신청 좌석" value={totalSeats} unit="석" />
            <span aria-hidden className="h-6 w-px bg-gray-200" />
            <Stat label="응원" value={totalMessages} unit="개" />
          </div>
        )}

        {/* 회차별 좌석 breakdown */}
        {roundStats.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {roundStats.map(rs => (
              <span
                key={rs.roundNo}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 ring-1 ring-[#E8DFCC]/80 text-xs"
              >
                <span className="font-semibold text-gray-800">{rs.roundNo}회차</span>
                {rs.teamName && (
                  <span className="text-[#0066B3]/80 font-medium">{rs.teamName}</span>
                )}
                <span aria-hidden className="text-gray-300">·</span>
                <span className="text-gray-700 tabular-nums">
                  <span className="font-bold text-gray-900">{rs.headcount.toLocaleString()}</span>
                  <span className="ml-0.5 text-gray-500">석</span>
                </span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          <Link
            href={`/invite/${invite.year}/${invite.round}`}
            className="underline-offset-4 hover:underline"
          >
            ← 공연 안내로 돌아가기
          </Link>
        </div>
      </header>

      <div className="md:max-w-5xl md:mx-auto">
        {/* Section 1 — 배우 카드 */}
        {actorList.length > 0 && (
          <section className="px-5 py-10">
            <SectionHeading
              eyebrow="Cast"
              title="배우별로 응원 모아보기"
              description="배우 카드를 누르면 그 배우에게 보낸 응원 메시지만 모아 볼 수 있어요"
            />

            <p className="mt-2 text-[11px] text-gray-400 text-center max-w-md mx-auto leading-relaxed break-keep italic">
              ※ &apos;응원하는 배우&apos; 칸은 자유 텍스트라서 매칭이 100% 정확하지 않을 수 있어요. 참고용으로만 봐주세요.
            </p>

            {selectedActor && (
              <div className="mt-5 flex items-center justify-center">
                <button
                  type="button"
                  onClick={onClearFilter}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0066B3] text-white text-xs font-semibold shadow-sm hover:bg-[#0055a0] transition-colors"
                >
                  <span>
                    {selectedActor.roleName} · {selectedActor.actorName} 응원만 보기
                  </span>
                  <span aria-hidden className="opacity-80">✕</span>
                </button>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {actorList.map((r, idx) => {
                const active = selectedKey === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => onSelectActor(r.key)}
                    className={`group text-left animate-fade-in-up transition-transform duration-200 hover:-translate-y-0.5 ${
                      active ? 'ring-2 ring-[#0066B3] ring-offset-2 ring-offset-[#FAF7F2] rounded-2xl' : ''
                    }`}
                    style={{ animationDelay: `${Math.min(idx * 60, 540)}ms`, animationFillMode: 'both' }}
                    aria-pressed={active}
                  >
                    <figure className="bg-white rounded-2xl overflow-hidden ring-1 ring-[#E8DFCC]/70 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.18)]">
                      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                        {r.photoFile ? (
                          <CastingPhoto
                            src={`/invites/${invite.id}/cast/${r.photoFile}`}
                            alt={`${r.roleName} - ${r.actorName}`}
                            crop={r.photoCrop}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <PhotoPlaceholder name={r.actorName} size="sm" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <figcaption className="absolute inset-x-0 bottom-0 p-3 text-white">
                          <div className="text-[11px] uppercase tracking-widest opacity-80">{r.roleName}</div>
                          <div className="mt-0.5 text-base font-bold drop-shadow-md break-keep">
                            {r.actorName}
                          </div>
                        </figcaption>
                      </div>
                      <div className="px-3 py-2 flex items-center justify-end text-[11px]">
                        <span className="text-[#0066B3] font-semibold">
                          {active ? '필터 해제' : '메시지 보기 →'}
                        </span>
                      </div>
                    </figure>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 2 — 응원 메시지 피드 */}
        <section ref={messagesRef} className="px-5 py-10 scroll-mt-6">
          <SectionHeading
            eyebrow="Cheer messages"
            title={selectedActor ? `${selectedActor.actorName} 배우에게 보낸 응원` : '응원 메시지'}
            description={
              selectedActor
                ? `'응원하는 배우' 항목에 ${selectedActor.actorName} 또는 ${selectedActor.roleName}를 적어주신 분들의 메시지예요`
                : '관객분들이 보내주신 응원의 한마디'
            }
          />

          {/* 검색 박스 */}
          {items.length > 0 && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="relative">
                <span
                  aria-hidden
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                >
                  🔍
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  placeholder="이름이나 메시지로 검색"
                  className="w-full pl-10 pr-10 py-2.5 rounded-full ring-1 ring-[#E8DFCC]/80 bg-white/90 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-[#0066B3] focus:outline-none transition-shadow"
                  aria-label="응원 메시지 검색"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs"
                    aria-label="검색어 지우기"
                  >
                    ✕
                  </button>
                )}
              </div>
              {searchQuery.trim() && (
                <p className="mt-2 text-center text-[11px] text-gray-500">
                  검색 결과 {searchedItems.length.toLocaleString()}건
                </p>
              )}
            </div>
          )}

          {searchedItems.length === 0 ? (
            <div className="mt-8 text-center py-16 rounded-2xl bg-white/70 ring-1 ring-[#E8DFCC]/60">
              <div className="text-3xl mb-2">💌</div>
              <p className="text-sm text-gray-600">
                {searchQuery.trim()
                  ? `"${searchQuery.trim()}"에 해당하는 응원이 없어요.`
                  : selectedActor
                    ? '아직 이 배우를 호명한 응원이 없어요.'
                    : '아직 등록된 응원 메시지가 없어요.'}
              </p>
            </div>
          ) : (
            <>
              <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {pageItems.map((it, idx) => (
                  <li
                    key={it.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(idx * 40, 480)}ms`, animationFillMode: 'both' }}
                  >
                    <CheerCard
                      item={it}
                      highlightedActor={selectedActor}
                    />
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  aria-label="응원 메시지 페이지"
                  className="mt-8 flex items-center justify-center gap-2 flex-wrap"
                >
                  <PaginationButton
                    onClick={() => goToPage(effectivePage - 1)}
                    disabled={effectivePage === 0}
                  >
                    ← 이전
                  </PaginationButton>
                  <PageNumbers
                    current={effectivePage}
                    total={totalPages}
                    onSelect={goToPage}
                  />
                  <PaginationButton
                    onClick={() => goToPage(effectivePage + 1)}
                    disabled={effectivePage === totalPages - 1}
                  >
                    다음 →
                  </PaginationButton>
                </nav>
              )}

              <p className="mt-3 text-center text-[11px] text-gray-400 tabular-nums">
                {Math.min(searchedItems.length, effectivePage * PAGE_SIZE + 1)}–
                {Math.min(searchedItems.length, (effectivePage + 1) * PAGE_SIZE)}
                {' / '}
                총 {searchedItems.length.toLocaleString()}건
              </p>
            </>
          )}
        </section>

        {/* footer 안내 */}
        <footer className="px-5 pt-4 pb-2 text-center">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            응원 메시지·응원하는 배우 항목은 관객 신청 폼에서 자율적으로 작성된 내용입니다.
            <br className="hidden sm:inline" />
            공연 종료 후 일정 기간 보관 후 파기됩니다.
          </p>
        </footer>
      </div>
    </main>
  );
}

function PaginationButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-xs sm:text-sm rounded-full ring-1 ring-[#E8DFCC]/80 bg-white/90 text-gray-700 hover:bg-[#0066B3] hover:text-white hover:ring-[#0066B3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:text-gray-700 disabled:hover:ring-[#E8DFCC]/80"
    >
      {children}
    </button>
  );
}

/**
 * 페이지 번호 버튼들 — 총 페이지가 적으면 전부 표시, 많으면 현재 페이지 주변 + 양끝 + 생략(…).
 */
function PageNumbers({
  current,
  total,
  onSelect,
}: {
  current: number;
  total: number;
  onSelect: (page: number) => void;
}) {
  const visible = useMemo(() => buildPageWindow(current, total), [current, total]);
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {visible.map((v, i) =>
        v === 'ellipsis' ? (
          <span key={`e${i}`} aria-hidden className="px-1 text-xs text-gray-400">
            …
          </span>
        ) : (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            aria-current={v === current ? 'page' : undefined}
            className={`min-w-8 h-8 px-2 text-xs sm:text-sm rounded-full tabular-nums transition-colors ${
              v === current
                ? 'bg-[#0066B3] text-white font-semibold'
                : 'text-gray-700 hover:bg-white/90 hover:ring-1 hover:ring-[#E8DFCC]/80'
            }`}
          >
            {v + 1}
          </button>
        ),
      )}
    </div>
  );
}

/**
 * 페이지 번호 윈도우: 첫·끝·현재±1을 보존, 사이는 ellipsis.
 * 입력은 0-indexed. 결과도 0-indexed (또는 'ellipsis').
 */
function buildPageWindow(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const out: Array<number | 'ellipsis'> = [0];
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  if (start > 1) out.push('ellipsis');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 2) out.push('ellipsis');
  out.push(total - 1);
  return out;
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] sm:text-[11px] text-gray-500 tracking-wider uppercase">
        {label}
      </div>
      <div className="mt-0.5 text-xl sm:text-2xl font-bold text-gray-900 tabular-nums">
        {value.toLocaleString()}
        <span className="ml-0.5 text-xs font-medium text-gray-500">{unit}</span>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="text-center">
      <div className="inline-flex items-center gap-3 text-[#0066B3]/50">
        <span aria-hidden className="h-px w-8 sm:w-10 bg-current" />
        <span className="text-[10px] uppercase tracking-[0.35em] font-bold">{eyebrow}</span>
        <span aria-hidden className="h-px w-8 sm:w-10 bg-current" />
      </div>
      <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight break-keep">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed break-keep">
          {description}
        </p>
      )}
    </header>
  );
}

function CheerCard({
  item,
  highlightedActor,
}: {
  item: CheersItem;
  highlightedActor: ActorEntry | null;
}) {
  const supportingNode = item.supportingActors
    ? renderHighlight(item.supportingActors, highlightedActor)
    : null;

  return (
    <article className="h-full bg-white rounded-2xl ring-1 ring-[#E8DFCC]/70 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.2)] p-4 sm:p-5 flex flex-col">
      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FFE9D6] text-[#C2410C] text-[11px] font-bold">
          {Array.from(item.name.trim())[0] ?? '?'}
        </span>
        <span className="font-medium text-gray-800">{item.name}</span>
        {item.isSponsor && (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md bg-amber-100/70 text-amber-800 text-[10px] font-semibold tracking-[0.08em]"
            title="이번 공연 후원자"
          >
            <svg
              viewBox="0 0 16 16"
              className="w-2.5 h-2.5 fill-current"
              aria-hidden
            >
              <path d="M8 1l1.9 4.6L14.7 6 11 9.2l1.1 4.8L8 11.6 3.9 14l1.1-4.8L1.3 6l4.8-.4z" />
            </svg>
            후원
          </span>
        )}
      </div>

      {item.roundSelections.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.roundSelections.map(sel => (
            <span
              key={sel.roundNo}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0066B3]/8 text-[#0066B3] text-[11px] font-semibold tabular-nums"
            >
              <span>{sel.roundNo}회차</span>
              <span aria-hidden className="text-[#0066B3]/40">·</span>
              <span>{sel.headcount}석</span>
            </span>
          ))}
        </div>
      )}

      {supportingNode && (
        <div className="mt-3 rounded-xl bg-[#FAF7F2] px-3 py-2 text-xs">
          <div className="text-[10px] uppercase tracking-wider text-[#0066B3]/70 font-semibold">
            응원하는 배우
          </div>
          <div className="mt-1 text-sm text-gray-800 whitespace-pre-line break-words leading-relaxed">
            {supportingNode}
          </div>
        </div>
      )}

      {item.cheerMessage && (
        <blockquote className="mt-3 flex-1 text-sm text-gray-800 leading-relaxed whitespace-pre-line break-words relative pl-3 border-l-2 border-[#0066B3]/40 italic">
          {item.cheerMessage}
        </blockquote>
      )}
    </article>
  );
}

/**
 * supportingActors 텍스트 안의 (선택된 배우의 별칭들 및 배역명)을 강조 표시.
 * 부분 호명("주리")도 actor.aliases에 포함돼 있으므로 그대로 하이라이트된다.
 */
function renderHighlight(text: string, actor: ActorEntry | null): React.ReactNode {
  if (!actor) return text;
  const needles = [...actor.aliases, actor.roleName].filter(
    (s): s is string => !!s && s.length > 0,
  );
  if (needles.length === 0) return text;

  // 가장 긴 needle을 우선 매칭하여 중첩(배역명·배우명이 부분 겹칠 때) 처리.
  const sorted = [...needles].sort((a, b) => b.length - a.length);

  const out: React.ReactNode[] = [];
  let cursor = 0;
  const lower = text;
  while (cursor < lower.length) {
    let bestIdx = -1;
    let bestNeedle = '';
    for (const n of sorted) {
      const i = lower.indexOf(n, cursor);
      if (i === -1) continue;
      if (bestIdx === -1 || i < bestIdx || (i === bestIdx && n.length > bestNeedle.length)) {
        bestIdx = i;
        bestNeedle = n;
      }
    }
    if (bestIdx === -1) {
      out.push(text.slice(cursor));
      break;
    }
    if (bestIdx > cursor) out.push(text.slice(cursor, bestIdx));
    out.push(
      <mark
        key={`${bestIdx}-${bestNeedle}`}
        className="bg-[#FFE082]/70 text-gray-900 px-0.5 rounded-sm"
      >
        {text.slice(bestIdx, bestIdx + bestNeedle.length)}
      </mark>,
    );
    cursor = bestIdx + bestNeedle.length;
  }
  return out;
}
