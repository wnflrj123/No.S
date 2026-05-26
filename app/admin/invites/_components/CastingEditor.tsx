'use client';

import { useState } from 'react';
import { FiCrop, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { CastingEntry, InviteRole } from '@/lib/invites/types';
import usePhotoFiles from './usePhotoFiles';
import CropEditor from './CropEditor';

interface Props {
  value: CastingEntry[];
  onChange: (next: CastingEntry[]) => void;
  roles: InviteRole[];
  inviteId: string; // "2026-1" 등, 사진 경로 안내용
}

export default function CastingEditor({ value, onChange, roles, inviteId }: Props) {
  const photoFiles = usePhotoFiles(inviteId, 'cast');
  const [croppingIdx, setCroppingIdx] = useState<number | null>(null);

  const update = (index: number, patch: Partial<CastingEntry>) => {
    onChange(value.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => {
    onChange([
      ...value,
      { roleId: roles[0]?.id ?? '', actorName: '', photoFile: '' },
    ]);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        사진은 <code>/public/invites/{inviteId}/cast/</code> 폴더에 파일을 넣은 뒤 드롭다운에서 선택하세요. 폴더에 없는 파일은 먼저 추가해야 선택할 수 있어요.
      </p>
      {roles.length === 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          ⚠️ 먼저 위쪽 &quot;배역&quot; 섹션에서 배역을 추가해주세요.
        </p>
      )}
      <ul className="space-y-2">
        {value.map((c, i) => (
          <li key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto_auto] gap-2 items-start">
              <select
                value={c.roleId}
                onChange={e => update(i, { roleId: e.target.value })}
                className="input"
                required
                disabled={roles.length === 0}
              >
                <option value="" disabled>
                  배역 선택
                </option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name || '(이름 없음)'}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={c.actorName}
                onChange={e => update(i, { actorName: e.target.value })}
                placeholder="배우 이름"
                maxLength={40}
                className="input"
                required
              />
              <select
                value={c.photoFile ?? ''}
                onChange={e => {
                  const next = e.target.value || undefined;
                  // 사진을 변경/제거하면 기존 crop은 의미 없으므로 함께 비움
                  update(i, { photoFile: next, photoCrop: undefined });
                }}
                className="input"
              >
                <option value="">사진 없음</option>
                {photoFiles.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
                {c.photoFile && !photoFiles.includes(c.photoFile) && (
                  <option value={c.photoFile}>{c.photoFile} (폴더에 없음)</option>
                )}
              </select>
              <button
                type="button"
                onClick={() => setCroppingIdx(i)}
                disabled={!c.photoFile}
                title={c.photoFile ? (c.photoCrop ? '사진 자르기 (설정됨)' : '사진 자르기') : '사진을 먼저 선택하세요'}
                className={`px-2 py-2 rounded-lg flex items-center justify-center ${
                  c.photoFile
                    ? c.photoCrop
                      ? 'text-[#0066B3] bg-blue-50 hover:bg-blue-100'
                      : 'text-gray-600 hover:bg-gray-100'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                aria-label="사진 자르기"
              >
                <FiCrop />
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                aria-label="삭제"
              >
                <FiTrash2 />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        disabled={roles.length === 0}
        className="w-full py-2 text-sm text-[#0066B3] border border-dashed border-[#0066B3]/40 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiPlus /> 캐스팅 추가
      </button>

      {croppingIdx !== null && value[croppingIdx]?.photoFile && (
        <CropEditor
          src={`/invites/${inviteId}/cast/${value[croppingIdx].photoFile}`}
          initialCrop={value[croppingIdx].photoCrop}
          onSave={crop => {
            update(croppingIdx, { photoCrop: crop ?? undefined });
            setCroppingIdx(null);
          }}
          onClose={() => setCroppingIdx(null)}
        />
      )}
    </div>
  );
}
