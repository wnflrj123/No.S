'use client';

import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { CastingEntry } from '@/lib/invites/types';

interface Props {
  value: CastingEntry[];
  onChange: (next: CastingEntry[]) => void;
  inviteId: string; // "2026-1" 등, 사진 경로 안내용
}

export default function CastingEditor({ value, onChange, inviteId }: Props) {
  const update = (index: number, patch: Partial<CastingEntry>) => {
    onChange(value.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => onChange([...value, { role: '', description: '', photoFile: '' }]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        사진은 <code>/public/invites/{inviteId}/cast/</code> 폴더에 파일을 추가한 후 파일명만 입력하세요. (예: <code>kim.jpg</code>)
      </p>
      <ul className="space-y-2">
        {value.map((c, i) => (
          <li key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid sm:grid-cols-[1fr_2fr_1fr_auto] gap-2 items-start">
              <input
                type="text"
                value={c.role}
                onChange={e => update(i, { role: e.target.value })}
                placeholder="배역"
                maxLength={40}
                className="input"
                required
              />
              <input
                type="text"
                value={c.description}
                onChange={e => update(i, { description: e.target.value })}
                placeholder="배역 설명"
                maxLength={200}
                className="input"
              />
              <input
                type="text"
                value={c.photoFile ?? ''}
                onChange={e => update(i, { photoFile: e.target.value || undefined })}
                placeholder="kim.jpg"
                maxLength={80}
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
        <FiPlus /> 캐스팅 추가
      </button>
    </div>
  );
}
