import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import {
  getInvite,
  inviteIdFrom,
  listRegistrationsServer,
  verifyAdminToken,
  type BulkSmsTarget,
} from '@/lib/invites/server';
import { sendLms } from '@/lib/sms/client';
import { buildVars, renderTemplate } from '@/lib/sms/templates';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string }>;
}

interface BulkSmsPayload {
  messageTemplate: string;
  subject?: string;
  targetType: BulkSmsTarget;
  roundNo?: number;
}

const MAX_TEMPLATE_LENGTH = 2000;

export async function POST(req: Request, { params }: RouteParams) {
  // 1. 인증 — Bearer 토큰으로 admin 검증
  const adminUid = await verifyAdminToken(req.headers.get('authorization'));
  if (!adminUid) {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  // 2. 입력 파싱·검증
  let body: BulkSmsPayload;
  try {
    body = (await req.json()) as BulkSmsPayload;
  } catch {
    return NextResponse.json({ message: '잘못된 요청 본문입니다.' }, { status: 400 });
  }

  if (!body.messageTemplate?.trim()) {
    return NextResponse.json({ message: '메시지 본문을 입력해주세요.' }, { status: 400 });
  }
  if (body.messageTemplate.length > MAX_TEMPLATE_LENGTH) {
    return NextResponse.json(
      { message: `메시지는 ${MAX_TEMPLATE_LENGTH}자 이내여야 합니다.` },
      { status: 400 },
    );
  }
  if (!['all', 'round', 'sponsors'].includes(body.targetType)) {
    return NextResponse.json({ message: '발송 대상이 올바르지 않습니다.' }, { status: 400 });
  }
  if (body.targetType === 'round' && typeof body.roundNo !== 'number') {
    return NextResponse.json({ message: '회차를 선택해주세요.' }, { status: 400 });
  }

  // 3. invite 로드 + 신청자 조회
  const { year, round } = await params;
  const invite = await getInvite(year, round);
  if (!invite) {
    return NextResponse.json({ message: '공연을 찾을 수 없습니다.' }, { status: 404 });
  }
  const inviteId = inviteIdFrom(year, round);
  const regs = await listRegistrationsServer(inviteId, body.targetType, body.roundNo);

  if (regs.length === 0) {
    return NextResponse.json({ total: 0, success: 0, failure: 0, failures: [] });
  }

  // 4. 순차 발송. 부분 실패를 개별 추적해 클라이언트에 보고한다.
  type Result = { regId: string; name: string; phone: string; ok: boolean; error?: string };
  const results: Result[] = [];
  for (const reg of regs) {
    const text = renderTemplate(body.messageTemplate, buildVars(reg, invite));
    const result = await sendLms({ to: reg.phone, text, subject: body.subject });
    results.push({ regId: reg.id, name: reg.name, phone: reg.phone, ...result });
  }

  const success = results.filter(r => r.ok);
  const failures = results.filter(r => !r.ok);

  // 5. 발송 이력 저장 (감사 추적)
  await adminDb.collection('smsLogs').add({
    inviteId,
    template: body.messageTemplate,
    subject: body.subject ?? null,
    targetType: body.targetType,
    roundNo: body.roundNo ?? null,
    totalCount: regs.length,
    successCount: success.length,
    failureCount: failures.length,
    failures: failures.map(f => ({ name: f.name, phone: f.phone, error: f.error ?? null })),
    createdAt: Timestamp.now(),
    createdBy: adminUid,
  });

  return NextResponse.json({
    total: regs.length,
    success: success.length,
    failure: failures.length,
    // 운영자가 실패 원인을 즉시 볼 수 있도록 솔라피 에러 메시지도 함께 반환
    failures: failures.map(f => ({ name: f.name, phone: f.phone, error: f.error })),
  });
}
