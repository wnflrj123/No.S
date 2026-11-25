/**
 * 송년 공연 페이지 - 타입 정의
 *
 * 콘텐츠는 Firestore가 아닌 코드 데이터 파일(lib/yearend/{year}.ts)로 관리한다.
 * 셋리스트·출연진이 바뀌면 데이터 파일만 수정하면 된다.
 */

/** 곡 출처 구분 — 화면에 "뮤지컬 〈○○〉" / "○○"처럼 표시된다. */
export type SongSourceKind = 'musical' | 'artist' | 'other';

export interface SongSource {
  kind: SongSourceKind;
  name: string;
}

/**
 * 출연 크레딧 한 줄. label이 없으면 이름만 나열한다.
 * 예: { names: ['주현지'] }, { label: '연출', names: ['이경환'], lead: true }
 * names에는 실명만 넣는다 — 출연진 목록이 이 이름으로 집계된다.
 */
export interface Credit {
  label?: string;
  names: string[];
  /** 연출·강사·반장처럼 앞에 강조해서 보여 줄 역할 */
  lead?: boolean;
  /** 무대에 서지 않는 사람(예: 강사). 출연진 목록 집계에서 빠진다. */
  staff?: boolean;
}

export interface SongItem {
  kind: 'song';
  title: string;
  source?: SongSource;
  /** 곡 제목 아래 한 줄 소개 (예: "No.S 아카데미 발표 무대") */
  blurb?: string;
  /** 가족과 함께 서는 무대면 그 설명 — "가족 무대" 배지와 함께 보여 준다 */
  family?: string;
  /** 팀명 (예: "뚱치땅치 밴드") */
  group?: string;
  credits: Credit[];
  /** 크레딧 뒤에 붙는 한 줄 메모 (예: "그리고 오늘의 공연자 모두") */
  note?: string;
}

/** 히든덕기·송별회·퇴임식 같은 곡이 아닌 순서 */
export interface EventItem {
  kind: 'event';
  emoji?: string;
  title: string;
  description?: string;
}

export interface PlayItem {
  kind: 'play';
  emoji?: string;
  /** 카드 위 작은 라벨 (기본값 "단막극") */
  label?: string;
  title: string;
  description?: string;
  durationMin?: number;
  /** 가족과 함께 서는 무대면 그 설명 */
  family?: string;
  credits: Credit[];
}

export type ProgramItem = SongItem | EventItem | PlayItem;

export interface ProgramPart {
  no: number;
  title: string;
  subtitle: string;
  description: string;
  /** 부 머리에 붙는 아이콘 타일 이모지 */
  icon: string;
  /** 이 부의 강조 글자색 (흰 배경·surface 위에서 읽혀야 함) */
  accent: string;
  /** 진한 강조 배경색 (흰 글자를 올림) */
  bold: string;
  /** 아주 옅은 배경색 */
  surface: string;
  /** 옅은 배경색 (아이콘 타일·태그) */
  tint: string;
}

export interface ProgramPartWithItems extends ProgramPart {
  items: ProgramItem[];
}

export interface ConcertVenue {
  name: string;
  address?: string;
  directions?: string;
  /** 지도 임베드 iframe src (https, 허용 호스트만 표시됨) */
  mapEmbedUrl?: string;
  mapLinks?: {
    naver?: string;
    kakao?: string;
    google?: string;
  };
}

/** 관람 안내 한 항목 */
export interface VisitNotice {
  emoji: string;
  title: string;
  body: string;
}

export interface YearEndConcert {
  year: number;
  /** 브라우저 탭·공유 미리보기에 쓰는 전체 제목 */
  title: string;
  /** 히어로 맨 위 한 줄 (예: "No.S 2026 송년 공연") */
  overline: string;
  /** 히어로 타이틀 조각: "{heroLead} {heroNumber}{heroUnit}" */
  heroLead: string;
  heroNumber: number;
  heroUnit: string;
  tagline: string;
  /** 소개 문단 (줄바꿈 \n 허용) */
  intro: string;
  /** 소개 아래 해시태그 (# 없이) */
  hashtags?: string[];
  /** 출연진 섹션 맨 위에 보여 줄 공연 전체 역할 (예: 총연출, MC) */
  crew: { label: string; names: string[] }[];
  /** 공연 시작 시각 ISO 문자열 (KST 오프셋 포함, 예: "2026-12-19T17:00:00+09:00"). 미정이면 생략 */
  startAt?: string;
  /** 미정이면 생략 — 페이지에 "곧 안내" 문구가 표시된다 */
  venue?: ConcertVenue;
  notices?: VisitNotice[];
  /** 관객 신청 링크. 없으면 신청 버튼을 숨긴다. */
  apply?: {
    url: string;
    /** 버튼 위·아래에 붙는 짧은 안내 (예: "12월 12일까지 받아요") */
    note?: string;
  };
  parts: ProgramPartWithItems[];
}
