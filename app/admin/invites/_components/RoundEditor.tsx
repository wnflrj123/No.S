'use client';

import { FiPlus, FiTrash2 } from 'react-icons/fi';
import CastingEditor from './CastingEditor';
import type { CastingEntry, InviteRole } from '@/lib/invites/types';

export interface RoundFormValue {
  roundNo: number;
  startAtMs: number; // 시작 시각 (밀리초)
  teamName: string;
  casting: CastingEntry[];
  /** 회차 신청 가능 좌석 수. 미입력(undefined) 시 잔여석 안내 비표시. */
  seatCapacity?: number;
}

interface Props {
  value: RoundFormValue[];
  onChange: (next: RoundFormValue[]) => void;
  roles: InviteRole[];
  inviteId: string;
}

export default function RoundEditor({ value, onChange, roles, inviteId }: Props) {
  const update = (index: number, patch: Partial<RoundFormValue>) => {
    const next = value.map((r, i) => (i === index ? { ...r, ...patch } : r));

    // 팀명이 변경되었고 현재 회차의 캐스팅이 비어있을 때만,
    // 동일 팀명을 가진 다른 회차에서 캐스팅을 자동 복사한다.
    // (이미 캐스팅 입력 중인 경우 덮어쓰지 않음)
    if (patch.teamName !== undefined) {
      const current = next[index];
      const newTeam = current.teamName.trim();
      if (newTeam && current.casting.length === 0) {
        const sibling = next.find((r, i) => i !== index && r.teamName.trim() === newTeam);
        if (sibling && sibling.casting.length > 0) {
          next[index] = {
            ...current,
            casting: sibling.casting.map(c => ({ ...c })),
          };
        }
      }
    }

    onChange(next);
  };
  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));
  const add = () => {
    const maxRoundNo = value.reduce((m, r) => Math.max(m, r.roundNo), 0);
    onChange([
      ...value,
      {
        roundNo: maxRoundNo + 1,
        startAtMs: Date.now() + 24 * 60 * 60 * 1000,
        teamName: '',
        casting: [],
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        💡 회차 추가 후 <strong>이전 회차와 같은 팀명</strong>을 입력하면 그 회차의 캐스팅이 자동으로 복사됩니다.
      </p>
      {value.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
          회차가 없습니다. 아래 버튼을 눌러 추가하세요.
        </p>
      )}
      {value.map((r, i) => (
        <div key={i} className="p-4 bg-white border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">{i + 1}번째 회차</div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-sm text-red-500 hover:bg-red-50 px-2 py-1 rounded flex items-center gap-1"
            >
              <FiTrash2 /> 삭제
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <FieldRow label="회차 번호">
              <input
                type="number"
                value={r.roundNo}
                onChange={e => update(i, { roundNo: Number(e.target.value) })}
                min={1}
                max={99}
                className="input"
                required
              />
            </FieldRow>
            <FieldRow label="팀명">
              <input
                type="text"
                value={r.teamName}
                onChange={e => update(i, { teamName: e.target.value })}
                placeholder="블루팀"
                maxLength={20}
                className="input"
                required
              />
            </FieldRow>
            <FieldRow label="시작 시각">
              <input
                type="datetime-local"
                value={msToDatetimeLocal(r.startAtMs)}
                onChange={e => update(i, { startAtMs: datetimeLocalToMs(e.target.value) })}
                className="input"
                required
              />
            </FieldRow>
            <FieldRow label="좌석 수" hint="비워두면 잔여석 안내 없음">
              <input
                type="number"
                value={r.seatCapacity ?? ''}
                onChange={e => {
                  const v = e.target.value;
                  update(i, { seatCapacity: v === '' ? undefined : Math.max(0, Number(v)) });
                }}
                min={0}
                max={9999}
                placeholder="예: 60"
                className="input"
              />
            </FieldRow>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">캐스팅 (배역별 배우·사진)</p>
            <CastingEditor
              value={r.casting}
              onChange={next => update(i, { casting: next })}
              roles={roles}
              inviteId={inviteId}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full py-3 text-sm text-[#0066B3] border border-dashed border-[#0066B3]/40 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1"
      >
        <FiPlus /> 회차 추가
      </button>
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {hint && <span className="text-[10px] text-gray-400 ml-1">({hint})</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}

// datetime-local 입력값은 로컬 타임존 기준. ms 단위 timestamp로 변환.
function msToDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToMs(s: string): number {
  if (!s) return 0;
  const ms = new Date(s).getTime();
  return Number.isFinite(ms) ? ms : 0;
}
