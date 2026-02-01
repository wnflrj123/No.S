'use client';

/**
 * 동호회 행사 등록/수정 폼 컴포넌트
 * 운영진만 사용 가능
 */

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { ClubEvent, ClubEventFormData, LocationType } from '@/types';
import { FiCalendar } from 'react-icons/fi';
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

  // 현재 장소가 기본 옵션에 있는지 확인
  const getInitialLocationType = (): LocationType => {
    if (!editingEvent?.location) return '합동연습실';
    if (LOCATIONS.includes(editingEvent.location as LocationType)) {
      return editingEvent.location as LocationType;
    }
    return '기타';
  };

  const [formData, setFormData] = useState<ClubEventFormData>({
    title: editingEvent?.title || '',
    description: editingEvent?.description || '',
    date: editingEvent?.date || defaultDate || new Date().toISOString().split('T')[0],
    startTime: editingEvent?.startTime || '18:00',
    endTime: editingEvent?.endTime || '21:00',
    location: editingEvent?.location || '합동연습실',
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
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다');
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
      setError('운영진만 행사를 등록할 수 있습니다');
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
        ...(formData.startTime && { startTime: formData.startTime }),
        ...(formData.endTime && { endTime: formData.endTime }),
        location: finalLocation,
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
      setError('행사 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <p className="text-yellow-800">운영진만 행사를 등록할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-400">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiCalendar className="text-orange-500" />
        {isEditing ? '행사 정보 수정' : '동호회 행사 등록'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* 행사 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            행사 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="예: 정기 공연, 워크샵 등"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            required
          />
        </div>

        {/* 날짜 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            날짜 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            required
          />
        </div>

        {/* 시간 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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

        {/* 장소 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            장소
          </label>
          <select
            value={selectedLocationType}
            onChange={handleLocationChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* 기타 장소 직접 입력 */}
        {selectedLocationType === '기타' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              장소 직접 입력 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="장소명을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              required
            />
          </div>
        )}

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            행사 설명
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="행사에 대한 설명을 입력하세요"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '저장 중...' : isEditing ? '수정하기' : '등록하기'}
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
