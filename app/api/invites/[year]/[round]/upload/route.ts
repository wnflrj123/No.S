import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set(['cast', 'staff', 'poster', 'background']);
const PHOTO_EXT = /\.(png|jpe?g|webp|gif)$/i;
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * 관리자 사진 업로드 API.
 *
 * POST /api/invites/{year}/{round}/upload  (multipart/form-data)
 *   field 'file' : 이미지 파일 (.png/.jpg/.jpeg/.webp/.gif, 최대 15MB)
 *   field 'type' : 'cast' | 'staff' | 'poster' | 'background'
 *     - cast/staff   → public/invites/{id}/{type}/{filename}
 *     - poster/background → public/invites/{id}/{filename}
 *
 * 응답: { filename, url } — Firestore 등에 그대로 저장 가능한 정적 경로
 *
 * 인증: Firebase ID 토큰 (Authorization: Bearer ...) + owner/admin 권한.
 *
 * 주의: 서버 디스크에 저장되므로 git에 자동 반영되지 않음. 영구 보존을
 *      원하면 업로드된 파일을 별도로 commit & push 해야 함.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ year: string; round: string }> },
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { year, round } = await ctx.params;
  if (!/^\d{4}$/.test(year) || !/^\d+$/.test(round)) {
    return NextResponse.json({ error: 'invalid invite id' }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid multipart body' }, { status: 400 });
  }

  const file = formData.get('file');
  const type = formData.get('type');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file 필드가 필요합니다' }, { status: 400 });
  }
  if (typeof type !== 'string' || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json(
      { error: 'type은 cast|staff|poster|background 중 하나' },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '파일이 너무 큽니다 (최대 15MB)' }, { status: 413 });
  }
  if (!PHOTO_EXT.test(file.name)) {
    return NextResponse.json(
      { error: '이미지 파일만 업로드할 수 있습니다 (png/jpg/webp/gif)' },
      { status: 415 },
    );
  }

  // 경로 우회 방지: basename + 선두 점 제거 + NFC 정규화
  const safeName = path.basename(file.name).replace(/^\.+/, '_').normalize('NFC');
  const subfolder = type === 'cast' || type === 'staff' ? type : '';
  const targetDir = path.join(
    process.cwd(),
    'public',
    'invites',
    `${year}-${round}`,
    subfolder,
  );
  await mkdir(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, safeName);
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(targetPath, Buffer.from(arrayBuffer));

  const url = subfolder
    ? `/invites/${year}-${round}/${subfolder}/${safeName}`
    : `/invites/${year}-${round}/${safeName}`;

  return NextResponse.json({ filename: safeName, url });
}

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const idToken = authHeader.slice('Bearer '.length);
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const adminsDoc = await adminDb.collection('settings').doc('admins').get();
    const data = adminsDoc.data();
    if (!data) return false;
    if (data.ownerUid === decoded.uid) return true;
    return Array.isArray(data.uids) && data.uids.includes(decoded.uid);
  } catch {
    return false;
  }
}
