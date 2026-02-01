'use client';

/**
 * 예약 정보 등록/수정 폼 컴포넌트
 */

import { useState } from 'react';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { LocationType, Reservation, ReservationFormData } from '@/types';
import { addDays, format, parse, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FiRepeat } from 'react-icons/fi';
import TimePicker from '@/components/common/TimePicker';

const LOCATIONS: LocationType[] = ['합동연습실', 'ART8실', '댄스3실', '기타'];

// 요일 정보 (일요일 = 0, 월요일 = 1, ...)
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

interface ReservationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingReservation?: Reservation | null;
  defaultDate?: string; // yyyy-MM-dd 형식
}

export default function ReservationForm({
  onSuccess,
  onCancel,
  editingReservation,
  defaultDate,
}: ReservationFormProps) {
  const { user } = useAuth();
  const isEditing = !!editingReservation;

  const [formData, setFormData] = useState<ReservationFormData>({
    date: editingReservation?.date || defaultDate || new Date().toISOString().split('T')[0],
    startTime: editingReservation?.startTime || '18:00',
    endTime: editingReservation?.endTime || '21:00',
    location: editingReservation?.location || '합동연습실',
    customLocation: editingReservation?.customLocation || '',
    purpose: editingReservation?.purpose || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 반복 일정 설정
  const [isRepeat, setIsRepeat] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    // 기본값: 시작 날짜의 요일
    const startDate = parse(
      editingReservation?.date || defaultDate || new Date().toISOString().split('T')[0],
      'yyyy-MM-dd',
      new Date()
    );
    return [getDay(startDate)];
  });
  const [repeatEndType, setRepeatEndType] = useState<RepeatEndType>('date');
  const [repeatEndDate, setRepeatEndDate] = useState(() => {
    // 기본값: 시작일로부터 8주 후
    const startDate = parse(
      editingReservation?.date || defaultDate || new Date().toISOString().split('T')[0],
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

    // 날짜 변경 시 선택된 요일 업데이트
    if (name === 'date') {
      const newDate = parse(value, 'yyyy-MM-dd', new Date());
      setSelectedDays([getDay(newDate)]);
    }
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        // 최소 1개는 선택되어야 함
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const validateForm = (): boolean => {
    if (!formData.date) {
      setError('날짜를 선택해주세요');
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      setError('시작 시간과 종료 시간을 입력해주세요');
      return false;
    }
    if (formData.startTime >= formData.endTime) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다');
      return false;
    }
    if (formData.location === '기타' && !formData.customLocation?.trim()) {
      setError('장소를 직접 입력해주세요');
      return false;
    }
    if (!formData.purpose.trim()) {
      setError('사용 목적을 입력해주세요');
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

  // 반복 일정의 날짜들 생성
  const generateRepeatDates = (): string[] => {
    const startDate = parse(formData.date, 'yyyy-MM-dd', new Date());
    const dates: string[] = [];
    const maxDays = repeatEndType === 'none' ? 365 : 365; // 최대 1년
    const endDate = repeatEndType === 'date'
      ? parse(repeatEndDate, 'yyyy-MM-dd', new Date())
      : addDays(startDate, maxDays);

    let currentDate = startDate;
    while (currentDate <= endDate && dates.length < 100) { // 최대 100개 제한
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

    if (!user) {
      setError('로그인이 필요합니다');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const baseReservationData = {
        userId: user.uid,
        userName: user.displayName || '익명',
        userEmail: user.email || '',
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        ...(formData.location === '기타' && { customLocation: formData.customLocation }),
        purpose: formData.purpose.trim(),
        updatedAt: Timestamp.now(),
      };

      if (isEditing && editingReservation) {
        // 수정
        await updateDoc(doc(db, 'reservations', editingReservation.id), {
          ...baseReservationData,
          date: formData.date,
        });
      } else if (isRepeat) {
        // 반복 일정 생성
        const dates = generateRepeatDates();
        const repeatGroupId = `repeat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 모든 날짜에 대해 예약 생성
        const promises = dates.map((date) =>
          addDoc(collection(db, 'reservations'), {
            ...baseReservationData,
            date,
            repeatGroupId,
            createdAt: Timestamp.now(),
          })
        );

        await Promise.all(promises);
      } else {
        // 단일 예약 생성
        await addDoc(collection(db, 'reservations'), {
          ...baseReservationData,
          date: formData.date,
          createdAt: Timestamp.now(),
        });
      }

      onSuccess?.();
    } catch (err) {
      console.error('예약 저장 실패:', err);
      setError('예약 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 예상 생성 개수 계산
  const getEstimatedCount = () => {
    if (!isRepeat) return 1;
    return generateRepeatDates().length;
  };

  const estimatedCount = isRepeat ? getEstimatedCount() : 1;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {isEditing ? '예약 정보 수정' : '예약 정보 등록'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* 날짜 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isRepeat ? '시작 날짜' : '날짜'} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        {/* 반복 일정 설정 (신규 등록시만) */}
        {!isEditing && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="isRepeat"
                checked={isRepeat}
                onChange={(e) => setIsRepeat(e.target.checked)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <label htmlFor="isRepeat" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <FiRepeat className="text-primary" />
                반복 일정으로 등록
              </label>
            </div>

            {isRepeat && (
              <div className="space-y-4 mt-3 pt-3 border-t border-gray-200">
                {/* 요일 선택 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    반복 요일 선택
                  </label>
                  <div className="flex gap-1">
                    {WEEKDAYS.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                          selectedDays.includes(day.value)
                            ? 'bg-primary text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:border-primary'
                        } ${day.value === 0 ? 'text-red-500' : ''} ${day.value === 6 ? 'text-blue-500' : ''}`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 반복 종료 설정 */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    반복 종료
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repeatEndType"
                        value="date"
                        checked={repeatEndType === 'date'}
                        onChange={() => setRepeatEndType('date')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">종료일 지정</span>
                    </label>
                    {repeatEndType === 'date' && (
                      <input
                        type="date"
                        value={repeatEndDate}
                        onChange={(e) => setRepeatEndDate(e.target.value)}
                        min={formData.date}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repeatEndType"
                        value="none"
                        checked={repeatEndType === 'none'}
                        onChange={() => setRepeatEndType('none')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">종료 없음 (최대 1년)</span>
                    </label>
                  </div>
                </div>

                {/* 예상 생성 개수 */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-primary font-medium">
                    총 {estimatedCount}건의 예약이 등록됩니다
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedDays.map((d) => WEEKDAYS.find((w) => w.value === d)?.label).join(', ')}요일마다 반복
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 시간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작 시간 <span className="text-red-500">*</span>
            </label>
            <TimePicker
              value={formData.startTime}
              onChange={(time) => setFormData((prev) => ({ ...prev, startTime: time }))}
              placeholder="시작 시간"
              required
              accentColor="primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료 시간 <span className="text-red-500">*</span>
            </label>
            <TimePicker
              value={formData.endTime}
              onChange={(time) => setFormData((prev) => ({ ...prev, endTime: time }))}
              placeholder="종료 시간"
              required
              accentColor="primary"
            />
          </div>
        </div>

        {/* 장소 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            장소 <span className="text-red-500">*</span>
          </label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* 기타 장소 직접 입력 */}
        {formData.location === '기타' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              장소 직접 입력 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="customLocation"
              value={formData.customLocation}
              onChange={handleChange}
              placeholder="장소명을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>
        )}

        {/* 사용 목적 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            사용 목적 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            placeholder="예: 뮤지컬 연습, 안무 연습 등"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            required
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? '저장 중...'
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
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
