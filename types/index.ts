/**
 * No.S 동호회 예약 공유 시스템 - TypeScript 타입 정의
 */

// 예약 장소 타입
export type LocationType = '합동연습실' | 'ART8실' | '댄스3실' | '기타';

// 예약 정보 인터페이스
export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string; // YYYY-MM-DD 형식
  startTime: string; // HH:mm 형식
  endTime: string; // HH:mm 형식
  location: LocationType;
  customLocation?: string; // "기타" 선택 시만 사용
  locationUrl?: string; // 지도 링크 ("기타" 선택 시)
  purpose: string;
  repeatGroupId?: string; // 반복 일정 그룹 ID
  createdAt: Date;
  updatedAt: Date;
}

// Firestore 문서 형식 (Date를 Timestamp로 저장)
export interface ReservationDoc {
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  location: LocationType;
  customLocation?: string;
  locationUrl?: string;
  purpose: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// 예약 폼 데이터
export interface ReservationFormData {
  date: string;
  startTime: string;
  endTime: string;
  location: LocationType;
  customLocation?: string;
  locationUrl?: string;
  purpose: string;
}

// 사용자 정보 인터페이스
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
  customName?: string | null;
}

// 인증 컨텍스트 타입
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  effectiveName: string;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateCustomName: (name: string) => Promise<void>;
}

// 동호회 행사 인터페이스
export interface ClubEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD 형식 (시작일)
  endDate?: string; // YYYY-MM-DD 형식 (종료일, 여러날 행사)
  startTime?: string; // HH:mm 형식 (선택)
  endTime?: string; // HH:mm 형식 (선택)
  location?: string;
  locationUrl?: string; // 지도 링크 (네이버지도, 카카오맵 등)
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

// 동호회 행사 폼 데이터
export interface ClubEventFormData {
  title: string;
  description: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  locationUrl?: string;
}

// 정기 일정 인터페이스
export interface ScheduledActivity {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD 형식
  startTime: string; // HH:mm 형식
  endTime: string; // HH:mm 형식
  location: LocationType;
  customLocation?: string;
  locationUrl?: string;
  description?: string;
  repeatGroupId?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

// 정기 일정 폼 데이터
export interface ScheduledActivityFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: LocationType;
  customLocation?: string;
  locationUrl?: string;
  description?: string;
}

// 공지사항 인터페이스
export interface Notice {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

// 공지사항 폼 데이터
export interface NoticeFormData {
  title: string;
  content: string;
  pinned: boolean;
}

// 작품 정보 - Character
export interface MusicalCharacter {
  id: number;
  name: string;
  abbr?: string; // 축약어 (붙여넣기 매핑용)
  description: string;
}

// 작품 정보 - Number (장면 내 넘버)
export interface MusicalNumber {
  id: number;
  index: number;
  title: string;
  characters: number[]; // MusicalCharacter.id 배열 (Musical.characters에서 참조)
}

// 작품 정보 - Scene (막/장)
export interface MusicalScene {
  id: number;
  index: number;
  title: string;
  numbers: MusicalNumber[];
}

// 작품 정보 - Musical
export interface Musical {
  id: string; // Firestore document ID
  name: string;
  imageUrl?: string;
  characters: MusicalCharacter[]; // 작품 전체 캐릭터 목록 (단일 정의)
  scenes: MusicalScene[];
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

// 작품 등록 폼 데이터
export interface MusicalFormData {
  name: string;
  imageUrl: string;
  characters: MusicalCharacter[];
  scenes: MusicalScene[];
}

// 프로덕션 - 스태프 역할
export type StaffRole = 'DIRECTOR' | 'MUSIC_DIRECTOR' | 'CHOREOGRAPHER' | 'STAGE_MANAGER';

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  DIRECTOR: '연출',
  MUSIC_DIRECTOR: '음악감독',
  CHOREOGRAPHER: '안무',
  STAGE_MANAGER: '무대감독',
};

// 프로덕션 - 스태프
export interface ProductionStaff {
  userId: string;
  role: StaffRole;
}

// 프로덕션 - 캐스팅 (캐릭터 ↔ 배우 매핑)
export interface ProductionCasting {
  characterId: number; // MusicalCharacter.id
  userId: string;
}

// 프로덕션 - 공연 회차
export interface ProductionPerformance {
  id: string;
  dateTime: string; // YYYY-MM-DDTHH:mm
  location?: string;
  castings: ProductionCasting[];
}

// 프로덕션
export interface Production {
  id: string;
  name: string;
  description?: string;
  musicalId: string;
  locations: string[];   // 공연 장소 목록
  staffs: ProductionStaff[];
  performances: ProductionPerformance[];
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

// 프로덕션 폼 데이터
export interface ProductionFormData {
  name: string;
  description: string;
  musicalId: string;
  locations: string[];
  staffs: ProductionStaff[];
  performances: ProductionPerformance[];
  startDate: string;
  endDate: string;
}
