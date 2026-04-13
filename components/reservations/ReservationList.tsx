'use client';

import { useState, useEffect } from 'react';
import { deleteDoc, doc, collection, query, where, getDocs, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { Reservation, ReservationParticipant, Production, Musical } from '@/types';
import { FiEdit2, FiTrash2, FiMapPin, FiClock, FiUser, FiRepeat, FiX, FiExternalLink, FiUsers, FiUserPlus, FiUserMinus } from 'react-icons/fi';
import { format } from 'date-fns';

interface SceneChip {
  type: 'scene' | 'number';
  label: string;
  sortKey: string;
  secondary?: boolean;
}

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
                <p className="text-xs text-red-400 mt-0.5">이 반복 일정의 모든 예약을 삭제해요</p>
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
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-primary mr-2" />
            <span className="text-sm" style={{ color: '#8b95a1' }}>삭제하고 있어요...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function collectChips(
  musicalId: string,
  charIds: Set<number>,
  musicals: Record<string, Musical>,
  seen: Set<string>,
  secondary: boolean
): SceneChip[] {
  const musical = musicals[musicalId];
  if (!musical) return [];

  const chips: SceneChip[] = [];
  for (const scene of [...musical.scenes].sort((a, b) => a.index - b.index)) {
    const coverableNumbers = [...scene.numbers]
      .sort((a, b) => a.index - b.index)
      .filter((n) => n.characters.length > 0 && n.characters.every((cid) => charIds.has(cid)));

    if (coverableNumbers.length === 0) continue;

    const sceneLabel = `#${scene.index} ${scene.title}`;

    if (!secondary) {
      const allCovered = coverableNumbers.length === scene.numbers.length;
      if (allCovered) {
        // 씬 전체 커버 → 씬 칩만, 넘버 칩 없음
        if (!seen.has(sceneLabel)) {
          seen.add(sceneLabel);
          chips.push({ type: 'scene', label: sceneLabel, secondary: false, sortKey: `0_${String(scene.index).padStart(4, '0')}_0000` });
        }
      } else {
        // 부분 커버 → 커버 가능한 넘버 칩만 표시
        for (const number of coverableNumbers) {
          const numLabel = `M${number.index} ${number.title}`;
          if (!seen.has(numLabel)) {
            seen.add(numLabel);
            chips.push({ type: 'number', label: numLabel, secondary: false, sortKey: `1_${String(scene.index).padStart(4, '0')}_${String(number.index).padStart(4, '0')}` });
          }
        }
      }
    } else {
      // 다른 캐스팅: 넘버 칩 + 씬 칩 모두 secondary
      for (const number of coverableNumbers) {
        const numLabel = `M${number.index} ${number.title}`;
        if (!seen.has(numLabel)) {
          seen.add(numLabel);
          chips.push({ type: 'number', label: numLabel, secondary: true, sortKey: `1_${String(scene.index).padStart(4, '0')}_${String(number.index).padStart(4, '0')}` });
        }
      }
      if (!seen.has(sceneLabel)) {
        seen.add(sceneLabel);
        chips.push({ type: 'scene', label: sceneLabel, secondary: true, sortKey: `0_${String(scene.index).padStart(4, '0')}_0000` });
      }
    }
  }
  return chips;
}

function getSceneChips(
  participants: ReservationParticipant[],
  productions: Production[],
  musicals: Record<string, Musical>
): SceneChip[] {
  if (participants.length === 0) return [];

  const participantIds = new Set(participants.map((p) => p.userId));

  // 퍼포먼스(팀) 단위로 참여자 캐릭터 수집 — 같은 프로덕션이라도 팀이 다르면 분리
  type PerfData = { musicalId: string; charIds: Set<number>; castCount: number };
  const perfDataList: PerfData[] = [];
  const castParticipantIdsGlobal = new Set<string>();

  for (const production of productions) {
    for (const perf of production.performances) {
      const charIds = new Set<number>();
      const castParticipants = new Set<string>();
      for (const casting of perf.castings) {
        if (participantIds.has(casting.userId)) {
          charIds.add(casting.characterId);
          castParticipants.add(casting.userId);
          castParticipantIdsGlobal.add(casting.userId);
        }
      }
      if (charIds.size === 0) continue;
      perfDataList.push({ musicalId: production.musicalId, charIds, castCount: castParticipants.size });
    }
  }

  const totalCast = castParticipantIdsGlobal.size;

  // primary: 같은 팀(퍼포먼스)에 2명 이상 캐스팅
  const primaryList = totalCast <= 1 ? perfDataList : perfDataList.filter((p) => p.castCount >= 2);
  const secondaryList = totalCast <= 1 ? [] : perfDataList.filter((p) => p.castCount < 2);

  const primarySeen = new Set<string>();
  const primaryChips = primaryList
    .flatMap((p) => collectChips(p.musicalId, p.charIds, musicals, primarySeen, false))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // secondary: 다른 팀 캐릭터들을 뮤지컬별로 합산해서 커버 가능한 씬 계산
  const musicalSecondaryChars: Record<string, Set<number>> = {};
  for (const p of secondaryList) {
    if (!musicalSecondaryChars[p.musicalId]) musicalSecondaryChars[p.musicalId] = new Set();
    p.charIds.forEach((id) => musicalSecondaryChars[p.musicalId].add(id));
  }

  const secondarySeen = new Set(primarySeen);
  const secondaryChips = Object.entries(musicalSecondaryChars)
    .flatMap(([musicalId, charIds]) => collectChips(musicalId, charIds, musicals, secondarySeen, true))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return [...primaryChips, ...secondaryChips];
}

export default function ReservationList({
  reservations,
  onEdit,
  onDeleted,
  loading = false,
}: ReservationListProps) {
  const { user, isAdmin, effectiveName } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [deleteModalReservation, setDeleteModalReservation] = useState<Reservation | null>(null);
  const [productions, setProductions] = useState<Production[]>([]);
  const [musicals, setMusicals] = useState<Record<string, Musical>>({});

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const q = query(collection(db, 'productions'), where('endDate', '>=', today));
    getDocs(q).then(async (snap) => {
      const prods = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Production[];
      setProductions(prods);

      const musicalIds = [...new Set(prods.map((p) => p.musicalId))];
      const musicalDocs = await Promise.all(musicalIds.map((id) => getDoc(doc(db, 'musicals', id))));
      const map: Record<string, Musical> = {};
      musicalDocs.forEach((d) => {
        if (d.exists()) map[d.id] = { id: d.id, ...d.data() } as Musical;
      });
      setMusicals(map);
    });
  }, []);

  const handleDeleteClick = (reservation: Reservation) => {
    if (reservation.repeatGroupId) {
      setDeleteModalReservation(reservation);
    } else {
      handleSingleDelete(reservation);
    }
  };

  const handleSingleDelete = async (reservation: Reservation) => {
    if (!confirm('이 예약을 삭제할까요?')) return;

    setDeletingId(reservation.id);
    try {
      await deleteDoc(doc(db, 'reservations', reservation.id));
      onDeleted?.();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했어요. 다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRepeatDelete = async (option: DeleteOption) => {
    if (!deleteModalReservation) return;

    setDeletingId(deleteModalReservation.id);

    try {
      if (option === 'single') {
        await deleteDoc(doc(db, 'reservations', deleteModalReservation.id));
      } else if (option === 'all') {
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
      alert('삭제에 실패했어요. 다시 시도해주세요.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleJoin = async (reservation: Reservation) => {
    if (!user) return;

    const isParticipating = reservation.participants?.some((p) => p.userId === user.uid);
    setJoiningId(reservation.id);

    try {
      const participantEntry = {
        userId: user.uid,
        userName: effectiveName || user.displayName || '멤버',
      };

      if (isParticipating) {
        const existing = reservation.participants?.find((p) => p.userId === user.uid);
        if (existing) {
          await updateDoc(doc(db, 'reservations', reservation.id), {
            participants: arrayRemove(existing),
          });
        }
      } else {
        await updateDoc(doc(db, 'reservations', reservation.id), {
          participants: arrayUnion(participantEntry),
        });
      }
    } catch (error) {
      console.error('참여 변경 실패:', error);
      alert('처리에 실패했어요. 다시 시도해주세요.');
    } finally {
      setJoiningId(null);
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
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="shimmer-bg h-5 w-32 rounded-lg mb-3" />
            <div className="shimmer-bg h-4 w-24 rounded-lg mb-2" />
            <div className="shimmer-bg h-4 w-20 rounded-lg mb-3" />
            <div className="shimmer-bg h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 animate-fade-in-up">
        <img
          src="/empty-calendar.svg"
          alt=""
          className="w-40 h-auto mx-auto mb-4 animate-float"
        />
        <p className="font-bold text-foreground text-[15px]">아직 등록된 예약이 없어요</p>
        <p className="text-sm mt-1" style={{ color: '#8b95a1' }}>첫 번째 예약을 등록해볼까요?</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {reservations.map((reservation, index) => {
          const isMine = user?.uid === reservation.userId;
          const isDeleting = deletingId === reservation.id;
          const isJoining = joiningId === reservation.id;
          const isRepeatReservation = !!reservation.repeatGroupId;
          const participants = reservation.participants ?? [];
          const isParticipating = user ? participants.some((p) => p.userId === user.uid) : false;
          const sceneChips = getSceneChips(participants, productions, musicals);

          return (
            <div
              key={reservation.id}
              className={`bg-white rounded-2xl p-5 border border-gray-100 card-hover animate-fade-in-up ${
                'border-l-[3px] border-l-primary'
              } ${isDeleting ? 'opacity-50' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  {/* Time */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <FiClock size={15} className="text-primary shrink-0" />
                    <span className="text-[15px] font-bold text-foreground">
                      {reservation.startTime} ~ {reservation.endTime}
                    </span>
                    {isRepeatReservation && (
                      <span className="flex items-center gap-1 text-[11px] bg-primary/8 text-primary px-2 py-0.5 rounded-lg font-medium">
                        <FiRepeat size={10} />
                        반복
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <FiMapPin size={14} className="shrink-0" style={{ color: '#8b95a1' }} />
                    {reservation.locationUrl ? (
                      <a
                        href={reservation.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {getLocationDisplay(reservation)}
                        <FiExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-sm font-medium" style={{ color: '#4e5968' }}>{getLocationDisplay(reservation)}</span>
                    )}
                  </div>

                  {/* 예약자 */}
                  <div className="flex items-center gap-2 mb-3">
                    <FiUser size={13} className="shrink-0" style={{ color: '#8b95a1' }} />
                    <span className="text-sm" style={{ color: '#6b7684' }}>{reservation.userName}</span>
                    {isMine && (
                      <span className="text-[11px] bg-primary/8 text-primary px-2 py-0.5 rounded-lg font-medium">
                        나
                      </span>
                    )}
                  </div>

                </div>

                {/* Actions */}
                {(isMine || isAdmin) && (
                  <div className="flex gap-1 ml-3 shrink-0">
                    {isMine && (
                      <button
                        onClick={() => onEdit?.(reservation)}
                        disabled={isDeleting}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/8 rounded-xl transition-colors"
                        title="수정"
                      >
                        <FiEdit2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(reservation)}
                      disabled={isDeleting}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="삭제"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Purpose — full width */}
              <div className="p-3 bg-secondary rounded-xl">
                <p className="text-sm whitespace-pre-wrap" style={{ color: '#4e5968' }}>{reservation.purpose}</p>
              </div>

              {/* Divider — full width */}
              <hr className="mt-3 mb-3 border-gray-100" />

              {/* 참여자 리스트 + 참여하기 버튼 */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FiUsers size={14} className="shrink-0" style={{ color: '#8b95a1' }} />
                  {participants.length > 0 ? (
                    <span className="text-sm" style={{ color: '#4e5968' }}>
                      {participants.map((p, i) => (
                        <span key={p.userId}>
                          {i > 0 && <span style={{ color: '#c4c9d0' }}> · </span>}
                          <span className={user && p.userId === user.uid ? 'text-primary font-medium' : ''}>
                            {p.userName}
                          </span>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-sm" style={{ color: '#8b95a1' }}>아직 참여자가 없어요</span>
                  )}
                </div>

                {user && (
                  <button
                    onClick={() => handleJoin(reservation)}
                    disabled={isJoining || isDeleting}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      isParticipating
                        ? 'bg-primary/8 text-primary hover:bg-primary/15'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {isJoining ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : isParticipating ? (
                      <FiUserMinus size={14} />
                    ) : (
                      <FiUserPlus size={14} />
                    )}
                    {isJoining ? '처리 중...' : isParticipating ? '참여 취소' : '참여하기'}
                  </button>
                )}
              </div>

              {/* 추천 씬 칩 */}
              {sceneChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sceneChips.map((chip) => (
                    <span
                      key={chip.label}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                        chip.secondary
                          ? 'bg-gray-50 text-gray-400 border border-gray-200'
                          : chip.type === 'scene'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
