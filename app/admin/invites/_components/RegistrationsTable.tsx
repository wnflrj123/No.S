'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { getAuth } from 'firebase/auth';
import { FiTrash2 } from 'react-icons/fi';
import type { InviteRegistration } from '@/lib/invites/types';

interface Props {
  registrations: InviteRegistration[];
  year: number;
  round: number;
  onDeleted?: (regId: string) => void;
  onSponsorChanged?: (regId: string, isSponsor: boolean) => void;
}

export default function RegistrationsTable({
  registrations,
  year,
  round,
  onDeleted,
  onSponsorChanged,
}: Props) {
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<InviteRegistration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggleSponsor = async (reg: InviteRegistration) => {
    const next = !reg.isSponsor;
    setError(null);
    setTogglingId(reg.id);
    // 낙관적 업데이트 — 부모 콜백으로 즉시 반영
    onSponsorChanged?.(reg.id, next);
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) {
        setError('로그인 정보를 다시 확인해주세요.');
        onSponsorChanged?.(reg.id, !next); // 롤백
        return;
      }
      const res = await fetch(
        `/api/invites/${year}/${round}/registrations/${reg.id}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ isSponsor: next }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? '변경에 실패했습니다.');
        onSponsorChanged?.(reg.id, !next); // 롤백
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.');
      onSponsorChanged?.(reg.id, !next); // 롤백
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return registrations;
    return registrations.filter(
      r => r.name.toLowerCase().includes(q) || r.phone.includes(q),
    );
  }, [registrations, search]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) {
        setError('로그인 정보를 다시 확인해주세요.');
        setDeleting(false);
        return;
      }
      const res = await fetch(
        `/api/invites/${year}/${round}/registrations/${pendingDelete.id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${idToken}` } },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? '삭제에 실패했습니다.');
        return;
      }
      onDeleted?.(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  if (registrations.length === 0) {
    return (
      <p className="text-center text-gray-500 py-16 bg-gray-50 rounded-xl">아직 신청자가 없습니다.</p>
    );
  }

  return (
    <div>
      <input
        type="search"
        placeholder="이름·휴대폰 검색"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-3 w-full sm:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">상태</th>
              <th className="px-3 py-2 font-medium">이름</th>
              <th className="px-3 py-2 font-medium">휴대폰</th>
              <th className="px-3 py-2 font-medium">회차+인원</th>
              <th className="px-3 py-2 font-medium">총 인원</th>
              <th className="px-3 py-2 font-medium">후원</th>
              <th className="px-3 py-2 font-medium">신청일시</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const totalHc = r.roundSelections.reduce((s, x) => s + x.headcount, 0);
              const createdAt = r.createdAt.toDate();
              const status = r.status ?? 'active';
              const superseded = status === 'superseded';
              return (
                <tr
                  key={r.id}
                  className={`border-t border-gray-100 ${superseded ? 'bg-gray-50 text-gray-400' : ''}`}
                >
                  <td className="px-3 py-2">
                    {superseded ? (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">취소됨</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-[#0066B3] rounded-full">활성</span>
                    )}
                  </td>
                  <td className={`px-3 py-2 font-medium ${superseded ? 'line-through' : 'text-gray-900'}`}>{r.name}</td>
                  <td className={superseded ? 'px-3 py-2' : 'px-3 py-2 text-gray-700'}>{r.phone}</td>
                  <td className={superseded ? 'px-3 py-2' : 'px-3 py-2 text-gray-700'}>
                    {r.roundSelections.map(s => `${s.roundNo}회(${s.headcount})`).join(', ')}
                  </td>
                  <td className={superseded ? 'px-3 py-2' : 'px-3 py-2 text-gray-700'}>{totalHc}명</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSponsor(r)}
                      disabled={togglingId === r.id}
                      title={r.isSponsor ? '후원 해제' : '후원 표시'}
                      className={`text-xs px-2 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
                        r.isSponsor
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {r.isSponsor ? '💛 후원' : '미후원'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {format(createdAt, 'M/d HH:mm')}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setPendingDelete(r)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      aria-label="삭제"
                      title="삭제"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-8">검색 결과가 없습니다.</p>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h4 className="font-bold text-gray-900 text-center text-lg">정말 삭제할까요?</h4>
            <p className="text-sm text-gray-600 text-center mt-2 leading-relaxed">
              <strong>{pendingDelete.name}</strong>({pendingDelete.phone})님의 신청 내역이<br />
              <strong className="text-red-600">완전히 삭제</strong>되며 되돌릴 수 없습니다.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:bg-gray-300"
              >
                {deleting ? '삭제 중…' : '네, 삭제할게요'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
