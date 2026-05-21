/**
 * 신청 완료 직후 자동 발송되는 LMS 메시지.
 */

import type { Invite, InviteRegistration } from '@/lib/invites/types';
import { sendLms } from '../client';
import { buildVars, renderTemplate } from '../templates';

export const CONFIRMATION_LMS_TEMPLATE = `[삼성전자 뮤지컬 동호회 No.S 제{회차}회 정기공연]

{이름}님, 신청이 완료되었습니다 🎉

🎭 공연: {공연명}
📅 일시: {회차별 일시}
📍 장소: {공연장명}
👥 신청 인원: 총 {총인원}명

자세한 안내: https://samsung-musical.com/invite/{연도}/{회차}

두근두근 기다리고 있을게요!
- 삼성전자 뮤지컬 동호회 No.S`;

export const CONFIRMATION_LMS_SUBJECT = '[No.S] 정기공연 신청 완료';

/**
 * 신청 완료 LMS를 비동기로 발송. 실패 시 console.error만 남기고 throw하지 않는다.
 * 호출자는 fire-and-forget으로 await 없이 사용하거나, catch로 안전하게 처리해야 한다.
 */
export async function sendConfirmationSms(args: { invite: Invite; registration: InviteRegistration }): Promise<void> {
  const { invite, registration } = args;
  const text = renderTemplate(CONFIRMATION_LMS_TEMPLATE, buildVars(registration, invite));
  const result = await sendLms({ to: registration.phone, text, subject: CONFIRMATION_LMS_SUBJECT });
  if (!result.ok) {
    console.error('[SMS] confirmation send failed', {
      regId: registration.id,
      phone: registration.phone,
      error: result.error,
    });
  }
}
