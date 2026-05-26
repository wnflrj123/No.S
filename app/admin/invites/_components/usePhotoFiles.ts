'use client';

import { useCallback, useEffect, useState } from 'react';

interface FetchedFiles {
  id: string;
  type: string;
  files: string[];
}

const INITIAL: FetchedFiles = { id: '', type: '', files: [] };

interface UsePhotoFilesResult {
  files: string[];
  /** 업로드 등으로 폴더가 바뀌었을 때 호출해 목록을 다시 불러온다. */
  refetch: () => void;
}

/**
 * 관리자 폼에서 사진 파일명 자동완성/드롭다운 용 디렉토리 목록 훅.
 * `public/invites/{inviteId}/{type}/` 의 이미지 파일명들을 비동기로 가져와,
 * 현재 inviteId·type 에 대해 fetch 된 결과만 반환한다. (prop 변경 직후엔 빈 배열)
 *
 * setState 는 비동기 콜백 안에서만 호출 (react-hooks/set-state-in-effect 회피).
 */
export default function usePhotoFiles(
  inviteId: string,
  type: 'cast' | 'staff',
): UsePhotoFilesResult {
  const [fetched, setFetched] = useState<FetchedFiles>(INITIAL);
  const [version, setVersion] = useState(0);

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
  }, [inviteId, type, version]);

  const refetch = useCallback(() => setVersion(v => v + 1), []);

  // 현재 prop과 일치하는 결과만 반환 — inviteId·type 변경 직후엔 즉시 빈 배열로 비춤
  const files = fetched.id === inviteId && fetched.type === type ? fetched.files : [];
  return { files, refetch };
}
