'use client';

import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { InviteStaff, InviteStaffMember } from '@/lib/invites/types';

interface Props {
  value: InviteStaff[];
  onChange: (next: InviteStaff[]) => void;
  inviteId: string; // "2026-1" 등, 사진 경로 안내용
}

function newStaffId(): string {
  // 브라우저 crypto.randomUUID(). 의존성 추가 없이 안정적인 ID 생성.
  return crypto.randomUUID();
}

function emptyMember(): InviteStaffMember {
  return { name: '', photoFile: '' };
}

export default function StaffEditor({ value, onChange, inviteId }: Props) {
  const updateStaff = (index: number, patch: Partial<InviteStaff>) => {
    onChange(value.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeStaff = (index: number) => onChange(value.filter((_, i) => i !== index));

  const addStaff = () => {
    onChange([...value, { id: newStaffId(), role: '', members: [emptyMember()] }]);
  };

  const updateMember = (
    staffIndex: number,
    memberIndex: number,
    patch: Partial<InviteStaffMember>,
  ) => {
    const members = value[staffIndex].members.map((m, i) =>
      i === memberIndex ? { ...m, ...patch } : m,
    );
    updateStaff(staffIndex, { members });
  };

  const addMember = (staffIndex: number) => {
    updateStaff(staffIndex, { members: [...value[staffIndex].members, emptyMember()] });
  };

  const removeMember = (staffIndex: number, memberIndex: number) => {
    updateStaff(staffIndex, {
      members: value[staffIndex].members.filter((_, i) => i !== memberIndex),
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        연출·분장·강사 등 제작진을 직책별로 추가하세요. 사진은 선택이며,{' '}
        <code>/public/invites/{inviteId}/staff/</code> 폴더에 파일을 넣고 파일명만 입력합니다. (예:{' '}
        <code>lee.jpg</code>)
      </p>

      {value.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
          제작진이 없습니다. 아래 버튼을 눌러 추가하세요.
        </p>
      )}

      <ul className="space-y-3">
        {value.map((staff, si) => (
          <li key={staff.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={staff.role}
                onChange={e => updateStaff(si, { role: e.target.value })}
                placeholder="직책 (예: 연출)"
                maxLength={40}
                className="input flex-1"
                required
              />
              <button
                type="button"
                onClick={() => removeStaff(si)}
                className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                aria-label="직책 삭제"
              >
                <FiTrash2 />
              </button>
            </div>

            <ul className="space-y-2 pl-3 border-l-2 border-gray-200">
              {staff.members.map((member, mi) => (
                <li key={mi} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-start">
                  <input
                    type="text"
                    value={member.name}
                    onChange={e => updateMember(si, mi, { name: e.target.value })}
                    placeholder="이름 (예: 이경환)"
                    maxLength={40}
                    className="input"
                    required
                  />
                  <input
                    type="text"
                    value={member.photoFile ?? ''}
                    onChange={e => updateMember(si, mi, { photoFile: e.target.value })}
                    placeholder="사진 파일명 (선택)"
                    maxLength={100}
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(si, mi)}
                    disabled={staff.members.length <= 1}
                    className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 disabled:text-gray-300 disabled:hover:bg-transparent"
                    aria-label="멤버 삭제"
                  >
                    <FiTrash2 />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => addMember(si)}
              className="ml-3 text-sm text-[#0066B3] hover:underline flex items-center gap-1"
            >
              <FiPlus /> 이름 추가
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addStaff}
        className="w-full py-2 text-sm text-[#0066B3] border border-dashed border-[#0066B3]/40 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1"
      >
        <FiPlus /> 제작진 추가
      </button>
    </div>
  );
}
