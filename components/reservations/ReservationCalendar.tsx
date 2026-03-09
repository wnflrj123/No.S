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

type FilterMode = 'all' | 'events' | 'schedules' | 'reservations';

interface ReservationCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  filterMode?: FilterMode;
}

interface DayData {
  reservationCount: number;
  hasEvent: boolean;
  eventTitle?: string;
  scheduleCount: number;
  scheduleTitles: string[];
}

interface DayDataMap {
  [dateStr: string]: DayData;
}

interface EventSpan {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

export default function ReservationCalendar({
  selectedDate,
  onDateSelect,
  filterMode = 'all',
}: ReservationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayData, setDayData] = useState<DayDataMap>({});
  const [eventSpans, setEventSpans] = useState<EventSpan[]>([]);
  const [holidays, setHolidays] = useState<{ [date: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // 공휴일 조회
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;

    // 이번 달 + 전후 달 (캘린더에 다른 달 날짜도 보이므로)
    const months = [
      { y: month === 1 ? year - 1 : year, m: month === 1 ? 12 : month - 1 },
      { y: year, m: month },
      { y: month === 12 ? year + 1 : year, m: month === 12 ? 1 : month + 1 },
    ];

    Promise.all(
      months.map(({ y, m }) =>
        fetch(`/api/holidays?year=${y}&month=${m}`)
          .then((res) => res.json())
          .then((data) => data.holidays || {})
          .catch(() => ({}))
      )
    ).then(([prev, curr, next]) => {
      setHolidays({ ...prev, ...curr, ...next });
    });
  }, [currentMonth]);

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
    let scheduleData: { [key: string]: string[] } = {};
    let spans: EventSpan[] = [];
    let reservationLoaded = false;
    let eventLoaded = false;
    let scheduleLoaded = false;

