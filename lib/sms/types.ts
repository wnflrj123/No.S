/**
 * SMS 발송 관련 타입
 */

export interface SendSmsInput {
  to: string; // 수신번호 (010XXXXXXXX, 하이픈 제거된 형태)
  text: string; // 본문
  subject?: string; // LMS 제목 (선택)
}

export interface SendSmsResult {
  ok: boolean;
  error?: string;
}

// 메시지 템플릿 치환에 사용되는 변수 타입.
// 키는 한국어 그대로 사용해 운영자 친화적인 입력이 가능하도록 한다.
export type TemplateVars = Record<string, string>;
