import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set(['cast', 'staff']);
const PHOTO_EXT = /\.(png|jpe?g|webp|gif)$/i;

/**
 * 관리자 폼에서 사진 파일명을 선택할 수 있도록 디렉토리 목록을 반환.
 *
 * GET /api/invites/{year}/{round}/photo-files?type=cast|staff
 *   → { files: string[] }: public/invites/{year}-{round}/{type}/ 의 이미지 파일명들
 * 디렉토리가 없거나 비어 있으면 빈 배열을 반환한다.
 * 파일 자체가 정적으로 공개되어 있어 별도 인증은 요구하지 않는다.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ year: string; round: string }> },
) {
  const { year, round } = await ctx.params;
  const type = req.nextUrl.searchParams.get('type');

  if (!type || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: 'invalid type' }, { status: 400 });
  }
  if (!/^\d{4}$/.test(year) || !/^\d+$/.test(round)) {
    return NextResponse.json({ error: 'invalid invite id' }, { status: 400 });
  }

  const dir = path.join(process.cwd(), 'public', 'invites', `${year}-${round}`, type);
  try {
    const entries = await readdir(dir);
    const files = entries
      .filter(name => !name.startsWith('.') && PHOTO_EXT.test(name))
      .sort((a, b) => a.localeCompare(b, 'ko'));
    return NextResponse.json({ files });
  } catch {
    // 디렉토리 없음 등 — 빈 목록으로 응답
    return NextResponse.json({ files: [] });
  }
}
