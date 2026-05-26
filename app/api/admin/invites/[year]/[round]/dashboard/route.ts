import { NextResponse } from 'next/server';
import {
  getInvite,
  inviteIdFrom,
  listAllRegistrationsServer,
  listSupportersServer,
  verifyAdminToken,
} from '@/lib/invites/server';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string }>;
}

/**
 * 어드민 신청자 관리 페이지의 초기 데이터를 한 번에 반환.
 *
 * 기존 어드민 페이지는 Firebase JS SDK로 invite/registrations/supporters를 각각
 * 클라이언트에서 조회했고, 매번 SDK 콜드 핸드셰이크 + 인증 토큰 verify 라운드가
 * 끼어 체감 1~2초 지연이 있었다. 이 엔드포인트는:
 *  - admin SDK로 서버에서 3개 쿼리를 Promise.all로 병렬 fetch
 *  - 인증 verify 1회만 수행
 *  - 결과를 JSON 한 번에 반환
 *
 * 동호회 규모(신청자 100명 미만)에서는 응답 200~400ms 수준.
 */
export async function GET(req: Request, { params }: RouteParams) {
  const adminUid = await verifyAdminToken(req.headers.get('authorization'));
  if (!adminUid) {
    return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 });
  }

  const { year, round } = await params;
  const inviteId = inviteIdFrom(year, round);

  const [invite, registrations, supporters] = await Promise.all([
    getInvite(year, round),
    listAllRegistrationsServer(inviteId).catch(err => {
      console.error('[admin dashboard] registrations fetch failed', err);
      return [];
    }),
    listSupportersServer(inviteId).catch(err => {
      console.error('[admin dashboard] supporters fetch failed', err);
      return [];
    }),
  ]);

  if (!invite) {
    return NextResponse.json({ invite: null, registrations: [], supporters: [] });
  }

  return NextResponse.json({
    invite,
    registrations,
    supporters,
  });
}
