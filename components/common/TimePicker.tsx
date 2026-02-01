'use client';

/**
 * 시간 선택 컴포넌트
 * 시간(hour)과 분(minute)을 분리하여 선택 가능
 */

import { useState, useRef, useEffect } from 'react';
import { FiClock, FiChevronLeft } from 'react-icons/fi';

interface TimePickerProps {
  value: string; // HH:mm 형식
  onChange: (time: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  allowEmpty?: boolean; // 빈 값 허용 여부
  accentColor?: 'primary' | 'orange'; // 강조 색상
}

// 시간 옵션 (0-23)
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// 분 옵션 (10분 단위)
const MINUTES = [0, 10, 20, 30, 40, 50];

export default function TimePicker({
  value,
  onChange,
  placeholder = '시간 선택',
  required = false,
  className = '',
  allowEmpty = false,
  accentColor = 'primary',
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [view, setView] = useState<'hour' | 'minute'>('hour');
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 값에서 시간/분 추출
  const currentHour = value ? parseInt(value.split(':')[0], 10) : null;
  const currentMinute = value ? parseInt(value.split(':')[1], 10) : null;

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setView('hour');
        setSelectedHour(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setView('hour');
    setSelectedHour(currentHour);
  };

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
    setView('minute');
  };

  const handleMinuteSelect = (minute: number) => {
    if (selectedHour !== null) {
      const hourStr = selectedHour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      onChange(`${hourStr}:${minuteStr}`);
    }
    setIsOpen(false);
    setView('hour');
    setSelectedHour(null);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setView('hour');
    setSelectedHour(null);
  };

  const handleBackToHour = () => {
    setView('hour');
  };

  const accentClasses = {
    primary: {
      ring: 'focus:ring-primary',
      bg: 'bg-primary',
      bgHover: 'hover:bg-primary/10',
      text: 'text-primary',
    },
    orange: {
      ring: 'focus:ring-orange-400',
      bg: 'bg-orange-500',
      bgHover: 'hover:bg-orange-50',
      text: 'text-orange-500',
    },
  };

  const colors = accentClasses[accentColor];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 입력 필드 */}
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ${colors.ring} focus:border-transparent text-left flex items-center justify-between bg-white`}
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {value || placeholder}
        </span>
        <FiClock className="text-gray-400" size={18} />
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
            {view === 'minute' ? (
              <button
                type="button"
                onClick={handleBackToHour}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <FiChevronLeft size={16} />
                <span>{selectedHour?.toString().padStart(2, '0')}시</span>
              </button>
            ) : (
              <span className="text-sm font-medium text-gray-700">시간 선택</span>
            )}
            {allowEmpty && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                미정
              </button>
            )}
          </div>

          {/* 시간 선택 */}
          {view === 'hour' && (
            <div className="p-2 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-4 gap-1">
                {HOURS.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => handleHourSelect(hour)}
                    className={`px-2 py-2 text-sm rounded-lg transition-colors ${
                      hour === currentHour
                        ? `${colors.bg} text-white`
                        : `hover:bg-gray-100 text-gray-700`
                    }`}
                  >
                    {hour.toString().padStart(2, '0')}시
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 분 선택 */}
          {view === 'minute' && (
            <div className="p-2">
              <div className="grid grid-cols-3 gap-1">
                {MINUTES.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => handleMinuteSelect(minute)}
                    className={`px-3 py-3 text-sm rounded-lg transition-colors ${
                      selectedHour === currentHour && minute === currentMinute
                        ? `${colors.bg} text-white`
                        : `hover:bg-gray-100 text-gray-700`
                    }`}
                  >
                    {minute.toString().padStart(2, '0')}분
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
