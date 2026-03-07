'use client';

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
import { eachDayOfInterval, parse } from 'date-fns';
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

  useEffect(() => {
    setLoading(true);
    const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const reservationQuery = query(
      collection(db, 'reservations'),
      where('date', '>=', monthStart),
      where('date', '<=', monthEnd)
    );

    // 여러날 행사: date <= monthEnd이고, endDate >= monthStart이거나 date >= monthStart인 행사
    // Firestore 제약으로 date <= monthEnd만 쿼리하고 클라이언트에서 필터
    const eventQuery = query(
      collection(db, 'events'),
      where('date', '<=', monthEnd)
    );

    let reservationData: { [key: string]: number } = {};
    let eventData: { [key: string]: string } = {};
    let reservationLoaded = false;
    let eventLoaded = false;

    const updateDayData = () => {
      if (!reservationLoaded || !eventLoaded) return;

      const combined: DayDataMap = {};
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
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const eventStart = data.date;
          const eventEnd = data.endDate || data.date;

          // 이 달과 겹치지 않으면 스킵
          if (eventEnd < monthStart) return;

          // 여러날 행사: 각 날짜에 타이틀 매핑
          const rangeStart = eventStart < monthStart ? monthStart : eventStart;
          const rangeEnd = eventEnd > monthEnd ? monthEnd : eventEnd;

          try {
            const days = eachDayOfInterval({
              start: parse(rangeStart, 'yyyy-MM-dd', new Date()),
              end: parse(rangeEnd, 'yyyy-MM-dd', new Date()),
            });
            days.forEach((day) => {
              eventData[format(day, 'yyyy-MM-dd')] = data.title;
            });
          } catch {
            eventData[eventStart] = data.title;
          }
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

  const renderDays = () => {
    const days = [];
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={`weekday-${i}`}
          className={`text-center text-xs font-semibold py-2.5 ${
            i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : ''
          }`}
          style={{ color: i !== 0 && i !== 6 ? '#8b95a1' : undefined }}
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
        const hasBoth = data.hasEvent && data.reservationCount > 0 && isCurrentMonth;

        days.push(
          <div
            key={dateStr}
            onClick={() => isCurrentMonth && onDateSelect(cloneDay)}
            className={`
              flex flex-col min-h-[56px] p-1 transition-all rounded-xl m-0.5
              ${!isCurrentMonth ? 'text-gray-300 cursor-default' : 'cursor-pointer hover:bg-gray-100 active:scale-95'}
              ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : ''}
              ${isTodayDate && !isSelected ? 'bg-blue-50' : ''}
            `}
          >
            {/* 날짜 숫자 */}
            <div className="flex items-center gap-0.5">
              <span
                className={`
                  text-sm font-medium
                  ${!isCurrentMonth ? 'text-gray-300' : ''}
                  ${i === 0 && isCurrentMonth ? 'text-red-400' : ''}
                  ${i === 6 && isCurrentMonth ? 'text-blue-400' : ''}
                  ${isTodayDate ? 'text-primary font-bold' : ''}
                `}
              >
                {format(day, 'd')}
              </span>
              {isTodayDate && (
                <span className="text-[10px] text-primary font-bold">오늘</span>
              )}
            </div>

            {/* 뱃지 영역 */}
            <div className="flex-1 flex flex-col justify-end gap-[2px] mt-0.5 overflow-hidden">
              {isCurrentMonth && data.hasEvent && (
                <div className="bg-orange-400 text-white text-[10px] rounded-lg px-1 py-[1px] text-center truncate font-medium leading-tight">
                  {hasBoth ? <FiStar className="inline-block" size={9} /> : data.eventTitle}
                </div>
              )}
              {isCurrentMonth && data.reservationCount > 0 && (
                <div className="bg-primary text-white text-[10px] rounded-lg px-1 py-[1px] text-center font-medium leading-tight">
                  {data.reservationCount}건
                </div>
              )}
            </div>
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
    <div className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
        >
          <FiChevronLeft size={20} style={{ color: '#4e5968' }} />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs text-primary hover:underline mt-0.5 font-medium"
          >
            오늘로 이동
          </button>
        </div>

        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
        >
          <FiChevronRight size={20} style={{ color: '#4e5968' }} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-1">
        {renderDays()}
      </div>

      {/* Calendar Grid */}
      <div className={`${loading ? 'opacity-50' : ''} transition-opacity`}>
        {renderCells()}
      </div>

      {/* Selected date indicator (when viewing different month) */}
      {!isSameMonth(selectedDate, currentMonth) && (
        <button
          onClick={() => setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))}
          className="flex items-center justify-center gap-2 mt-3 mx-auto px-4 py-2 bg-primary/8 hover:bg-primary/15 rounded-xl transition-colors text-sm"
        >
          <div className="w-2 h-2 bg-primary rounded-full" />
          <span className="text-primary font-medium">
            선택된 날짜: {format(selectedDate, 'M월 d일 (EEE)', { locale: ko })}
          </span>
          <span className="text-xs" style={{ color: '#8b95a1' }}>
            이동 →
          </span>
        </button>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[11px] flex-wrap" style={{ color: '#8b95a1' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-blue-50 rounded" />
          <span>오늘</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-primary/10 ring-1 ring-primary rounded" />
          <span>선택</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-primary rounded" />
          <span>예약</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-orange-400 rounded" />
          <span>행사</span>
        </div>
      </div>
    </div>
  );
}
