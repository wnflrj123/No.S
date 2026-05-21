'use client';

import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { InviteRole } from '@/lib/invites/types';

interface Props {
  value: InviteRole[];
  onChange: (next: InviteRole[]) => void;
}

function newRoleId(): string {
  // 브라우저 crypto.randomUUID(). 의존성 추가 없이 안정적인 ID 생성.
  return crypto.randomUUID();
}

export default function RolesEditor({ value, onChange }: Props) {
  const update = (index: number, patch: Partial<InviteRole>) => {
    onChange(value.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  const add = () => {
    const maxOrder = value.reduce((m, r) => Math.max(m, r.order ?? 0), 0);
    onChange([
      ...value,
      { id: newRoleId(), name: '', description: '', order: maxOrder + 1 },
    ]);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        모든 회차에 공통으로 사용되는 배역 목록입니다. 회차별로 다르게 바뀌는 건 배우와 사진만이에요.
      </p>
      {value.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
          배역이 없습니다. 아래 버튼을 눌러 추가하세요.
        </p>
      )}
      <ul className="space-y-2">
        {value.map((r, i) => (
          <li key={r.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-2 items-start">
              <input
                type="text"
                value={r.name}
                onChange={e => update(i, { name: e.target.value })}
                placeholder="배역 (예: 장발장)"
                maxLength={40}
                className="input"
                required
              />
              <input
                type="text"
                value={r.description}
                onChange={e => update(i, { description: e.target.value })}
                placeholder="배역 설명"
                maxLength={200}
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
        className="w-full py-2 text-sm text-[#0066B3] border border-dashed border-[#0066B3]/40 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1"
      >
        <FiPlus /> 배역 추가
      </button>
    </div>
  );
}
