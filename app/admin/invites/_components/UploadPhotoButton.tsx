'use client';

import { useRef, useState } from 'react';
import { FiLoader, FiUpload } from 'react-icons/fi';
import { getAuth } from 'firebase/auth';

export type UploadType = 'cast' | 'staff' | 'poster' | 'background';

interface Props {
  inviteId: string; // "{year}-{round}"
  type: UploadType;
  onUploaded: (result: { filename: string; url: string }) => void;
  className?: string;
  title?: string;
  ariaLabel?: string;
  disabled?: boolean;
  /** 아이콘 옆에 표시할 텍스트. 미지정 시 아이콘만 렌더. */
  label?: string;
}

/**
 * 로컬 파일 업로드 버튼. 클릭하면 파일 선택창이 열리고,
 * 선택한 이미지를 /api/invites/{year}/{round}/upload 로 보낸다.
 * 성공 시 onUploaded(result) 호출.
 */
export default function UploadPhotoButton({
  inviteId,
  type,
  onUploaded,
  className,
  title,
  ariaLabel,
  disabled,
  label,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    const match = inviteId.match(/^(\d+)-(\d+)$/);
    if (!match) {
      alert('inviteId 형식이 올바르지 않습니다');
      return;
    }
    const [, year, round] = match;

    setUploading(true);
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) {
        alert('로그인이 필요합니다');
        return;
      }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      const res = await fetch(`/api/invites/${year}/${round}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: fd,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        alert(err.error ?? `업로드 실패 (${res.status})`);
        return;
      }
      const result = (await res.json()) as { filename: string; url: string };
      onUploaded(result);
    } catch (e) {
      alert(e instanceof Error ? e.message : '업로드 중 오류');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={uploading || disabled}
        onClick={() => inputRef.current?.click()}
        className={
          className ??
          'shrink-0 px-2 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
        }
        title={title ?? '로컬에서 업로드'}
        aria-label={ariaLabel ?? '사진 업로드'}
      >
        {uploading ? <FiLoader className="animate-spin" /> : <FiUpload />}
        {label && <span>{label}</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={async e => {
          const file = e.target.files?.[0];
          // 같은 파일을 다시 선택할 수 있도록 input 값 비우기
          e.currentTarget.value = '';
          if (!file) return;
          await handleFile(file);
        }}
      />
    </>
  );
}
