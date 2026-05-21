/**
 * SMS 메시지 템플릿 변수 치환 유틸리티.
 *
 * 운영자가 메시지 본문에 `{이름}`, `{회차별 일시}` 같은 한국어 변수를 직접 쓸 수 있도록
 * 키를 한국어로 지원한다.
 */

import { formatInTimeZone } from 'date-fns-tz';
import { ko } from 'date-fns/locale';
import type { Invite, InviteRegistration } from '@/lib/invites/types';
import type { TemplateVars } from './types';

const KST = 'Asia/Seoul';

/**
 * 템플릿 문자열의 `{변수명}` 패턴을 vars로 치환.
 * 매칭되지 않는 변수는 원문 그대로 유지(운영자가 오타를 알아볼 수 있도록).
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const trimmed = key.trim();
    return vars[trimmed] ?? match;
  });
}

/**
 * 신청자 + invite 정보로 표준 변수 세트를 만든다.
 *
 * 지원 키:
 * - {이름}            신청자 이름
 * - {공연명}          invite.title
 * - {부제}            invite.subtitle (없으면 빈 문자열)
 * - {연도}            invite.year
 * - {회차}            invite.round
 * - {공연장명}        invite.venue.name
 * - {주소}            invite.venue.address
 * - {회차별 일시}     신청한 회차들을 "1회 6월 20일(토) 14:00 (2명), 2회 ..." 식으로
 * - {총인원}          신청한 회차들의 헤드카운트 합
 * - {신청회차}        쉼표 구분 회차 번호만 (예: "1회, 2회")
 * - {예매번호}        registration ID
 */
export function buildVars(reg: InviteRegistration, invite: Invite): TemplateVars {
  const totalHeadcount = reg.roundSelections.reduce((s, x) => s + x.headcount, 0);

  const roundDetails = reg.roundSelections
    .map(sel => {
      const round = invite.rounds.find(r => r.roundNo === sel.roundNo);
      if (!round) return `${sel.roundNo}회 (${sel.headcount}명)`;
      const time = formatInTimeZone(round.startAt.toDate(), KST, 'M월 d일(EEE) HH:mm', { locale: ko });
      return `${sel.roundNo}회 ${time} (${sel.headcount}명)`;
    })
    .join(', ');

  const roundNumbers = reg.roundSelections.map(s => `${s.roundNo}회`).join(', ');

  return {
    이름: reg.name,
    공연명: invite.title,
    부제: invite.subtitle ?? '',
    연도: String(invite.year),
    회차: String(invite.round),
    공연장명: invite.venue.name,
    주소: invite.venue.address,
    '회차별 일시': roundDetails,
    총인원: String(totalHeadcount),
    신청회차: roundNumbers,
    예매번호: reg.id,
  };
}
