'use client';

import { useState } from 'react';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { ClubEvent, ClubEventFormData, LocationType } from '@/types';
import { FiCalendar, FiLink } from 'react-icons/fi';
import TimePicker from '@/components/common/TimePicker';

const LOCATIONS: LocationType[] = ['합동연습실', 'ART8실', '댄스3실', '기타'];

interface EventFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  editingEvent?: ClubEvent | null;
  defaultDate?: string;
}

export default function EventForm({
  onSuccess,
  onCancel,
  editingEvent,
  defaultDate,
}: EventFormProps) {
  const { user, isAdmin } = useAuth();
  const isEditing = !!editingEvent;

  const getInitialLocationType = (): LocationType => {
    if (!editingEvent?.location) return '합동연습실';
    if (LOCATIONS.includes(editingEvent.location as LocationType)) {
      return editingEvent.location as LocationType;
    }
    return '기타';
  };

  const [isMultiDay, setIsMultiDay] = useState(!!editingEvent?.endDate);
  const [formData, setFormData] = useState<ClubEventFormData>({
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    date: editingEvent?.date || defaultDate || new Date().toISOString().split('T')[0],
    endDate: editingEvent?.endDate || '',
    startTime: editingEvent?.startTime || '18:00',
    endTime: editingEvent?.endTime || '21:00',
    location: editingEvent?.location || '합동연습실',
    locationUrl: editingEvent?.locationUrl || '',
  });

  const [selectedLocationType, setSelectedLocationType] = useState<LocationType>(getInitialLocationType());
  const [customLocation, setCustomLocation] = useState(
    editingEvent?.location && !LOCATIONS.includes(editingEvent.location as LocationType)
      ? editingEvent.location
      : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as LocationType;
    setSelectedLocationType(value);
    if (value !== '기타') {
      setFormData((prev) => ({ ...prev, location: value }));
      setCustomLocation('');
    }
    setError(null);
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('행사 제목을 입력해주세요');
      return false;
    }
    if (!formData.date) {
      setError('날짜를 선택해주세요');
      return false;
    }
    if (isMultiDay && formData.endDate && formData.endDate < formData.date) {
      setError('종료일은 시작일보다 늦어야 해요');
      return false;
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      setError('종료 시간은 시작 시간보다 늦어야 해요');
      return false;
    }
    if (selectedLocationType === '기타' && !customLocation.trim()) {
      setError('장소를 직접 입력해주세요');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isAdmin) {
      setError('운영진만 행사를 등록할 수 있어요');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const finalLocation = selectedLocationType === '기타' ? customLocation.trim() : selectedLocationType;

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        endDate: isMultiDay && formData.endDate ? formData.endDate : null,
        ...(formData.startTime && { startTime: formData.startTime }),
        ...(formData.endTime && { endTime: formData.endTime }),
        location: finalLocation,
        locationUrl: selectedLocationType === '기타' ? (formData.locationUrl?.trim() || null) : null,
        updatedAt: Timestamp.now(),
      };

      if (isEditing && editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), eventData);
      } else {
        await addDoc(collection(db, 'events'), {
          ...eventData,
          createdBy: user.uid,
          createdByName: user.displayName || '익명',
          createdAt: Timestamp.now(),
        });
      }

      onSuccess?.();
    } catch (err) {
      console.error('행사 저장 실패:', err);
      setError('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-orange-50 rounded-2xl p-6 text-center">
        <p className="text-orange-700 text-sm font-medium">운영진만 행사를 등록할 수 있어요</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 border-l-[3px] border-l-orange-400">
      <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
        <FiCalendar className="text-orange-500" size={18} />
        {isEditing ? '행사 수정하기' : '새 행사 등록하기'}
      </h2>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
            행사 제목 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="예: 정기 공연, 워크샵 등"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium" style={{ color: '#4e5968' }}>
              {isMultiDay ? '시작일' : '날짜'} <span className="text-red-400">*</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isMultiDay}
                onChange={(e) => setIsMultiDay(e.target.checked)}
                className="w-3.5 h-3.5 text-orange-500 rounded focus:ring-orange-400"
              />
              <span className="text-xs font-medium" style={{ color: '#8b95a1' }}>여러 날</span>
            </label>
          </div>
          <div className={isMultiDay ? 'grid grid-cols-2 gap-2' : ''}>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-white"
              required
            />
            {isMultiDay && (
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.date}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-white"
                placeholder="종료일"
                required
              />
            )}
          </div>
          {isMultiDay && (
            <p className="text-[11px] mt-1" style={{ color: '#8b95a1' }}>시작일부터 종료일까지 캘린더에 표시돼요</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
              시작 시간
            </label>
            <TimePicker
              value={formData.startTime || ''}
              onChange={(time) => handleTimeChange('startTime', time)}
              placeholder="시작 시간"
              allowEmpty={true}
              accentColor="orange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
              종료 시간
            </label>
            <TimePicker
              value={formData.endTime || ''}
              onChange={(time) => handleTimeChange('endTime', time)}
              placeholder="종료 시간"
              allowEmpty={true}
              accentColor="orange"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
            장소
          </label>
          <select
            value={selectedLocationType}
            onChange={handleLocationChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm bg-white"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {selectedLocationType === '기타' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
                장소 직접 입력 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="장소명을 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
              />
              <p className="text-[11px] mt-1" style={{ color: '#8b95a1' }}>지도 앱에서 공유 링크를 복사해 붙여넣으면 돼요</p>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#4e5968' }}>
            행사 설명
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="행사에 대한 설명을 입력하세요"
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isSubmitting ? '저장하고 있어요...' : isEditing ? '수정하기' : '등록하기'}
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
