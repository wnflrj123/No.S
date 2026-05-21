'use client';

import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { CastingEntry, InviteRole } from '@/lib/invites/types';

interface Props {
  value: CastingEntry[];
  onChange: (next: CastingEntry[]) => void;
  roles: InviteRole[];
  inviteId: string; // "2026-1" 등, 사진 경로 안내용
}

export default function CastingEditor({ value, onChange, roles, inviteId }: Props) {
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
        사진은 <code>/public/invites/{inviteId}/cast/</code> 폴더에 파일을 추가한 후 파일명만 입력하세요. (예: <code>kim.jpg</code>)
      </p>
      {roles.length === 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          ⚠️ 먼저 위쪽 &quot;배역&quot; 섹션에서 배역을 추가해주세요.
        </p>
      )}
      <ul className="space-y-2">
        {value.map((c, i) => (
          <li key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
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
              <input
                type="text"
                value={c.photoFile ?? ''}
                onChange={e => update(i, { photoFile: e.target.value || undefined })}
                placeholder="kim.jpg"
                maxLength={120}
                className="input"
              />
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
    </div>
  );
}
