'use client';

import { useState } from 'react';
import { FiMenu, FiPlus, FiTrash2 } from 'react-icons/fi';
import type { InviteStaff, InviteStaffMember } from '@/lib/invites/types';
import usePhotoFiles from './usePhotoFiles';

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
  // photoFile은 선택 필드 — 빈 문자열 대신 생략한다. 사진 입력칸은 value={photoFile ?? ''}로 렌더.
  return { name: '' };
}

export default function StaffEditor({ value, onChange, inviteId }: Props) {
  const photoFiles = usePhotoFiles(inviteId, 'staff');
  const datalistId = `staff-files-${inviteId}`;

  // 드래그로 순서를 바꾸는 동안의 출발/도착 인덱스
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // patch에 없는 필드(id·role·members)는 spread로 보존된다.
  const updateStaff = (index: number, patch: Partial<InviteStaff>) => {
    onChange(value.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeStaff = (index: number) => onChange(value.filter((_, i) => i !== index));

  const addStaff = () => {
    onChange([...value, { id: newStaffId(), role: '', members: [emptyMember()] }]);
  };

  // 직책 순서 변경: from 위치의 항목을 빼서 to 위치에 끼워넣는다.
  const moveStaff = (from: number, to: number) => {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const endDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
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
        <code>/public/invites/{inviteId}/staff/</code> 폴더에 파일을 넣은 뒤 입력칸에서 선택하면 됩니다. (직접 입력도 가능)
        <br />
        직책 카드 왼쪽 손잡이를 드래그하면 순서를 바꿀 수 있어요.
      </p>

      {value.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
          제작진이 없습니다. 아래 버튼을 눌러 추가하세요.
        </p>
      )}

      <ul className="space-y-3">
        {value.map((staff, si) => (
          <li
            key={staff.id}
            onDragOver={e => {
              if (dragIndex === null) return;
              e.preventDefault();
              if (overIndex !== si) setOverIndex(si);
            }}
            onDrop={e => {
              e.preventDefault();
              if (dragIndex !== null) moveStaff(dragIndex, si);
              endDrag();
            }}
            className={`rounded-lg border bg-gray-50 p-3 space-y-2 transition-colors ${
              dragIndex === si ? 'opacity-40 ' : ''
            }${
              overIndex === si && dragIndex !== null && dragIndex !== si
                ? 'border-[#0066B3] ring-2 ring-[#0066B3]/30'
                : 'border-gray-200'
            }`}
          >
            <div className="flex gap-2 items-center">
              <button
                type="button"
                draggable
                onDragStart={e => {
                  setDragIndex(si);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', String(si));
                  const li = e.currentTarget.closest('li');
                  if (li) e.dataTransfer.setDragImage(li, 16, 16);
                }}
                onDragEnd={endDrag}
                className="shrink-0 cursor-grab px-1.5 py-2 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
                aria-label="드래그해서 직책 순서 변경"
                title="드래그해서 순서 변경"
              >
                <FiMenu />
              </button>
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
                    list={datalistId}
                    value={member.photoFile ?? ''}
                    onChange={e => updateMember(si, mi, { photoFile: e.target.value })}
                    placeholder="사진 파일 선택 (선택)"
                    maxLength={100}
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(si, mi)}
                    disabled={staff.members.length <= 1}
                    className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
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
      <datalist id={datalistId}>
        {photoFiles.map(f => (
          <option key={f} value={f} />
        ))}
      </datalist>
    </div>
  );
}
