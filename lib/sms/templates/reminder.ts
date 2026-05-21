/**
 * 공연 하루 전 리마인더 LMS 기본 텍스트.
 * 관리자 페이지의 일괄 발송 UI에서 textarea 초기값으로 사용된다.
 * 운영자가 발송 전에 자유롭게 수정 가능.
 */

export const REMINDER_LMS_TEMPLATE = `[삼성전자 뮤지컬 동호회 No.S] {이름}님, 내일 공연 잊지 않으셨죠? 🎭

🎭 {공연명}
📅 {회차별 일시}
📍 {공연장명}
👥 신청 인원: 총 {총인원}명

만나뵙기를 정말 기대하고 있어요!
편하게 와주세요 💛
- 삼성전자 뮤지컬 동호회 No.S`;

export const REMINDER_LMS_SUBJECT = '[No.S] 내일 공연 안내';
