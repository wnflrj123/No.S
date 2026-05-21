'use client';

import { FiPlus, FiTrash2 } from 'react-icons/fi';
import CastingEditor from './CastingEditor';
import type { CastingEntry, InviteRole } from '@/lib/invites/types';

export interface RoundFormValue {
  roundNo: number;
  startAtMs: number; // 시작 시각 (밀리초)
  teamName: string;
  casting: CastingEntry[];
}

interface Props {
  value: RoundFormValue[];
  onChange: (next: RoundFormValue[]) => void;
  roles: InviteRole[];
  inviteId: string;
}

export default function RoundEditor({ value, onChange, roles, inviteId }: Props) {
  const update = (index: number, patch: Partial<RoundFormValue>) => {
    onChange(value.map((r, i) => (i === index ? { ...r, ...patch } : r)));
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

          <div className="grid sm:grid-cols-3 gap-2">
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

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">{label}</span>
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
