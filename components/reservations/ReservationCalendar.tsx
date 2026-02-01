'use client';

/**
 * 예약 캘린더 컴포넌트
 */

import { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';

interface ReservationCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

interface DayData {
  reservationCount: number;
  hasEvent: boolean;
  eventTitle?: string;
}

interface DayDataMap {
  [dateStr: string]: DayData;
}

export default function ReservationCalendar({
  selectedDate,
  onDateSelect,
}: ReservationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayData, setDayData] = useState<DayDataMap>({});
  const [loading, setLoading] = useState(true);

  // 해당 월의 예약 및 행사 실시간 조회
  useEffect(() => {
    setLoading(true);
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    // 예약 쿼리
    const reservationQuery = query(
      collection(db, 'reservations'),
      where('date', '>=', monthStart),
      where('date', '<=', monthEnd)
    );

    // 행사 쿼리
    const eventQuery = query(
      collection(db, 'events'),
      where('date', '>=', monthStart),
      where('date', '<=', monthEnd)
    );

    let reservationData: { [key: string]: number } = {};
    let eventData: { [key: string]: string } = {};
    let reservationLoaded = false;
    let eventLoaded = false;

    const updateDayData = () => {
      if (!reservationLoaded || !eventLoaded) return;

      const combined: DayDataMap = {};

      // 모든 날짜 합치기
      const allDates = new Set([...Object.keys(reservationData), ...Object.keys(eventData)]);

      allDates.forEach((date) => {
        combined[date] = {
          reservationCount: reservationData[date] || 0,
          hasEvent: !!eventData[date],
          eventTitle: eventData[date],
        };
      });

      setDayData(combined);
      setLoading(false);
    };

    const unsubReservations = onSnapshot(
      reservationQuery,
      (snapshot) => {
        reservationData = {};
        snapshot.docs.forEach((doc) => {
          const date = doc.data().date;
          reservationData[date] = (reservationData[date] || 0) + 1;
        });
        reservationLoaded = true;
        updateDayData();
      },
      (error) => {
        console.error('예약 조회 실패:', error);
        reservationLoaded = true;
        updateDayData();
      }
    );

    const unsubEvents = onSnapshot(
      eventQuery,
      (snapshot) => {
        eventData = {};
        snapshot.docs.forEach((doc) => {
          const date = doc.data().date;
          eventData[date] = doc.data().title;
        });
        eventLoaded = true;
        updateDayData();
      },
      (error) => {
        console.error('행사 조회 실패:', error);
        eventLoaded = true;
        updateDayData();
      }
    );

    return () => {
      unsubReservations();
      unsubEvents();
    };
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    onDateSelect(new Date());
  };

  // 달력 요일 헤더
  const renderDays = () => {
    const days = [];
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={`weekday-${i}`}
          className={`text-center text-sm font-medium py-2 ${
            i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
          }`}
        >
          {weekDays[i]}
        </div>
      );
    }

    return days;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day.getTime());
        const dateStr = format(day, 'yyyy-MM-dd');
        const data = dayData[dateStr] || { reservationCount: 0, hasEvent: false };
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);

        days.push(
          <div
            key={dateStr}
            onClick={() => isCurrentMonth && onDateSelect(cloneDay)}
            className={`
              relative min-h-[60px] p-1 cursor-pointer transition-all
              ${!isCurrentMonth ? 'bg-gray-50 text-gray-300 cursor-default border border-gray-100' : 'hover:bg-blue-50 border border-gray-100'}
              ${isSelected ? 'bg-primary/10 border-2 border-primary' : ''}
              ${isTodayDate && !isSelected ? 'bg-yellow-50' : ''}
              ${data.hasEvent && isCurrentMonth && !isSelected ? 'border-2 border-orange-400' : ''}
            `}
          >
            <div className="flex items-center gap-1">
              <span
                className={`
                  text-sm font-medium
                  ${i === 0 && isCurrentMonth ? 'text-red-500' : ''}
                  ${i === 6 && isCurrentMonth ? 'text-blue-500' : ''}
                  ${isTodayDate ? 'text-primary font-bold' : ''}
                `}
              >
                {format(day, 'd')}
              </span>
              {isTodayDate && (
                <span className="text-xs text-primary">오늘</span>
              )}
              {/* 행사 아이콘 */}
              {data.hasEvent && isCurrentMonth && (
                <FiStar className="text-orange-500 fill-orange-500" size={12} />
              )}
            </div>

            {/* 예약 건수 또는 행사 표시 */}
            {isCurrentMonth && (data.reservationCount > 0 || data.hasEvent) && (
              <div className="absolute bottom-1 left-1 right-1 space-y-0.5">
                {data.hasEvent && (
                  <div className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 text-center truncate">
                    {data.eventTitle}
                  </div>
                )}
                {data.reservationCount > 0 && (
                  <div className="bg-primary text-white text-xs rounded-full px-2 py-0.5 text-center">
                    {data.reservationCount}건
                  </div>
                )}
              </div>
            )}
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div key={`row-${day}`} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return rows;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiChevronLeft size={24} />
        </button>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h2>
          <button
            onClick={goToToday}
            className="text-sm text-primary hover:underline mt-1"
          >
            오늘로 이동
          </button>
        </div>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiChevronRight size={24} />
        </button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 border-b border-gray-200 mb-2">
        {renderDays()}
      </div>

      {/* 날짜 */}
      <div className={`${loading ? 'opacity-50' : ''}`}>
        {renderCells()}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded"></div>
          <span>오늘</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary/10 border-2 border-primary rounded"></div>
          <span>선택됨</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary rounded"></div>
          <span>예약</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>행사</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-orange-400 rounded"></div>
          <span>행사일</span>
        </div>
      </div>
    </div>
  );
}
