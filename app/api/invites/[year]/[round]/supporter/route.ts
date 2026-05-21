import { NextResponse } from 'next/server';
import { addSupporter, getInvite, inviteIdFrom } from '@/lib/invites/server';
import { MAX_NAME_LENGTH } from '@/lib/invites/constants';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ year: string; round: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  const { year, round } = await params;

  let body: { name?: unknown };
  try {
    body = (await req.json()) as { name?: unknown };
  } catch {
    return NextResponse.json({ message: '잘못된 요청입니다.' }, { status: 400 });
  }

  const rawName = typeof body.name === 'string' ? body.name.trim() : '';
  if (!rawName) {
    return NextResponse.json({ message: '이름을 입력해주세요.' }, { status: 400 });
  }
  if (rawName.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ message: `이름은 ${MAX_NAME_LENGTH}자 이내로 입력해주세요.` }, { status: 400 });
  }

  const invite = await getInvite(year, round);
  if (!invite || !invite.isPublished) {
    return NextResponse.json({ message: '공연을 찾을 수 없습니다.' }, { status: 404 });
  }

  try {
    const { id } = await addSupporter(inviteIdFrom(year, round), rawName);
    return NextResponse.json({ ok: true, id, name: rawName }, { status: 201 });
  } catch (err) {
    console.error('[supporter] add failed', err);
    return NextResponse.json({ message: '저장에 실패했습니다.' }, { status: 500 });
  }
}
