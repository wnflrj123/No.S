'use client';

import { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { LocationType, ScheduledActivity, ScheduledActivityFormData } from '@/types';
import type { EditScope } from '@/components/schedules/ScheduleList';
import { addDays, format, parse, getDay } from 'date-fns';
import { FiRepeat, FiLink, FiClock } from 'react-icons/fi';
import TimePicker from '@/components/common/TimePicker';

const LOCATIONS: LocationType[] = ['합동연습실', 'ART8실', '댄스3실', '기타'];

const WEEKDAYS = [
  { value: 0, label: '일' },
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
];

type RepeatEndType = 'none' | 'date';

interface ScheduleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingSchedule?: ScheduledActivity | null;
  editScope?: EditScope;
  defaultDate?: string;
}

export default function ScheduleForm({
  onSuccess,
  onCancel,
  editingSchedule,
  editScope,
  defaultDate,
}: ScheduleFormProps) {
  const { user, isAdmin, effectiveName } = useAuth();
  const isEditing = !!editingSchedule;

  const [formData, setFormData] = useState<ScheduledActivityFormData>({
    title: editingSchedule?.title || '',
    date: editingSchedule?.date || defaultDate || new Date().toISOString().split('T')[0],
    startTime: editingSchedule?.startTime || '18:00',
    endTime: editingSchedule?.endTime || '21:00',
    location: editingSchedule?.location || '합동연습실',
    customLocation: editingSchedule?.customLocation || '',
    locationUrl: editingSchedule?.locationUrl || '',
    description: editingSchedule?.description || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [changeEndDate, setChangeEndDate] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [isRepeat, setIsRepeat] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    const startDate = parse(
      editingSchedule?.date || defaultDate || new Date().toISOString().split('T')[0],
      'yyyy-MM-dd',
      new Date()
    );
    return [getDay(startDate)];
  });
  const [repeatEndType, setRepeatEndType] = useState<RepeatEndType>('date');
  const [repeatEndDate, setRepeatEndDate] = useState(() => {
    const startDate = parse(
      editingSchedule?.date || defaultDate || new Date().toISOString().split('T')[0],
      'yyyy-MM-dd',
      new Date()
    );
    return format(addDays(startDate, 56), 'yyyy-MM-dd');
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);

    if (name === 'date') {
      const newDate = parse(value, 'yyyy-MM-dd', new Date());
      setSelectedDays([getDay(newDate)]);
    }
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('일정 제목을 입력해주세요');
      return false;
    }
    if (!formData.date) {
      setError('날짜를 선택해주세요');
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      setError('시작 시간과 종료 시간을 입력해주세요');
      return false;
    }
    if (formData.startTime >= formData.endTime) {
      setError('종료 시간은 시작 시간보다 늦어야 해요');
      return false;
    }
    if (formData.location === '기타' && !formData.customLocation?.trim()) {
      setError('장소를 직접 입력해주세요');
      return false;
    }
    if (isRepeat && selectedDays.length === 0) {
      setError('반복할 요일을 선택해주세요');
      return false;
    }
    if (isRepeat && repeatEndType === 'date' && !repeatEndDate) {
      setError('반복 종료일을 선택해주세요');
      return false;
    }
    return true;
  };

  const generateRepeatDates = (): string[] => {
    const startDate = parse(formData.date, 'yyyy-MM-dd', new Date());
    const dates: string[] = [];
    const maxDays = 365;
    const endDate = repeatEndType === 'date'
      ? parse(repeatEndDate, 'yyyy-MM-dd', new Date())
      : addDays(startDate, maxDays);

    let currentDate = startDate;
    while (currentDate <= endDate && dates.length < 100) {
      const dayOfWeek = getDay(currentDate);
      if (selectedDays.includes(dayOfWeek)) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
      }
      currentDate = addDays(currentDate, 1);
    }

    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isAdmin) {
      setError('운영진만 정기 일정을 등록할 수 있어요');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const baseData = {
        title: formData.title.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        ...(formData.location === '기타' && { customLocation: formData.customLocation?.trim() }),
        ...(formData.location === '기타' && formData.locationUrl?.trim() && { locationUrl: formData.locationUrl.trim() }),
        ...(formData.description?.trim() && { description: formData.description.trim() }),
        updatedAt: Timestamp.now(),
      };

      if (isEditing && editingSchedule) {
        if (editScope === 'single' || !editScope || !editingSchedule.repeatGroupId) {
          // 이 일정만 수정
          await updateDoc(doc(db, 'schedules', editingSchedule.id), {
            ...baseData,
            date: formData.date,
          });
        } else {
          // 날짜는 변경하지 않고 내용만 일괄 수정 (future / all)
          const q = query(
            collection(db, 'schedules'),
            where('repeatGroupId', '==', editingSchedule.repeatGroupId)
          );
          const snapshot = await getDocs(q);

          const targets = editScope === 'future'
            ? snapshot.docs.filter((docSnap) => docSnap.data().date >= editingSchedule.date)
            : snapshot.docs;

          // 종료일 변경 처리
          if (changeEndDate && newEndDate) {
            const toUpdate = targets.filter((docSnap) => docSnap.data().date <= newEndDate);
            const toDelete = targets.filter((docSnap) => docSnap.data().date > newEndDate);

            // 기존 일정 내용 업데이트
            const updatePromises = toUpdate.map((docSnap) =>
              updateDoc(doc(db, 'schedules', docSnap.id), baseData)
            );

            // 종료일 이후 일정 삭제
            const deletePromises = toDelete.map((docSnap) =>
              deleteDoc(doc(db, 'schedules', docSnap.id))
            );

            // 종료일까지 부족한 일정 추가 (기존 요일 패턴 기반)
            const existingDates = new Set(targets.map((docSnap) => docSnap.data().date as string));
            const existingWeekdays = new Set(
              targets.map((docSnap) => getDay(parse(docSnap.data().date as string, 'yyyy-MM-dd', new Date())))
            );

            const maxExistingDate = targets
              .map((docSnap) => docSnap.data().date as string)
              .filter((d) => d <= newEndDate)
              .sort()
              .pop();

            const addPromises: Promise<unknown>[] = [];
            if (maxExistingDate && maxExistingDate < newEndDate) {
              let cursor = addDays(parse(maxExistingDate, 'yyyy-MM-dd', new Date()), 1);
              const endDateParsed = parse(newEndDate, 'yyyy-MM-dd', new Date());

              while (cursor <= endDateParsed && addPromises.length < 100) {
                const dateStr = format(cursor, 'yyyy-MM-dd');
                if (existingWeekdays.has(getDay(cursor)) && !existingDates.has(dateStr)) {
                  addPromises.push(
                    addDoc(collection(db, 'schedules'), {
                      ...baseData,
                      date: dateStr,
                      repeatGroupId: editingSchedule.repeatGroupId,
                      createdBy: editingSchedule.createdBy,
                      createdByName: editingSchedule.createdByName,
                      createdAt: Timestamp.now(),
                    })
                  );
                }
                cursor = addDays(cursor, 1);
              }
            }

            await Promise.all([...updatePromises, ...deletePromises, ...addPromises]);
          } else {
            const promises = targets.map((docSnap) =>
              updateDoc(doc(db, 'schedules', docSnap.id), baseData)
            );
            await Promise.all(promises);
          }
        }
      } else if (isRepeat) {
        const dates = generateRepeatDates();
        const repeatGroupId = `repeat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const promises = dates.map((date) =>
          addDoc(collection(db, 'schedules'), {
            ...baseData,
            date,
            repeatGroupId,
            createdBy: user.uid,
            createdByName: effectiveName,
            createdAt: Timestamp.now(),
          })
        );

        await Promise.all(promises);
      } else {
        await addDoc(collection(db, 'schedules'), {
          ...baseData,
          date: formData.date,
          createdBy: user.uid,
          createdByName: effectiveName,
          createdAt: Timestamp.now(),
        });
      }

      onSuccess?.();
    } catch (err) {
      console.error('정기 일정 저장 실패:', err);
      setError('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEstimatedCount = () => {
    if (!isRepeat) return 1;
    return generateRepeatDates().length;
  };

  const estimatedCount = isRepeat ? getEstimatedCount() : 1;

  if (!isAdmin) {
    return (
      <div className="bg-[#4eaea9]/8 rounded-2xl p-6 text-center">
        <p className="text-[#4eaea9] text-sm font-medium">운영진만 정기 일정을 등록할 수 있어요</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 border-l-[3px] border-l-[#4eaea9]">
      <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
        <FiClock className="text-[#4eaea9]" size={18} />
        {isEditing
          ? editScope === 'all' ? '모든 반복 일정 수정하기'
            : editScope === 'future' ? '이후 반복 일정 수정하기'
            : '정기 일정 수정하기'
          : '새 정기 일정 등록하기'}
      </h2>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
            일정 제목 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="예: 아카데미, 정극 연습 등"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4eaea9] focus:border-transparent text-sm"
            required
          />
        </div>

        {/* Date - 일괄 수정 시에는 날짜 변경 불가 (각 일정의 날짜 유지) */}
        {!(isEditing && editScope && editScope !== 'single' && editingSchedule?.repeatGroupId) && (
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
              {isRepeat ? '시작 날짜' : '날짜'} <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4eaea9] focus:border-transparent text-sm bg-white"
              required
            />
          </div>
        )}
        {isEditing && editScope && editScope !== 'single' && editingSchedule?.repeatGroupId && (
          <div className="space-y-3">
            <div className="bg-[#4eaea9]/8 rounded-xl p-3">
              <p className="text-sm text-[#4eaea9] font-medium">
                {editScope === 'all' ? '모든 반복 일정' : '이 날짜 이후 반복 일정'}의 내용을 일괄 수정해요
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#8b95a1' }}>
                각 일정의 날짜는 변경되지 않아요
              </p>
            </div>
            <div className="bg-secondary rounded-xl p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={changeEndDate}
                  onChange={(e) => setChangeEndDate(e.target.checked)}
                  className="w-4 h-4 text-[#4eaea9] rounded focus:ring-[#4eaea9]"
                />
                <span className="text-sm font-medium" style={{ color: '#4e5968' }}>
                  종료일 변경
                </span>
              </label>
              {changeEndDate && (
                <div className="mt-3">
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4eaea9] focus:border-transparent bg-white"
                  />
                  <p className="text-[11px] mt-1" style={{ color: '#8b95a1' }}>
                    종료일 이후의 일정은 삭제되고, 종료일까지 부족한 일정은 자동으로 추가돼요
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Repeat Settings */}
        {!isEditing && (
          <div className="bg-secondary rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="isRepeatSchedule"
                checked={isRepeat}
                onChange={(e) => setIsRepeat(e.target.checked)}
                className="w-4 h-4 text-[#4eaea9] rounded focus:ring-[#4eaea9]"
              />
              <label htmlFor="isRepeatSchedule" className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: '#4e5968' }}>
                <FiRepeat className="text-[#4eaea9]" size={14} />
                반복 일정으로 등록
              </label>
            </div>

            {isRepeat && (
              <div className="space-y-4 mt-3 pt-3 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#8b95a1' }}>
                    반복 요일
                  </label>
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                          selectedDays.includes(day.value)
                            ? 'bg-[#4eaea9] text-white'
                            : 'bg-white border border-gray-200 hover:border-[#4eaea9]'
                        }`}
                        style={{
                          color: selectedDays.includes(day.value) ? undefined :
                            day.value === 0 ? '#f87171' : day.value === 6 ? '#60a5fa' : '#4e5968'
                        }}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#8b95a1' }}>
                    반복 종료
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repeatEndTypeSchedule"
                        value="date"
                        checked={repeatEndType === 'date'}
                        onChange={() => setRepeatEndType('date')}
                        className="text-[#4eaea9] focus:ring-[#4eaea9]"
                      />
                      <span className="text-sm" style={{ color: '#4e5968' }}>종료일 지정</span>
                    </label>
                    {repeatEndType === 'date' && (
                      <input
                        type="date"
                        value={repeatEndDate}
                        onChange={(e) => setRepeatEndDate(e.target.value)}
                        min={formData.date}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4eaea9] focus:border-transparent"
                      />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repeatEndTypeSchedule"
                        value="none"
                        checked={repeatEndType === 'none'}
                        onChange={() => setRepeatEndType('none')}
                        className="text-[#4eaea9] focus:ring-[#4eaea9]"
                      />
                      <span className="text-sm" style={{ color: '#4e5968' }}>종료 없음 (최대 1년)</span>
                    </label>
                  </div>
                </div>

                <div className="bg-[#4eaea9]/8 rounded-xl p-3">
                  <p className="text-sm text-[#4eaea9] font-medium">
                    총 {estimatedCount}건의 일정이 등록돼요
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#8b95a1' }}>
                    {selectedDays.map((d) => WEEKDAYS.find((w) => w.value === d)?.label).join(', ')}요일마다 반복
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
              시작 시간 <span className="text-red-400">*</span>
            </label>
            <TimePicker
              value={formData.startTime}
              onChange={(time) => setFormData((prev) => ({ ...prev, startTime: time }))}
              placeholder="시작 시간"
              required
              accentColor="green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
              종료 시간 <span className="text-red-400">*</span>
            </label>
            <TimePicker
              value={formData.endTime}
              onChange={(time) => setFormData((prev) => ({ ...prev, endTime: time }))}
              placeholder="종료 시간"
              required
              accentColor="green"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
            장소 <span className="text-red-400">*</span>
          </label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4eaea9] focus:border-transparent text-sm bg-white"
            required
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {formData.location === '기타' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
                장소 직접 입력 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="customLocation"
                value={formData.customLocation}
                onChange={handleChange}
                placeholder="장소명을 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4eaea9] focus:border-transparent text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
                <FiLink className="inline-block mr-1" size={13} />
                지도 링크
              </label>
              <input
                type="url"
                name="locationUrl"
                value={formData.locationUrl}
                onChange={handleChange}
                placeholder="네이버지도, 카카오맵 등의 링크를 붙여넣으세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4eaea9] focus:border-transparent text-sm"
              />
              <p className="text-[11px] mt-1" style={{ color: '#8b95a1' }}>지도 앱에서 공유 링크를 복사해 붙여넣으면 돼요</p>
            </div>
          </>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
            설명
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="일정에 대한 설명을 입력하세요"
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4eaea9] focus:border-transparent resize-none text-sm"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 bg-[#4eaea9] text-white font-semibold rounded-xl hover:bg-[#3D9490] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting
            ? '저장하고 있어요...'
            : isEditing
            ? '수정하기'
            : isRepeat
            ? `${estimatedCount}건 등록하기`
            : '등록하기'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 bg-secondary text-foreground font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
