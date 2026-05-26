'use client';

import { useEffect, useState } from 'react';

/**
 * 관리자 폼에서 사진 파일명 자동완성(<datalist>) 용 디렉토리 목록 훅.
 * `public/invites/{inviteId}/{type}/` 의 이미지 파일명들을 비동기로 가져온다.
 * inviteId 형식이 "{year}-{round}" 가 아니거나 디렉토리가 없으면 빈 배열.
 */
export default function usePhotoFiles(
  inviteId: string,
  type: 'cast' | 'staff',
): string[] {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    if (!/^\d+-\d+$/.test(inviteId)) {
      setFiles([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/invites/${inviteId}/photo-files?type=${type}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { files: [] }))
      .then((data: { files?: string[] }) => {
        if (!cancelled) setFiles(data.files ?? []);
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [inviteId, type]);

  return files;
}
