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
  purpose: string;
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
  purpose: string;
}

// 사용자 정보 인터페이스
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

// 인증 컨텍스트 타입
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
