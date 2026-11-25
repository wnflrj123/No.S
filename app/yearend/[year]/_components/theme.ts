/**
 * 송년 공연 페이지 디자인 토큰 — Atlassian Design System(라이트 테마) 값을 참고했다.
 * 글자: text / subtle / subtlest, 면: surface / sunken, 브랜드 블루, 액센트(옅은 배경 + 진한 글자) 세트.
 */
export const TEXT = '#172B4D';
export const TEXT_SUBTLE = '#44546F';
export const TEXT_SUBTLEST = '#626F86';
export const BORDER = 'rgba(9,30,66,0.14)';
export const SUNKEN = '#F7F8F9';
export const BRAND = '#0C66E4';
export const BRAND_TEXT = '#0055CC';

/** ADS elevation — raised(카드), overlay(떠 있는 카드) */
export const SHADOW_RAISED = '0px 1px 1px rgba(9,30,66,0.25), 0px 0px 1px rgba(9,30,66,0.31)';
export const SHADOW_OVERLAY = '0px 8px 12px rgba(9,30,66,0.15), 0px 0px 1px rgba(9,30,66,0.31)';

/** 액센트 세트 — 아바타·태그에 순서대로 돌려 쓴다 (subtler 배경 + accent 글자) */
export const ACCENTS = [
  { bg: '#DFD8FD', fg: '#5E4DB2' }, // purple
  { bg: '#FDD0EC', fg: '#943D73' }, // magenta
  { bg: '#C6EDFB', fg: '#206A83' }, // teal
  { bg: '#D3F1A7', fg: '#4C6B1F' }, // lime
  { bg: '#F8E6A0', fg: '#7F5F01' }, // yellow
  { bg: '#FEDEC8', fg: '#A54800' }, // orange
  { bg: '#CCE0FF', fg: '#0055CC' }, // blue
  { bg: '#BAF3DB', fg: '#216E4E' }, // green
];

/** 이름 → 액센트 (같은 이름은 항상 같은 색) */
export function accentFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

/** 제목 — 굵고 촘촘하게 */
export const HEADING = 'font-bold tracking-[-0.02em]';
