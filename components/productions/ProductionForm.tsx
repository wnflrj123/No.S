'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Production,
  ProductionFormData,
  ProductionPerformance,
  ProductionStaff,
  Musical,
  User,
  StaffRole,
  STAFF_ROLE_LABELS,
} from '@/types';
import { FiPlus, FiTrash2, FiCheck } from 'react-icons/fi';
import TimePicker from '@/components/common/TimePicker';

interface ProductionFormProps {
  musicals: Musical[];
  onSuccess: () => void;
  onCancel: () => void;
  editingProduction?: Production | null;
}

const STAFF_ROLES: StaffRole[] = ['DIRECTOR', 'MUSIC_DIRECTOR', 'CHOREOGRAPHER', 'STAGE_MANAGER'];

const emptyForm = (): ProductionFormData => ({
  name: '',
  description: '',
  musicalId: '',
  locations: [],
  staffs: [],
  performances: [],
  startDate: '',
  endDate: '',
});

function newPerformance(): ProductionPerformance {
  return {
    id: crypto.randomUUID(),
    dateTime: '',
    castings: [],
  };
}

export default function ProductionForm({
  musicals,
  onSuccess,
  onCancel,
  editingProduction,
}: ProductionFormProps) {
  const { user, effectiveName } = useAuth();
  const [form, setForm] = useState<ProductionFormData>(emptyForm());
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드 초기값
  useEffect(() => {
    if (editingProduction) {
      setForm({
        name: editingProduction.name,
        description: editingProduction.description ?? '',
        musicalId: editingProduction.musicalId,
        locations: editingProduction.locations ?? [],
        staffs: editingProduction.staffs,
        performances: editingProduction.performances,
        startDate: editingProduction.startDate,
        endDate: editingProduction.endDate,
      });
    } else {
      setForm(emptyForm());
    }
  }, [editingProduction]);

  // 사용자 목록 로드
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('displayName')));
      const list: User[] = snap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<User, 'uid'>),
      }));
      setUsers(list);
    };
    load();
  }, []);

  const selectedMusical = musicals.find((m) => m.id === form.musicalId);

  const getUserLabel = (uid: string) => {
    const u = users.find((u) => u.uid === uid);
    return u?.customName || u?.displayName || uid;
  };

  // ── 기본 정보 ──────────────────────────────────────────────
  const setField = <K extends keyof ProductionFormData>(key: K, val: ProductionFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  // ── 공연 장소 ──────────────────────────────────────────────
  const [locationInput, setLocationInput] = useState('');

  const addLocation = () => {
    const trimmed = locationInput.trim();
    if (!trimmed || form.locations.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, locations: [...prev.locations, trimmed] }));
    setLocationInput('');
  };

  const removeLocation = (loc: string) => {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) => l !== loc),
      // 해당 장소를 쓰던 공연 회차는 빈값으로 초기화
      performances: prev.performances.map((p) =>
        p.location === loc ? { ...p, location: '' } : p
      ),
    }));
  };

  // ── 스태프 ────────────────────────────────────────────────
  const addStaff = () => {
    setForm((prev) => ({
      ...prev,
      staffs: [...prev.staffs, { userId: '', role: 'DIRECTOR' }],
    }));
  };

  const updateStaff = (idx: number, patch: Partial<ProductionStaff>) => {
    setForm((prev) => {
      const staffs = [...prev.staffs];
      staffs[idx] = { ...staffs[idx], ...patch };
      return { ...prev, staffs };
    });
  };

  const removeStaff = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      staffs: prev.staffs.filter((_, i) => i !== idx),
    }));
  };

  // ── 공연 일정 ──────────────────────────────────────────────
  const addPerformance = () => {
    setForm((prev) => ({
      ...prev,
      performances: [...prev.performances, newPerformance()],
    }));
  };

  const removePerformance = (id: string) => {
    setForm((prev) => ({
      ...prev,
      performances: prev.performances.filter((p) => p.id !== id),
    }));
  };

  const updatePerformanceDate = (id: string, date: string) => {
    setForm((prev) => ({
      ...prev,
      performances: prev.performances.map((p) => {
        if (p.id !== id) return p;
        const time = p.dateTime.includes('T') ? p.dateTime.split('T')[1] : '';
        return { ...p, dateTime: date ? `${date}${time ? `T${time}` : ''}` : '' };
      }),
    }));
  };

  const updatePerformanceTime = (id: string, time: string) => {
    setForm((prev) => ({
      ...prev,
      performances: prev.performances.map((p) => {
        if (p.id !== id) return p;
        const date = p.dateTime.includes('T') ? p.dateTime.split('T')[0] : p.dateTime;
        return { ...p, dateTime: date ? `${date}T${time}` : '' };
      }),
    }));
  };

  const updatePerformanceLocation = (id: string, location: string) => {
    setForm((prev) => ({
      ...prev,
      performances: prev.performances.map((p) =>
        p.id === id ? { ...p, location } : p
      ),
    }));
  };

  const updateCasting = (perfId: string, characterId: number, userId: string) => {
    setForm((prev) => ({
      ...prev,
      performances: prev.performances.map((p) => {
        if (p.id !== perfId) return p;
        const castings = p.castings.filter((c) => c.characterId !== characterId);
        if (userId) castings.push({ characterId, userId });
        return { ...p, castings };
      }),
    }));
  };

  // ── 저장 ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('프로덕션 이름을 입력해주세요.');
    if (!form.musicalId) return setError('작품을 선택해주세요.');
    if (!form.startDate || !form.endDate) return setError('공연 기간을 입력해주세요.');
    if (form.startDate > form.endDate) return setError('시작일이 종료일보다 늦을 수 없어요.');

    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        musicalId: form.musicalId,
        locations: form.locations,
        staffs: form.staffs.filter((s) => s.userId),
        performances: form.performances.filter((p) => p.dateTime),
        startDate: form.startDate,
        endDate: form.endDate,
        updatedAt: serverTimestamp(),
      };

      if (editingProduction) {
        await updateDoc(doc(db, 'productions', editingProduction.id), payload);
      } else {
        await addDoc(collection(db, 'productions'), {
          ...payload,
          createdBy: user!.uid,
          createdByName: effectiveName,
          createdAt: serverTimestamp(),
        });
      }
      onSuccess();
    } catch (e) {
      console.error('저장 실패:', e);
      setError('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 space-y-6">
      {/* 타이틀 */}
      <div>
        <h2 className="text-base font-bold text-foreground">
          {editingProduction ? '프로덕션 수정' : '새 프로덕션 등록하기'}
        </h2>
      </div>

      {/* ── 섹션 1: 기본 정보 ── */}
      <section>
        <div className="space-y-4">
          {/* 작품 선택 */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
              작품 <span className="text-red-400">*</span>
            </label>
            <select
              value={form.musicalId}
              onChange={(e) => setField('musicalId', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              <option value="">작품을 선택하세요</option>
              {musicals.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* 프로덕션 이름 */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
              프로덕션 이름 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="예) 2025 정기공연"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
              설명 (선택)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="간단한 설명을 입력하세요"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* 공연 기간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
                연습시작일 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
                연습종료일 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 섹션 2: 공연 장소 ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: '#4e5968' }}>공연 장소</h3>
        </div>
        <div className="space-y-2">
          {/* 장소 추가 입력 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
              placeholder="장소명 입력 후 추가"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={addLocation}
              className="px-4 py-2.5 bg-secondary text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              style={{ color: '#4e5968' }}
            >
              추가
            </button>
          </div>
          {/* 등록된 장소 chips */}
          {form.locations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.locations.map((loc) => (
                <span
                  key={loc}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary rounded-lg text-sm"
                  style={{ color: '#4e5968' }}
                >
                  {loc}
                  <button
                    type="button"
                    onClick={() => removeLocation(loc)}
                    className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 섹션 3: 스태프 ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: '#4e5968' }}>스태프</h3>
          <button
            onClick={addStaff}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
          >
            <FiPlus size={12} />
            추가
          </button>
        </div>

        {form.staffs.length === 0 ? (
          <p className="text-xs text-gray-300 py-2">스태프를 추가해보세요</p>
        ) : (
          <div className="space-y-2">
            {form.staffs.map((staff, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {/* 역할 */}
                <select
                  value={staff.role}
                  onChange={(e) => updateStaff(idx, { role: e.target.value as StaffRole })}
                  className="flex-none w-28 px-2.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>
                  ))}
                </select>
                {/* 사용자 */}
                <select
                  value={staff.userId}
                  onChange={(e) => updateStaff(idx, { userId: e.target.value })}
                  className="flex-1 min-w-0 px-2.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                >
                  <option value="">사용자 선택</option>
                  {users.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.customName || u.displayName || u.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeStaff(idx)}
                  className="flex-none w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 섹션 3: 공연 일정 ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium" style={{ color: '#4e5968' }}>공연 일정</h3>
          <button
            onClick={addPerformance}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
          >
            <FiPlus size={12} />
            회차 추가
          </button>
        </div>

        {form.performances.length === 0 ? (
          <p className="text-xs text-gray-300 py-2">공연 회차를 추가해보세요</p>
        ) : (
          <div className="space-y-4">
            {form.performances.map((perf, idx) => {
              const chars = selectedMusical?.characters ?? [];
              const perfDate = perf.dateTime.includes('T') ? perf.dateTime.split('T')[0] : perf.dateTime;
              const perfTime = perf.dateTime.includes('T') ? perf.dateTime.split('T')[1] : '';
              return (
                <div key={perf.id} className="border border-gray-100 rounded-xl p-3">
                  {/* 회차 날짜/시간/장소 입력 */}
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-xs font-bold text-primary bg-primary/8 w-5 h-5 rounded-md flex items-center justify-center flex-none mt-2.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={perfDate}
                          onChange={(e) => updatePerformanceDate(perf.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        />
                        <TimePicker
                          value={perfTime}
                          onChange={(t) => updatePerformanceTime(perf.id, t)}
                          placeholder="시간 선택"
                          allowEmpty
                        />
                      </div>
                      {form.locations.length > 0 ? (
                        <select
                          value={perf.location ?? ''}
                          onChange={(e) => updatePerformanceLocation(perf.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        >
                          <option value="">장소 선택</option>
                          {form.locations.map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs px-1" style={{ color: '#b0b8c1' }}>
                          위에서 공연 장소를 먼저 추가해주세요
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removePerformance(perf.id)}
                      className="flex-none w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>

                  {/* 캐스팅 테이블 */}
                  {chars.length === 0 ? (
                    <p className="text-xs text-gray-300 pl-7">
                      {form.musicalId ? '작품에 캐릭터가 없어요' : '위에서 작품을 먼저 선택해주세요'}
                    </p>
                  ) : (
                    <div className="space-y-1.5 pl-7">
                      {chars.map((char) => {
                        const casting = perf.castings.find((c) => c.characterId === char.id);
                        return (
                          <div key={char.id} className="flex items-center gap-2">
                            <span className="flex-none w-24 text-xs text-gray-500 font-medium truncate">
                              {char.name}
                            </span>
                            <select
                              value={casting?.userId ?? ''}
                              onChange={(e) => updateCasting(perf.id, char.id, e.target.value)}
                              className="flex-1 min-w-0 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                            >
                              <option value="">미정</option>
                              {users.map((u) => (
                                <option key={u.uid} value={u.uid}>
                                  {getUserLabel(u.uid)}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 에러 */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* 버튼 */}
      <div className="pt-1 space-y-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98] text-[15px] disabled:opacity-50"
        >
          <FiCheck size={16} />
          {saving ? '저장 중...' : editingProduction ? '수정 완료' : '등록하기'}
        </button>
        <button
          onClick={onCancel}
          className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}
