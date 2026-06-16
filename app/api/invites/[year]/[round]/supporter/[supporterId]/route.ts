import { NextResponse } from 'next/server';
import {
  deleteSupporter,
  setSupporterAmount,
  setSupporterMemo,
  verifyAdminToken,
} from '@/lib/invites/server';
import { MAX_SPONSOR_MEMO_LENGTH } from '@/lib/invites/constants';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string; supporterId: string }>;
}

/**
 * Admin이 현장 후원자 정보를 수정.
 * body: { amount?: number | null, memo?: string | null }
 *   - amount: 후원 금액. null 또는 0이면 필드 제거.
 *   - memo: 후원 메모(물품·서비스 등). null 또는 빈 문자열이면 필드 제거.
 *   둘 중 하나 이상 포함되어야 한다.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const adminUid = await verifyAdminToken(req.headers.get('authorization'));
  if (!adminUid) {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
  }
  const { supporterId } = await params;
  if (!supporterId) {
    return NextResponse.json({ message: 'supporter ID가 필요합니다.' }, { status: 400 });
  }

  let body: { amount?: unknown; memo?: unknown };
  try {
    body = (await req.json()) as { amount?: unknown; memo?: unknown };
  } catch {
    return NextResponse.json({ message: '잘못된 요청 본문입니다.' }, { status: 400 });
  }
  const hasAmount = body.amount !== undefined;
  const hasMemo = body.memo !== undefined;
  if (!hasAmount && !hasMemo) {
    return NextResponse.json(
      { message: 'amount(number|null) 또는 memo(string|null) 중 하나 이상이 필요합니다.' },
      { status: 400 },
    );
  }

  try {
    if (hasAmount) {
      const v = body.amount;
      const amount = v === null ? null : typeof v === 'number' && Number.isFinite(v) ? v : NaN;
      if (Number.isNaN(amount as number)) {
        return NextResponse.json(
          { message: 'amount는 숫자 또는 null이어야 합니다.' },
          { status: 400 },
        );
      }
      const ok = await setSupporterAmount(supporterId, amount as number | null);
      if (!ok) return NextResponse.json({ message: '대상을 찾을 수 없습니다.' }, { status: 404 });
    }
    if (hasMemo) {
      const v = body.memo;
      if (v !== null && typeof v !== 'string') {
        return NextResponse.json(
          { message: 'memo는 문자열 또는 null이어야 합니다.' },
          { status: 400 },
        );
      }
      try {
        const ok = await setSupporterMemo(supporterId, v as string | null);
        if (!ok) return NextResponse.json({ message: '대상을 찾을 수 없습니다.' }, { status: 404 });
      } catch (e) {
        if (e instanceof Error && e.message === 'MEMO_TOO_LONG') {
          return NextResponse.json(
            { message: `메모는 ${MAX_SPONSOR_MEMO_LENGTH}자 이내로 입력해주세요.` },
            { status: 400 },
          );
        }
        throw e;
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] patch supporter failed', err);
    return NextResponse.json({ message: '변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const adminUid = await verifyAdminToken(req.headers.get('authorization'));
  if (!adminUid) {
    return NextResponse.json({ message: '관리자 권한이 필요합니다.' }, { status: 401 });
  }

  const { supporterId } = await params;
  if (!supporterId) {
    return NextResponse.json({ message: 'supporter ID가 필요합니다.' }, { status: 400 });
  }

  try {
    const ok = await deleteSupporter(supporterId);
    if (!ok) return NextResponse.json({ message: '대상을 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] delete supporter failed', err);
    return NextResponse.json({ message: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
