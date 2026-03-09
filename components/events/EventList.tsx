'use client';

import { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { ClubEvent } from '@/types';
import { FiEdit2, FiTrash2, FiMapPin, FiClock, FiCalendar, FiExternalLink } from 'react-icons/fi';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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
    if (!confirm('이 행사를 삭제할까요?')) return;

    setDeletingId(event.id);
    try {
      await deleteDoc(doc(db, 'events', event.id));
      onDeleted?.();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했어요. 다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-orange-400" />
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => {
        const isDeleting = deletingId === event.id;

        return (
          <div
            key={event.id}
            className={`bg-white rounded-2xl p-5 border border-gray-100 border-l-[3px] border-l-orange-400 card-hover animate-fade-in-up ${
              isDeleting ? 'opacity-50' : ''
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                {/* Title */}
                <div className="flex items-center gap-2 mb-2.5">
                  <FiCalendar className="text-orange-400 shrink-0" size={15} />
                  <h4 className="text-[15px] font-bold text-foreground">{event.title}</h4>
                  <span className="text-[11px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-lg font-medium">
                    {event.endDate ? `${format(new Date(event.date + 'T00:00:00'), 'M/d', { locale: ko })}~${format(new Date(event.endDate + 'T00:00:00'), 'M/d', { locale: ko })}` : '행사'}
                  </span>
                </div>

                {/* Time */}
                {(event.startTime || event.endTime) && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <FiClock size={14} className="shrink-0" style={{ color: '#8b95a1' }} />
                    <span className="text-sm" style={{ color: '#4e5968' }}>
                      {event.startTime || '시작 미정'} ~ {event.endTime || '종료 미정'}
                    </span>
                  </div>
                )}

                {/* Location */}
                {event.location && (
                  <div className="flex items-center gap-2 mb-3">
                    <FiMapPin size={14} className="shrink-0" style={{ color: '#8b95a1' }} />
                    {event.locationUrl ? (
                      <a
                        href={event.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {event.location}
                        <FiExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-sm" style={{ color: '#4e5968' }}>{event.location}</span>
                    )}
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <div className="p-3 bg-orange-50 rounded-xl">
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#4e5968' }}>{event.description}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isAdmin && (
                <div className="flex gap-1 ml-3 shrink-0">
                  <button
                    onClick={() => onEdit?.(event)}
                    disabled={isDeleting}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-orange-400 hover:bg-orange-50 rounded-xl transition-colors"
                    title="수정"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(event)}
                    disabled={isDeleting}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="삭제"
                  >
                    <FiTrash2 size={16} />
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
