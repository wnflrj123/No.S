import type { ProgramItem, YearEndConcert } from './types';
import { yearEnd2026 } from './2026';

const CONCERTS: Record<number, YearEndConcert> = {
  2026: yearEnd2026,
};

export function listYearEndYears(): number[] {
  return Object.keys(CONCERTS).map(Number);
}

export function getYearEndConcert(year: string | number): YearEndConcert | null {
  const y = typeof year === 'number' ? year : Number(year);
  if (!Number.isInteger(y)) return null;
  return CONCERTS[y] ?? null;
}

/** 무대에 서는 사람 이름 (중복 제거). 강사처럼 staff로 표시된 크레딧과 이벤트는 제외한다. */
export function itemPerformers(item: ProgramItem): string[] {
  if (item.kind === 'event') return [];
  return [...new Set(item.credits.filter(c => !c.staff).flatMap(c => c.names))];
}

/**
 * 부 안에서 곡(song)에만 붙는 번호를 계산한다. 이벤트·단막극은 번호 없음(null).
 * 반환 배열은 items와 같은 길이.
 */
export function songNumbers(items: ProgramItem[]): (number | null)[] {
  let n = 0;
  return items.map(item => (item.kind === 'song' ? ++n : null));
}

/** 전체 출연진 이름을 가나다순으로 만든다. */
export function listCast(concert: YearEndConcert): string[] {
  const names = new Set<string>();
  for (const part of concert.parts) {
    for (const item of part.items) itemPerformers(item).forEach(n => names.add(n));
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'ko'));
}

export function countSongs(concert: YearEndConcert): number {
  return concert.parts.reduce((sum, p) => sum + p.items.filter(i => i.kind === 'song').length, 0);
}