    const updateDayData = () => {
      if (!reservationLoaded || !eventLoaded || !scheduleLoaded) return;

      const combined: DayDataMap = {};
      const allDates = new Set([...Object.keys(reservationData), ...Object.keys(eventData), ...Object.keys(scheduleData)]);

      allDates.forEach((date) => {
        combined[date] = {
          reservationCount: reservationData[date] || 0,
          hasEvent: !!eventData[date],
          eventTitle: eventData[date],
          scheduleCount: scheduleData[date]?.length || 0,
          scheduleTitles: scheduleData[date] || [],
        };
      });

      setDayData(combined);
      setEventSpans(spans);
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
        spans = [];
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const eventStart = data.date;
          const eventEnd = data.endDate || data.date;

          // 이 달과 겹치지 않으면 스킵
          if (eventEnd < monthStart) return;

          spans.push({ id: d.id, title: data.title, startDate: eventStart, endDate: eventEnd });

          // 여러날 행사: 각 날짜에 타이틀 매핑 (hasEvent 플래그용)
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

    const scheduleQuery = query(
      collection(db, 'schedules'),
      where('date', '>=', monthStart),
      where('date', '<=', monthEnd)
    );

    const unsubSchedules = onSnapshot(
      scheduleQuery,
      (snapshot) => {
        scheduleData = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const date = data.date;
          if (!scheduleData[date]) scheduleData[date] = [];
          scheduleData[date].push(data.title);
        });
        scheduleLoaded = true;
        updateDayData();
      },
      (error) => {
        console.error('정기 일정 조회 실패:', error);
        scheduleLoaded = true;
        updateDayData();
      }
    );

    return () => {
      unsubReservations();
      unsubEvents();
      unsubSchedules();
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
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const rows = [];
    let day = calStart;

    while (day <= calEnd) {
      const rowStartDate = new Date(day.getTime());
      const rowStartStr = format(rowStartDate, 'yyyy-MM-dd');
      const rowEndStr = format(addDays(rowStartDate, 6), 'yyyy-MM-dd');

      // 이 주에 걸치는 행사 계산
      const rowEvents = eventSpans.filter(
        (e) => e.startDate <= rowEndStr && e.endDate >= rowStartStr
      );
      // 각 날짜별 행사 목록 계산
      const dayEventsMap: { [dateStr: string]: EventSpan[] } = {};
      for (let i = 0; i < 7; i++) {
        const dStr = format(addDays(rowStartDate, i), 'yyyy-MM-dd');
        dayEventsMap[dStr] = rowEvents.filter((e) => e.startDate <= dStr && e.endDate >= dStr);
      }

      const dateCells = [];
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day.getTime());
        const dateStr = format(day, 'yyyy-MM-dd');
        const data = dayData[dateStr] || { reservationCount: 0, hasEvent: false, scheduleCount: 0, scheduleTitles: [] };
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);
        const holidayName = holidays[dateStr];
        const isHoliday = !!holidayName;
        const cellEvents = dayEventsMap[dateStr] || [];
        const eventCount = cellEvents.length;

        // 필터별 해당 날짜에 데이터가 있는지 판별
        const hasFilteredData = filterMode === 'all' ? true
          : filterMode === 'reservations' ? data.reservationCount > 0
          : filterMode === 'events' ? eventCount > 0
          : filterMode === 'schedules' ? data.scheduleCount > 0
          : true;
        const isDimmed = filterMode !== 'all' && isCurrentMonth && !hasFilteredData;

        // 여러날 행사가 1건만 있을 때 이어지는 스타일
        const singleMultiDay = eventCount === 1 && cellEvents[0].startDate !== cellEvents[0].endDate;
        const isEventStart = singleMultiDay && cellEvents[0].startDate === dateStr;
        const isEventEnd = singleMultiDay && cellEvents[0].endDate === dateStr;
        const isEventMid = singleMultiDay && !isEventStart && !isEventEnd;

        dateCells.push(
          <div
            key={dateStr}
            onClick={() => isCurrentMonth && onDateSelect(cloneDay)}
            className={`
              flex flex-col min-h-[60px] p-1 transition-all rounded-xl m-0.5
              ${!isCurrentMonth ? 'text-gray-300 cursor-default' : 'cursor-pointer hover:bg-gray-100 active:scale-95'}
              ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : ''}
              ${isTodayDate && !isSelected ? 'bg-blue-50' : ''}
              ${isDimmed ? 'opacity-30' : ''}
            `}
          >
            <div className="flex items-center gap-0.5">
              <span
                className={`
                  text-sm font-medium
                  ${!isCurrentMonth ? 'text-gray-300' : ''}
                  ${(i === 0 || (isHoliday && isCurrentMonth)) ? 'text-red-400' : ''}
                  ${i === 6 && isCurrentMonth && !isHoliday ? 'text-blue-400' : ''}
                  ${isTodayDate ? 'text-primary font-bold' : ''}
                `}
              >
                {format(day, 'd')}
              </span>
              {isTodayDate && (
                <span className="text-[10px] text-primary font-bold">오늘</span>
              )}
            </div>
            {isHoliday && isCurrentMonth && (
              <span className="text-[10px] text-red-400 font-medium leading-tight truncate">
                {holidayName}
              </span>
            )}

            <div className="flex-1 flex flex-col justify-end mt-0.5 gap-[3px]">
              {/* 예약 뱃지 */}
              {isCurrentMonth && data.reservationCount > 0 && filterMode !== 'events' && filterMode !== 'schedules' && (
                <div className="bg-primary text-white text-[11px] rounded-lg px-1.5 py-[2px] text-center font-medium leading-tight">
                  {data.reservationCount}건
                </div>
              )}

              {/* 행사 뱃지 */}
              {isCurrentMonth && eventCount > 0 && filterMode !== 'schedules' && filterMode !== 'reservations' && (
                singleMultiDay ? (
                  // 여러날 행사 1건: 셀 간 이어지는 스타일
                  <div
                    className={`bg-orange-400 text-white text-[11px] font-medium py-[3px] leading-tight flex items-center gap-0.5 truncate
                      ${isEventStart ? 'rounded-l-lg pl-1.5 -mr-[6px]' : ''}
                      ${isEventEnd ? 'rounded-r-lg pr-1.5 -ml-[6px]' : ''}
                      ${isEventMid ? '-mx-[6px]' : ''}
                    `}
                  >
                    {isEventStart && <FiStar size={9} className="shrink-0" />}
                    {isEventStart && <span className="truncate">{cellEvents[0].title}</span>}
                    {!isEventStart && <span className="invisible text-[11px]">.</span>}
                  </div>
                ) : (
                  // 단일 행사 또는 여러 건: 셀 내 뱃지
                  <div className="bg-orange-400 text-white text-[11px] rounded-lg px-1.5 py-[2px] text-center font-medium leading-tight flex items-center justify-center gap-0.5 truncate">
                    <FiStar size={9} className="shrink-0" />
                    <span className="truncate">{eventCount > 1 ? `${eventCount}건` : cellEvents[0].title}</span>
                  </div>
                )
              )}

              {/* 정기 일정 뱃지 */}
              {isCurrentMonth && data.scheduleCount > 0 && filterMode !== 'events' && filterMode !== 'reservations' && (
                <div className="bg-[#4eaea9] text-white text-[11px] rounded-lg px-1.5 py-[2px] text-center font-medium leading-tight truncate">
                  {data.scheduleCount === 1 ? data.scheduleTitles[0] : `정기 ${data.scheduleCount}`}
                </div>
              )}
            </div>
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div key={`row-${rowStartStr}`} className="grid grid-cols-7">
          {dateCells}
        </div>
      );
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
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-[#4eaea9] rounded" />
          <span>정기</span>
        </div>
      </div>
    </div>
  );
}
