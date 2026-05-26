'use client';

import { useEffect, useState } from 'react';

interface FetchedFiles {
  id: string;
  type: string;
  files: string[];
}

const INITIAL: FetchedFiles = { id: '', type: '', files: [] };

/**
 * 관리자 폼에서 사진 파일명 자동완성(<datalist>) 용 디렉토리 목록 훅.
 * `public/invites/{inviteId}/{type}/` 의 이미지 파일명들을 비동기로 가져와,
 * 현재 inviteId·type 에 대해 fetch 된 결과만 반환한다. (prop 변경 직후엔 빈 배열)
 *
 * setState 는 비동기 콜백 안에서만 호출 (react-hooks/set-state-in-effect 회피).
 */
export default function usePhotoFiles(
  inviteId: string,
  type: 'cast' | 'staff',
): string[] {
  const [fetched, setFetched] = useState<FetchedFiles>(INITIAL);

  useEffect(() => {
    const match = inviteId.match(/^(\d+)-(\d+)$/);
    if (!match) return;
    const [, year, round] = match;
    let cancelled = false;
    fetch(`/api/invites/${year}/${round}/photo-files?type=${type}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { files: [] }))
      .then((data: { files?: string[] }) => {
        if (!cancelled) setFetched({ id: inviteId, type, files: data.files ?? [] });
      })
      .catch(() => {
        if (!cancelled) setFetched({ id: inviteId, type, files: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [inviteId, type]);

  // 현재 prop과 일치하는 결과만 반환 — inviteId·type 변경 직후엔 즉시 빈 배열로 비춤
  return fetched.id === inviteId && fetched.type === type ? fetched.files : [];
}
