'use client';

/**
 * 예약 현황 페이지
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { Reservation, ClubEvent } from '@/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ReservationCalendar from '@/components/reservations/ReservationCalendar';
import ReservationForm from '@/components/reservations/ReservationForm';
import ReservationList from '@/components/reservations/ReservationList';
import EventForm from '@/components/events/EventForm';
import EventList from '@/components/events/EventList';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FiPlus, FiCalendar, FiList, FiStar } from 'react-icons/fi';

type FormType = 'none' | 'reservation' | 'event';

export default function ReservationsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showFormType, setShowFormType] = useState<FormType>('none');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 로그인 체크
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 선택된 날짜의 예약 데이터 실시간 조회
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setReservations([]);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const q = query(
      collection(db, 'reservations'),
      where('date', '==', dateStr),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Reservation[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Reservation[];
        setReservations(data);
        setLoading(false);
      },
      (error) => {
        console.error('예약 조회 실패:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, selectedDate, refreshTrigger]);

  // 선택된 날짜의 행사 데이터 실시간 조회
  useEffect(() => {
    if (!user) return;

    setEventsLoading(true);
    setEvents([]);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const q = query(
      collection(db, 'events'),
      where('date', '==', dateStr)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: ClubEvent[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as ClubEvent[];
        setEvents(data);
        setEventsLoading(false);
      },
      (error) => {
        console.error('행사 조회 실패:', error);
        setEventsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, selectedDate, refreshTrigger]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleFormSuccess = () => {
    setShowFormType('none');
    setEditingReservation(null);
    setEditingEvent(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setShowFormType('reservation');
  };

  const handleEditEvent = (event: ClubEvent) => {
    setEditingEvent(event);
    setShowFormType('event');
  };

  const handleCancelForm = () => {
    setShowFormType('none');
    setEditingReservation(null);
    setEditingEvent(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-primary text-xl">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* 뷰 모드 토글 */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiCalendar size={18} />
              달력
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiList size={18} />
              목록
            </button>
          </div>
        </div>

        {/* 달력 뷰 */}
        {viewMode === 'calendar' && (
          <ReservationCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        )}

        {/* 선택된 날짜 정보 */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })}
            </h2>
            <p className="text-gray-500">
              {format(selectedDate, 'EEEE', { locale: ko })}
            </p>
          </div>
        </div>

        {/* 등록 버튼들 */}
        {showFormType === 'none' && (
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowFormType('reservation')}
              className="flex-1 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <FiPlus size={20} />
              예약 정보 등록
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowFormType('event')}
                className="py-4 px-6 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <FiStar size={20} />
                행사 등록
              </button>
            )}
          </div>
        )}

        {/* 예약 폼 */}
        {showFormType === 'reservation' && (
          <div className="mb-6">
            <ReservationForm
              onSuccess={handleFormSuccess}
              onCancel={handleCancelForm}
              editingReservation={editingReservation}
              defaultDate={format(selectedDate, 'yyyy-MM-dd')}
            />
          </div>
        )}

        {/* 행사 폼 */}
        {showFormType === 'event' && (
          <div className="mb-6">
            <EventForm
              onSuccess={handleFormSuccess}
              onCancel={handleCancelForm}
              editingEvent={editingEvent}
              defaultDate={format(selectedDate, 'yyyy-MM-dd')}
            />
          </div>
        )}

        {/* 행사 목록 */}
        {events.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiStar className="text-orange-500" />
              {format(selectedDate, 'M월 d일', { locale: ko })} 행사
            </h3>
            <EventList
              events={events}
              onEdit={handleEditEvent}
              onDeleted={() => setRefreshTrigger((prev) => prev + 1)}
              loading={eventsLoading}
            />
          </div>
        )}

        {/* 예약 목록 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {format(selectedDate, 'M월 d일', { locale: ko })} 예약 현황
            <span className="ml-2 text-primary">({reservations.length}건)</span>
          </h3>
          <ReservationList
            reservations={reservations}
            onEdit={handleEditReservation}
            onDeleted={() => setRefreshTrigger((prev) => prev + 1)}
            loading={loading}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
