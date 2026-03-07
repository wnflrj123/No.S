'use client';

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
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FiPlus, FiCalendar, FiList, FiStar, FiClock, FiMapPin, FiFilter, FiEdit2 } from 'react-icons/fi';

type FormType = 'none' | 'reservation' | 'event';
type RangePreset = '1week' | '2weeks' | '1month' | 'custom';

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
  const [showEventsOnly, setShowEventsOnly] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // List view range
  const [rangePreset, setRangePreset] = useState<RangePreset>('1week');
  const [customStart, setCustomStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(addDays(new Date(), 6), 'yyyy-MM-dd'));
  const [listReservations, setListReservations] = useState<Reservation[]>([]);
  const [listEvents, setListEvents] = useState<ClubEvent[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const getDateRange = (): { start: string; end: string } => {
    const today = new Date();
    switch (rangePreset) {
      case '1week':
        return { start: format(today, 'yyyy-MM-dd'), end: format(addDays(today, 6), 'yyyy-MM-dd') };
      case '2weeks':
        return { start: format(today, 'yyyy-MM-dd'), end: format(addDays(today, 13), 'yyyy-MM-dd') };
      case '1month':
        return { start: format(today, 'yyyy-MM-dd'), end: format(addDays(today, 29), 'yyyy-MM-dd') };
      case 'custom':
        return { start: customStart, end: customEnd };
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Calendar view: single date query
  useEffect(() => {
    if (!user || viewMode !== 'calendar') return;

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
  }, [user, selectedDate, refreshTrigger, viewMode]);

  // Calendar view: single date events
  useEffect(() => {
    if (!user || viewMode !== 'calendar') return;

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
  }, [user, selectedDate, refreshTrigger, viewMode]);

  // List view: date range query
  useEffect(() => {
    if (!user || viewMode !== 'list') return;

    setListLoading(true);
    const { start, end } = getDateRange();

    const resQuery = query(
      collection(db, 'reservations'),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    );

    const evtQuery = query(
      collection(db, 'events'),
      where('date', '>=', start),
      where('date', '<=', end)
    );

    let resLoaded = false;
    let evtLoaded = false;

    const checkDone = () => {
      if (resLoaded && evtLoaded) setListLoading(false);
    };

    const unsubRes = onSnapshot(resQuery, (snapshot) => {
      const data: Reservation[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Reservation[];
      setListReservations(data);
      resLoaded = true;
      checkDone();
    }, () => { resLoaded = true; checkDone(); });

    const unsubEvt = onSnapshot(evtQuery, (snapshot) => {
      const data: ClubEvent[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as ClubEvent[];
      setListEvents(data);
      evtLoaded = true;
      checkDone();
    }, () => { evtLoaded = true; checkDone(); });

    return () => { unsubRes(); unsubEvt(); };
  }, [user, viewMode, rangePreset, customStart, customEnd, refreshTrigger]);

  // Group list data by date
  const groupedByDate = () => {
    const map = new Map<string, { reservations: Reservation[]; events: ClubEvent[] }>();

    if (!showEventsOnly) {
      listReservations.forEach((r) => {
        if (!map.has(r.date)) map.set(r.date, { reservations: [], events: [] });
        map.get(r.date)!.reservations.push(r);
      });
    }

    listEvents.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, { reservations: [], events: [] });
      map.get(e.date)!.events.push(e);
    });

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  };

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

  const getLocationDisplay = (r: Reservation) => {
    return r.location === '기타' && r.customLocation ? r.customLocation : r.location;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <Header />

      {/* Decorative header area */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-primary/8 to-accent/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-16 w-48 h-48 rounded-full bg-gradient-to-tr from-primary/6 to-transparent blur-2xl" />

        <div className="relative max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 pb-8">
          {/* View Toggle */}
          <div className="flex justify-center mb-6 animate-fade-in-up">
            <div className="inline-flex bg-secondary rounded-xl p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-gray-400 hover:text-foreground'
                }`}
              >
                <FiCalendar size={15} />
                달력
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-gray-400 hover:text-foreground'
                }`}
              >
                <FiList size={15} />
                목록
              </button>
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex justify-center mb-4 animate-fade-in-up animation-delay-50">
            <button
              onClick={() => setShowEventsOnly(!showEventsOnly)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                showEventsOnly
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-secondary hover:bg-gray-200 text-gray-500'
              }`}
            >
              <FiStar size={14} />
              행사만 보기
            </button>
          </div>

          {/* Header text */}
          <div className="text-center animate-fade-in-up animation-delay-100">
            {viewMode === 'calendar' ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  {format(selectedDate, 'M월 d일', { locale: ko })}
                  <span className="text-lg ml-2 font-medium" style={{ color: '#8b95a1' }}>
                    {format(selectedDate, 'EEEE', { locale: ko })}
                  </span>
                </h2>
                <p className="text-xs mt-1.5" style={{ color: '#b0b8c1' }}>
                  {format(selectedDate, 'yyyy년', { locale: ko })}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  예약 목록
                </h2>
                <p className="text-sm mt-1.5" style={{ color: '#8b95a1' }}>
                  기간별로 예약 현황을 한눈에 볼 수 있어요
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-5">

        {/* ===== CALENDAR VIEW ===== */}
        {viewMode === 'calendar' && (
          <>
            <div className="animate-scale-in mb-4">
              <ReservationCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>

            {showFormType === 'none' && (
              <div className="flex gap-3 mb-5 animate-fade-in-up animation-delay-200">
                <button
                  onClick={() => setShowFormType('reservation')}
                  className="flex-1 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[15px]"
                >
                  <FiPlus size={18} />
                  예약 등록하기
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setShowFormType('event')}
                    className="py-3.5 px-5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[15px]"
                  >
                    <FiStar size={18} />
                    행사
                  </button>
                )}
              </div>
            )}

            {showFormType === 'reservation' && (
              <div className="mb-5 animate-slide-down">
                <ReservationForm
                  onSuccess={handleFormSuccess}
                  onCancel={handleCancelForm}
                  editingReservation={editingReservation}
                  defaultDate={format(selectedDate, 'yyyy-MM-dd')}
                />
              </div>
            )}

            {showFormType === 'event' && (
              <div className="mb-5 animate-slide-down">
                <EventForm
                  onSuccess={handleFormSuccess}
                  onCancel={handleCancelForm}
                  editingEvent={editingEvent}
                  defaultDate={format(selectedDate, 'yyyy-MM-dd')}
                />
              </div>
            )}

            {(events.length > 0 || showEventsOnly) && (
              <div className="mb-5 animate-fade-in-up">
                <h3 className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
                  <FiStar className="text-orange-500" size={16} />
                  행사
                </h3>
                <EventList
                  events={events}
                  onEdit={handleEditEvent}
                  onDeleted={() => setRefreshTrigger((prev) => prev + 1)}
                  loading={eventsLoading}
                />
                {!eventsLoading && events.length === 0 && showEventsOnly && (
                  <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
                    <p className="text-sm font-medium text-foreground">이 날에는 행사가 없어요</p>
                    <p className="text-xs mt-1" style={{ color: '#8b95a1' }}>다른 날짜를 선택해보세요</p>
                  </div>
                )}
              </div>
            )}

            {!showEventsOnly && (
              <div className="animate-fade-in-up animation-delay-100">
                <h3 className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
                  예약 현황
                  <span className="text-primary text-sm font-medium">({reservations.length}건)</span>
                </h3>
                <ReservationList
                  reservations={reservations}
                  onEdit={handleEditReservation}
                  onDeleted={() => setRefreshTrigger((prev) => prev + 1)}
                  loading={loading}
                />
              </div>
            )}
          </>
        )}

        {/* ===== LIST VIEW ===== */}
        {viewMode === 'list' && (
          <div className="animate-fade-in-up">
            {/* Range Picker */}
            <div className="bg-white rounded-2xl p-4 mb-5 border border-gray-100">
              <div className="flex flex-wrap gap-2 mb-3">
                {([
                  { key: '1week' as RangePreset, label: '1주일' },
                  { key: '2weeks' as RangePreset, label: '2주일' },
                  { key: '1month' as RangePreset, label: '1개월' },
                  { key: 'custom' as RangePreset, label: '직접 선택' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setRangePreset(key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                      rangePreset === key
                        ? 'bg-foreground text-white'
                        : 'bg-secondary hover:bg-gray-200 text-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {rangePreset === 'custom' && (
                <div className="flex items-center gap-2 animate-slide-down">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  />
                  <span className="text-sm" style={{ color: '#8b95a1' }}>~</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    min={customStart}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  />
                </div>
              )}

              {rangePreset !== 'custom' && (
                <p className="text-xs" style={{ color: '#b0b8c1' }}>
                  {format(new Date(rangeStart), 'M월 d일', { locale: ko })} ~ {format(new Date(rangeEnd + 'T00:00:00'), 'M월 d일', { locale: ko })}
                </p>
              )}
            </div>

            {/* List Loading */}
            {listLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="shimmer-bg h-5 w-24 rounded-lg mb-3" />
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                      <div className="shimmer-bg h-4 w-40 rounded-lg" />
                      <div className="shimmer-bg h-4 w-28 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grouped Results */}
            {!listLoading && groupedByDate().length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 animate-fade-in-up">
                <img
                  src="/empty-calendar.svg"
                  alt=""
                  className="w-40 h-auto mx-auto mb-4 animate-float"
                />
                <p className="font-bold text-foreground text-[15px]">
                  {showEventsOnly ? '이 기간에는 행사가 없어요' : '이 기간에는 예약이 없어요'}
                </p>
                <p className="text-sm mt-1" style={{ color: '#8b95a1' }}>다른 기간을 선택해보세요</p>
              </div>
            )}

            {!listLoading && groupedByDate().map(([dateStr, data], groupIndex) => {
              const date = new Date(dateStr + 'T00:00:00');
              const isToday = isSameDay(date, new Date());

              return (
                <div
                  key={dateStr}
                  className="mb-6 animate-fade-in-up"
                  style={{ animationDelay: `${groupIndex * 0.05}s` }}
                >
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold ${
                      isToday ? 'bg-primary text-white' : 'bg-white border border-gray-100 text-foreground'
                    }`}>
                      <span>{format(date, 'M/d', { locale: ko })}</span>
                      <span className={`font-medium text-xs ${isToday ? 'text-blue-100' : ''}`} style={!isToday ? { color: '#8b95a1' } : undefined}>
                        {format(date, 'EEE', { locale: ko })}
                      </span>
                      {isToday && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md">오늘</span>}
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs font-medium" style={{ color: '#b0b8c1' }}>
                      {data.reservations.length + data.events.length}건
                    </span>
                  </div>

                  {/* Events for this date */}
                  {data.events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-2xl p-4 border border-gray-100 border-l-[3px] border-l-orange-400 mb-2 card-hover"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FiStar className="text-orange-500 shrink-0" size={13} />
                        <span className="text-sm font-bold text-foreground">{event.title}</span>
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md font-medium">행사</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: '#8b95a1' }}>
                        {(event.startTime || event.endTime) && (
                          <span className="flex items-center gap-1">
                            <FiClock size={11} />
                            {event.startTime || '미정'} ~ {event.endTime || '미정'}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <FiMapPin size={11} />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Reservations for this date */}
                  {data.reservations.map((reservation) => {
                    const isMine = user?.uid === reservation.userId;
                    return (
                      <div
                        key={reservation.id}
                        className={`bg-white rounded-2xl p-4 border border-gray-100 mb-2 card-hover ${
                          isMine ? 'border-l-[3px] border-l-primary' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-foreground">
                                {reservation.startTime} ~ {reservation.endTime}
                              </span>
                              {isMine && (
                                <span className="text-[10px] bg-primary/8 text-primary px-1.5 py-0.5 rounded-md font-medium">나</span>
                              )}
                              {reservation.repeatGroupId && (
                                <span className="text-[10px] bg-primary/8 text-primary px-1.5 py-0.5 rounded-md font-medium">반복</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs" style={{ color: '#8b95a1' }}>
                              <span className="flex items-center gap-1">
                                <FiMapPin size={11} />
                                {getLocationDisplay(reservation)}
                              </span>
                              <span>{reservation.userName}</span>
                            </div>
                            {reservation.purpose && (
                              <p className="text-xs mt-2 p-2 bg-secondary rounded-lg" style={{ color: '#4e5968' }}>
                                {reservation.purpose}
                              </p>
                            )}
                          </div>
                          {isMine && (
                            <div className="flex gap-1 ml-2 shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedDate(new Date(reservation.date + 'T00:00:00'));
                                  setViewMode('calendar');
                                  setTimeout(() => handleEditReservation(reservation), 100);
                                }}
                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/8 rounded-lg transition-colors"
                                title="수정"
                              >
                                <FiEdit2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
