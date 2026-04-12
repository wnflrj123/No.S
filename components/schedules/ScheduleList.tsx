'use client';

import { useState } from 'react';
import { deleteDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { ScheduledActivity } from '@/types';
import { FiEdit2, FiTrash2, FiMapPin, FiClock, FiRepeat, FiX, FiExternalLink } from 'react-icons/fi';

export type EditScope = 'single' | 'all' | 'future';

interface ScheduleListProps {
  schedules: ScheduledActivity[];
  onEdit?: (schedule: ScheduledActivity, editScope?: EditScope) => void;
  onDeleted?: () => void;
  loading?: boolean;
}

type DeleteOption = 'single' | 'all' | 'future';

interface DeleteModalProps {
  schedule: ScheduledActivity;
  onClose: () => void;
  onConfirm: (option: DeleteOption) => void;
  isDeleting: boolean;
}

function DeleteModal({ schedule, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  const [selectedOption, setSelectedOption] = useState<DeleteOption | null>(null);
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const optionLabels: Record<DeleteOption, string> = {
    single: '이 일정만',
    future: '이 일정 및 향후 일정',
    all: '모든 반복 일정',
  };

  const handleOptionSelect = (option: DeleteOption) => {
    setSelectedOption(option);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (selectedOption) {
      onConfirm(selectedOption);
    }
  };

  const handleBack = () => {
    setStep('select');
    setSelectedOption(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-foreground">
            {step === 'select' ? '반복 일정 삭제' : '정말 삭제할까요?'}
          </h3>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
          >
            <FiX size={18} style={{ color: '#8b95a1' }} />
          </button>
        </div>

        {step === 'select' ? (
          <>
            <p className="text-sm mb-4" style={{ color: '#6b7684' }}>
              반복 일정이에요. 어떻게 삭제할까요?
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleOptionSelect('single')}
                disabled={isDeleting}
                className="w-full py-3.5 px-4 text-left bg-secondary hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-foreground text-sm">이 일정만 삭제</p>
                <p className="text-xs mt-0.5" style={{ color: '#8b95a1' }}>선택한 날짜의 일정만 삭제해요</p>
              </button>

              <button
                onClick={() => handleOptionSelect('future')}
                disabled={isDeleting}
                className="w-full py-3.5 px-4 text-left bg-secondary hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-foreground text-sm">이 일정 및 향후 일정 삭제</p>
                <p className="text-xs mt-0.5" style={{ color: '#8b95a1' }}>이 날짜 이후의 반복 일정을 모두 삭제해요</p>
              </button>

              <button
                onClick={() => handleOptionSelect('all')}
                disabled={isDeleting}
                className="w-full py-3.5 px-4 text-left bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-red-600 text-sm">모든 반복 일정 삭제</p>
                <p className="text-xs text-red-400 mt-0.5">이 반복 일정의 모든 일정을 삭제해요</p>
              </button>
            </div>

            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-full mt-3 py-2.5 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              style={{ color: '#8b95a1' }}
            >
              취소
            </button>
          </>
        ) : (
          <>
            <div className="bg-orange-50 rounded-xl p-4 mb-5">
              <p className="text-sm text-orange-700 font-medium">
                {optionLabels[selectedOption!]}을(를) 삭제해요.
              </p>
              <p className="text-xs text-orange-500 mt-1">
                이 작업은 되돌릴 수 없어요.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                disabled={isDeleting}
                className="flex-1 py-3 bg-secondary text-foreground font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
              >
                뒤로
              </button>
              <button
                onClick={handleConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
              >
                {isDeleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </>
        )}

        {isDeleting && (
          <div className="flex items-center justify-center mt-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#4eaea9] mr-2" />
            <span className="text-sm" style={{ color: '#8b95a1' }}>삭제하고 있어요...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EditModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (option: EditScope) => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-foreground">반복 일정 수정</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
          >
            <FiX size={18} style={{ color: '#8b95a1' }} />
          </button>
        </div>

        <p className="text-sm mb-4" style={{ color: '#6b7684' }}>
          반복 일정이에요. 어떻게 수정할까요?
        </p>

        <div className="space-y-2">
          <button
            onClick={() => onConfirm('single')}
            className="w-full py-3.5 px-4 text-left bg-secondary hover:bg-gray-100 rounded-xl transition-colors"
          >
            <p className="font-medium text-foreground text-sm">이 일정만 수정</p>
            <p className="text-xs mt-0.5" style={{ color: '#8b95a1' }}>선택한 날짜의 일정만 수정해요</p>
          </button>

          <button
            onClick={() => onConfirm('future')}
            className="w-full py-3.5 px-4 text-left bg-secondary hover:bg-gray-100 rounded-xl transition-colors"
          >
            <p className="font-medium text-foreground text-sm">이 일정 및 향후 일정 수정</p>
            <p className="text-xs mt-0.5" style={{ color: '#8b95a1' }}>이 날짜 이후의 반복 일정을 모두 수정해요</p>
          </button>

          <button
            onClick={() => onConfirm('all')}
            className="w-full py-3.5 px-4 text-left bg-[#4eaea9]/8 hover:bg-[#4eaea9]/15 rounded-xl transition-colors"
          >
            <p className="font-medium text-[#4eaea9] text-sm">모든 반복 일정 수정</p>
            <p className="text-xs text-[#4eaea9] mt-0.5">이 반복 일정의 모든 일정을 수정해요</p>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2.5 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
          style={{ color: '#8b95a1' }}
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default function ScheduleList({
  schedules,
  onEdit,
  onDeleted,
  loading = false,
}: ScheduleListProps) {
  const { isAdmin } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalSchedule, setDeleteModalSchedule] = useState<ScheduledActivity | null>(null);
  const [editModalSchedule, setEditModalSchedule] = useState<ScheduledActivity | null>(null);

  const handleEditClick = (schedule: ScheduledActivity) => {
    if (schedule.repeatGroupId) {
      setEditModalSchedule(schedule);
    } else {
      onEdit?.(schedule);
    }
  };

  const handleEditOption = (option: EditScope) => {
    if (editModalSchedule) {
      onEdit?.(editModalSchedule, option);
      setEditModalSchedule(null);
    }
  };

  const handleDeleteClick = (schedule: ScheduledActivity) => {
    if (schedule.repeatGroupId) {
      setDeleteModalSchedule(schedule);
    } else {
      handleSingleDelete(schedule);
    }
  };

  const handleSingleDelete = async (schedule: ScheduledActivity) => {
    if (!confirm('이 정기 일정을 삭제할까요?')) return;

    setDeletingId(schedule.id);
    try {
      await deleteDoc(doc(db, 'schedules', schedule.id));
      onDeleted?.();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했어요. 다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRepeatDelete = async (option: DeleteOption) => {
    if (!deleteModalSchedule) return;

    setDeletingId(deleteModalSchedule.id);

    try {
      if (option === 'single') {
        await deleteDoc(doc(db, 'schedules', deleteModalSchedule.id));
      } else if (option === 'all') {
        const q = query(
          collection(db, 'schedules'),
          where('repeatGroupId', '==', deleteModalSchedule.repeatGroupId)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, 'schedules', docSnap.id))
        );
        await Promise.all(deletePromises);
      } else if (option === 'future') {
        const q = query(
          collection(db, 'schedules'),
          where('repeatGroupId', '==', deleteModalSchedule.repeatGroupId)
        );
        const snapshot = await getDocs(q);
        const currentDate = deleteModalSchedule.date;

        const deletePromises = snapshot.docs
          .filter((docSnap) => docSnap.data().date >= currentDate)
          .map((docSnap) => deleteDoc(doc(db, 'schedules', docSnap.id)));

        await Promise.all(deletePromises);
      }

      setDeleteModalSchedule(null);
      onDeleted?.();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했어요. 다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  const getLocationDisplay = (schedule: ScheduledActivity) => {
    if (schedule.location === '기타' && schedule.customLocation) {
      return schedule.customLocation;
    }
    return schedule.location;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="shimmer-bg h-5 w-32 rounded-lg mb-3" />
            <div className="shimmer-bg h-4 w-24 rounded-lg mb-2" />
            <div className="shimmer-bg h-4 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (schedules.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {schedules.map((schedule, index) => {
          const isDeleting = deletingId === schedule.id;
          const isRepeatSchedule = !!schedule.repeatGroupId;

          return (
            <div
              key={schedule.id}
              className={`bg-white rounded-2xl p-5 border border-gray-100 border-l-[3px] border-l-[#4eaea9] card-hover animate-fade-in-up ${
                isDeleting ? 'opacity-50' : ''
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <FiClock className="text-[#4eaea9] shrink-0" size={15} />
                    <h4 className="text-[15px] font-bold text-foreground">{schedule.title}</h4>
                    {isRepeatSchedule && (
                      <span className="flex items-center gap-1 text-[11px] bg-[#4eaea9]/8 text-[#4eaea9] px-2 py-0.5 rounded-lg font-medium">
                        <FiRepeat size={10} />
                        반복
                      </span>
                    )}
                    <span className="text-[11px] bg-[#4eaea9]/8 text-[#4eaea9] px-2 py-0.5 rounded-lg font-medium">
                      정기
                    </span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <FiClock size={14} className="shrink-0" style={{ color: '#8b95a1' }} />
                    <span className="text-sm font-medium" style={{ color: '#4e5968' }}>
                      {schedule.startTime} ~ {schedule.endTime}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2">
                    <FiMapPin size={14} className="shrink-0" style={{ color: '#8b95a1' }} />
                    {schedule.locationUrl ? (
                      <a
                        href={schedule.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {getLocationDisplay(schedule)}
                        <FiExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-sm" style={{ color: '#4e5968' }}>{getLocationDisplay(schedule)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex gap-1 ml-3 shrink-0">
                    <button
                      onClick={() => handleEditClick(schedule)}
                      disabled={isDeleting}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#4eaea9] hover:bg-[#4eaea9]/10 rounded-xl transition-colors"
                      title="수정"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(schedule)}
                      disabled={isDeleting}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="삭제"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Description — full width */}
              {schedule.description && (
                <div className="mt-3 p-3 bg-[#4eaea9]/8 rounded-xl">
                  <p className="text-sm whitespace-pre-wrap" style={{ color: '#4e5968' }}>{schedule.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {deleteModalSchedule && (
        <DeleteModal
          schedule={deleteModalSchedule}
          onClose={() => setDeleteModalSchedule(null)}
          onConfirm={handleRepeatDelete}
          isDeleting={!!deletingId}
        />
      )}

      {editModalSchedule && (
        <EditModal
          onClose={() => setEditModalSchedule(null)}
          onConfirm={handleEditOption}
        />
      )}
    </>
  );
}
