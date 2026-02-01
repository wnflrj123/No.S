'use client';

/**
 * 동호회 행사 목록 컴포넌트
 */

import { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { ClubEvent } from '@/types';
import { FiEdit2, FiTrash2, FiMapPin, FiClock, FiCalendar } from 'react-icons/fi';

interface EventListProps {
  events: ClubEvent[];
  onEdit?: (event: ClubEvent) => void;
  onDeleted?: () => void;
  loading?: boolean;
}

export default function EventList({
  events,
  onEdit,
  onDeleted,
  loading = false,
}: EventListProps) {
  const { isAdmin } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (event: ClubEvent) => {
    if (!confirm('정말 이 행사를 삭제하시겠습니까?')) return;

    setDeletingId(event.id);
    try {
      await deleteDoc(doc(db, 'events', event.id));
      onDeleted?.();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const isDeleting = deletingId === event.id;

        return (
          <div
            key={event.id}
            className={`bg-gradient-to-r from-orange-50 to-white rounded-xl shadow-md p-5 border-l-4 border-orange-400 ${
              isDeleting ? 'opacity-50' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {/* 행사 제목 */}
                <div className="flex items-center gap-2 mb-2">
                  <FiCalendar className="text-orange-500" />
                  <h4 className="text-lg font-bold text-gray-800">{event.title}</h4>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    행사
                  </span>
                </div>

                {/* 시간 */}
                {(event.startTime || event.endTime) && (
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <FiClock className="text-orange-400" />
                    <span>
                      {event.startTime || '시작 미정'} ~ {event.endTime || '종료 미정'}
                    </span>
                  </div>
                )}

                {/* 장소 */}
                {event.location && (
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <FiMapPin className="text-orange-400" />
                    <span>{event.location}</span>
                  </div>
                )}

                {/* 설명 */}
                {event.description && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}
              </div>

              {/* 수정/삭제 버튼 (운영진만) */}
              {isAdmin && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onEdit?.(event)}
                    disabled={isDeleting}
                    className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    title="수정"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(event)}
                    disabled={isDeleting}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
