'use client';

/**
 * 예약 목록 컴포넌트
 */

import { useState } from 'react';
import { deleteDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { Reservation } from '@/types';
import { FiEdit2, FiTrash2, FiMapPin, FiClock, FiUser, FiRepeat, FiX } from 'react-icons/fi';

interface ReservationListProps {
  reservations: Reservation[];
  onEdit?: (reservation: Reservation) => void;
  onDeleted?: () => void;
  loading?: boolean;
}

type DeleteOption = 'single' | 'all' | 'future';

interface DeleteModalProps {
  reservation: Reservation;
  onClose: () => void;
  onConfirm: (option: DeleteOption) => void;
  isDeleting: boolean;
}

function DeleteModal({ reservation, onClose, onConfirm, isDeleting }: DeleteModalProps) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {step === 'select' ? '반복 일정 삭제' : '삭제 확인'}
          </h3>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {step === 'select' ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              이 예약은 반복 일정입니다. 어떻게 삭제하시겠습니까?
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleOptionSelect('single')}
                disabled={isDeleting}
                className="w-full py-3 px-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-gray-800">이 일정만 삭제</p>
                <p className="text-xs text-gray-500 mt-1">선택한 날짜의 일정만 삭제합니다</p>
              </button>

              <button
                onClick={() => handleOptionSelect('future')}
                disabled={isDeleting}
                className="w-full py-3 px-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-gray-800">이 일정 및 향후 일정 삭제</p>
                <p className="text-xs text-gray-500 mt-1">이 날짜 이후의 모든 반복 일정을 삭제합니다</p>
              </button>

              <button
                onClick={() => handleOptionSelect('all')}
                disabled={isDeleting}
                className="w-full py-3 px-4 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <p className="font-medium text-red-700">모든 반복 일정 삭제</p>
                <p className="text-xs text-red-500 mt-1">이 반복 일정의 모든 예약을 삭제합니다</p>
              </button>
            </div>

            <button
              onClick={onClose}
              disabled={isDeleting}
              className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              취소
            </button>
          </>
        ) : (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>{optionLabels[selectedOption!]}</strong>을(를) 삭제합니다.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                뒤로
              </button>
              <button
                onClick={handleConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </>
        )}

        {isDeleting && (
          <div className="flex items-center justify-center mt-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
            <span className="text-sm text-gray-500">삭제 중...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReservationList({
  reservations,
  onEdit,
  onDeleted,
  loading = false,
}: ReservationListProps) {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalReservation, setDeleteModalReservation] = useState<Reservation | null>(null);

  const handleDeleteClick = (reservation: Reservation) => {
    if (reservation.repeatGroupId) {
      // 반복 일정이면 모달 표시
      setDeleteModalReservation(reservation);
    } else {
      // 단일 일정이면 바로 삭제 확인
      handleSingleDelete(reservation);
    }
  };

  const handleSingleDelete = async (reservation: Reservation) => {
    if (!confirm('정말 이 예약 정보를 삭제하시겠습니까?')) return;

    setDeletingId(reservation.id);
    try {
      await deleteDoc(doc(db, 'reservations', reservation.id));
      onDeleted?.();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRepeatDelete = async (option: DeleteOption) => {
    if (!deleteModalReservation) return;

    setDeletingId(deleteModalReservation.id);

    try {
      if (option === 'single') {
        // 이 일정만 삭제
        await deleteDoc(doc(db, 'reservations', deleteModalReservation.id));
      } else if (option === 'all') {
        // 모든 반복 일정 삭제
        const q = query(
          collection(db, 'reservations'),
          where('repeatGroupId', '==', deleteModalReservation.repeatGroupId)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, 'reservations', docSnap.id))
        );
        await Promise.all(deletePromises);
      } else if (option === 'future') {
        // 이 일정 및 향후 일정 삭제
        const q = query(
          collection(db, 'reservations'),
          where('repeatGroupId', '==', deleteModalReservation.repeatGroupId)
        );
        const snapshot = await getDocs(q);
        const currentDate = deleteModalReservation.date;

        const deletePromises = snapshot.docs
          .filter((docSnap) => docSnap.data().date >= currentDate)
          .map((docSnap) => deleteDoc(doc(db, 'reservations', docSnap.id)));

        await Promise.all(deletePromises);
      }

      setDeleteModalReservation(null);
      onDeleted?.();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  const getLocationDisplay = (reservation: Reservation) => {
    if (reservation.location === '기타' && reservation.customLocation) {
      return reservation.customLocation;
    }
    return reservation.location;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <p className="text-gray-500 text-lg">등록된 예약이 없습니다</p>
        <p className="text-gray-400 text-sm mt-2">새로운 예약 정보를 등록해보세요!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reservations.map((reservation) => {
          const isOwner = user?.uid === reservation.userId;
          const isDeleting = deletingId === reservation.id;
          const isRepeatReservation = !!reservation.repeatGroupId;

          return (
            <div
              key={reservation.id}
              className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${
                isOwner ? 'border-primary' : 'border-gray-300'
              } ${isDeleting ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* 시간 */}
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-2">
                    <FiClock className="text-primary" />
                    <span>
                      {reservation.startTime} ~ {reservation.endTime}
                    </span>
                    {isRepeatReservation && (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        <FiRepeat size={12} />
                        반복
                      </span>
                    )}
                  </div>

                  {/* 장소 */}
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <FiMapPin className="text-gray-400" />
                    <span className="font-medium">{getLocationDisplay(reservation)}</span>
                  </div>

                  {/* 예약자 */}
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <FiUser className="text-gray-400" />
                    <span>{reservation.userName}</span>
                    {isOwner && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        내 예약
                      </span>
                    )}
                  </div>

                  {/* 사용 목적 */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{reservation.purpose}</p>
                  </div>
                </div>

                {/* 수정/삭제 버튼 (본인만) */}
                {isOwner && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onEdit?.(reservation)}
                      disabled={isDeleting}
                      className="p-2 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(reservation)}
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

      {/* 반복 일정 삭제 모달 */}
      {deleteModalReservation && (
        <DeleteModal
          reservation={deleteModalReservation}
          onClose={() => setDeleteModalReservation(null)}
          onConfirm={handleRepeatDelete}
          isDeleting={!!deletingId}
        />
      )}
    </>
  );
}
