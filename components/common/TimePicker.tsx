'use client';

import { useState, useRef, useEffect } from 'react';
import { FiClock, FiChevronLeft } from 'react-icons/fi';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  allowEmpty?: boolean;
  accentColor?: 'primary' | 'orange' | 'green';
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 10, 20, 30, 40, 50];

export default function TimePicker({
  value,
  onChange,
  placeholder = '시간 선택',
  required = false,
  className = '',
  allowEmpty = false,
  accentColor = 'primary',
  disabled = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [view, setView] = useState<'hour' | 'minute'>('hour');
  const containerRef = useRef<HTMLDivElement>(null);

  const currentHour = value ? parseInt(value.split(':')[0], 10) : null;
  const currentMinute = value ? parseInt(value.split(':')[1], 10) : null;

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
    },
    orange: {
      ring: 'focus:ring-orange-400',
      bg: 'bg-orange-400',
    },
    green: {
      ring: 'focus:ring-[#4eaea9]',
      bg: 'bg-[#4eaea9]',
    },
  };

  const colors = accentClasses[accentColor];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={disabled ? undefined : handleOpen}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 ${colors.ring} focus:border-transparent text-left flex items-center justify-between text-sm ${disabled ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-white'}`}
      >
        <span style={{ color: disabled ? '#d1d5db' : value ? undefined : '#8b95a1' }}>
          {value || placeholder}
        </span>
        <FiClock size={16} style={{ color: disabled ? '#d1d5db' : '#b0b8c1' }} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 bg-secondary border-b border-gray-100">
            {view === 'minute' ? (
              <button
                type="button"
                onClick={handleBackToHour}
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: '#4e5968' }}
              >
                <FiChevronLeft size={14} />
                <span>{selectedHour?.toString().padStart(2, '0')}시</span>
              </button>
            ) : (
              <span className="text-xs font-semibold" style={{ color: '#8b95a1' }}>시간 선택</span>
            )}
            {allowEmpty && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium"
                style={{ color: '#8b95a1' }}
              >
                미정
              </button>
            )}
          </div>

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
                        ? `${colors.bg} text-white font-medium`
                        : 'hover:bg-gray-100'
                    }`}
                    style={{ color: hour !== currentHour ? '#4e5968' : undefined }}
                  >
                    {hour.toString().padStart(2, '0')}시
                  </button>
                ))}
              </div>
            </div>
          )}

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
                        ? `${colors.bg} text-white font-medium`
                        : 'hover:bg-gray-100'
                    }`}
                    style={{ color: !(selectedHour === currentHour && minute === currentMinute) ? '#4e5968' : undefined }}
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
