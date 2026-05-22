'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { getAuth } from 'firebase/auth';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { InviteRegistration, InviteSupporter } from '@/lib/invites/types';
import { MAX_NAME_LENGTH } from '@/lib/invites/constants';

interface Props {
  registrations: InviteRegistration[];
  supporters?: InviteSupporter[];
  year: number;
  round: number;
  onSupporterAdded?: (supporter: InviteSupporter) => void;
  onSupporterDeleted?: (supporterId: string) => void;
}

interface SponsorRow {
  key: string;
  id: string;
  name: string;
  phone?: string;
  checkedAt: Date | null;
  source: 'registration' | 'wall';
}

export default function SponsorsTab({
  registrations,
  supporters = [],
  year,
  round,
  onSupporterAdded,
  onSupporterDeleted,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SponsorRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromRegs: SponsorRow[] = registrations
    .filter(r => r.isSponsor && (r.status ?? 'active') === 'active')
    .map(r => ({
      key: `r:${r.id}`,
      id: r.id,
      name: r.name,
      phone: r.phone,
      checkedAt: r.sponsorCheckedAt ? r.sponsorCheckedAt.toDate() : null,
      source: 'registration' as const,
    }));

  const fromSupporters: SponsorRow[] = supporters.map(s => ({
    key: `s:${s.id}`,
    id: s.id,
    name: s.name,
    checkedAt: s.createdAt?.toDate?.() ?? null,
    source: 'wall' as const,
  }));

  const all = [...fromRegs, ...fromSupporters].sort((a, b) => {
    const am = a.checkedAt?.getTime() ?? 0;
    const bm = b.checkedAt?.getTime() ?? 0;
    return bm - am;
  });

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    setError(null);
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) {
        setError('로그인 정보를 다시 확인해주세요.');
        return;
      }
      const res = await fetch(
        `/api/invites/${year}/${round}/supporter/${pendingDelete.id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${idToken}` } },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? '삭제에 실패했습니다.');
        return;
      }
      onSupporterDeleted?.(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs text-gray-500">
          신청자 후원자(파란색)와 현장 후원자(분홍색)가 함께 표시됩니다. 현장 후원자만 직접 추가·삭제 가능합니다.
        </p>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-500 text-white rounded-lg text-xs font-semibold hover:bg-pink-600"
        >
          <FiPlus /> 현장 후원자 추가
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {all.length === 0 ? (
        <p className="text-center text-gray-500 py-16 bg-gray-50 rounded-xl">
          아직 후원자가 없습니다.
        </p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {all.map(s => (
            <li
              key={s.key}
              className={`p-4 rounded-xl border ${
                s.source === 'wall'
                  ? 'bg-pink-50 border-pink-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-semibold ${
                      s.source === 'wall' ? 'text-pink-700' : 'text-[#0066B3]'
                    }`}
                  >
                    💛 {s.name}
                  </div>
                  {s.phone && <div className="text-sm text-gray-600 mt-0.5">{s.phone}</div>}
                  {s.checkedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {s.source === 'wall' ? '응원 시각' : '후원 체크'}: {format(s.checkedAt, 'M월 d일 HH:mm')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      s.source === 'wall'
                        ? 'bg-pink-200 text-pink-800'
                        : 'bg-blue-200 text-[#0066B3]'
                    }`}
                  >
                    {s.source === 'wall' ? '🌸 현장' : '신청자'}
                  </span>
                  {s.source === 'wall' && (
                    <button
                      type="button"
                      onClick={() => setPendingDelete(s)}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                      aria-label="삭제"
                      title="현장 후원자 삭제"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAddModal && (
        <AddSupporterModal
          year={year}
          round={round}
          onClose={() => setShowAddModal(false)}
          onAdded={s => {
            onSupporterAdded?.(s);
            setShowAddModal(false);
          }}
        />
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !busy && setPendingDelete(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h4 className="font-bold text-gray-900 text-center text-lg">현장 후원자를 삭제할까요?</h4>
            <p className="text-sm text-gray-600 text-center mt-2 leading-relaxed">
              <strong className="text-pink-600">{pendingDelete.name}</strong> 님의 현장 응원이<br />
              <strong className="text-red-600">완전히 삭제</strong>되며 wall에서도 사라집니다.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={busy}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={busy}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:bg-gray-300"
              >
                {busy ? '삭제 중…' : '네, 삭제할게요'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddSupporterModal({
  year,
  round,
  onClose,
  onAdded,
}: {
  year: number;
  round: number;
  onClose: () => void;
  onAdded: (s: InviteSupporter) => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`이름은 ${MAX_NAME_LENGTH}자 이내로 입력해주세요.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) {
        setError('로그인 정보를 다시 확인해주세요.');
        return;
      }
      const res = await fetch(`/api/invites/${year}/${round}/supporter`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? '추가에 실패했습니다.');
        return;
      }
      // 응답에는 createdAt이 없지만, onSnapshot 사용 안 하는 페이지에서는 직접 합성하여 전달.
      // 정확한 createdAt은 다음 새로고침 시 Firestore에서 가져옴.
      const fakeCreatedAt = {
        toDate: () => new Date(),
        toMillis: () => Date.now(),
      } as unknown as InviteSupporter['createdAt'];
      onAdded({
        id: data.id,
        inviteId: `${year}-${round}`,
        name: data.name,
        createdAt: fakeCreatedAt,
      });
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={() => !busy && onClose()}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-900">🌸 현장 후원자 추가</h4>
          <button onClick={onClose} className="text-gray-400 text-lg" aria-label="닫기">✕</button>
        </div>
        <p className="text-sm text-gray-600">
          공연장 현장에서 응원해주신 분의 이름을 입력하면 wall과 후원자 목록에 즉시 추가됩니다.
        </p>
        <label className="block mt-3">
          <span className="text-sm font-medium text-gray-700">이름</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            placeholder="예: 김응원"
            className="input mt-1"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
        </label>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy}
            className="flex-1 py-2.5 bg-pink-500 text-white rounded-lg text-sm font-semibold hover:bg-pink-600 disabled:bg-gray-300"
          >
            {busy ? '추가 중…' : '추가하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
