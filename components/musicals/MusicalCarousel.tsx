'use client';

import { useRef, useEffect } from 'react';
import { Musical } from '@/types';
import MusicalCard from './MusicalCard';
import { FiPlus } from 'react-icons/fi';

interface MusicalCarouselProps {
  musicals: Musical[];
  selectedId: string | null;
  variant: 'large' | 'mini';
  onSelect: (musical: Musical) => void;
  showAddCard?: boolean;
  onAdd?: () => void;
}

export default function MusicalCarousel({
  musicals,
  selectedId,
  variant,
  onSelect,
  showAddCard,
  onAdd,
}: MusicalCarouselProps) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId || !scrollContainerRef.current) return;
    const cardEl = cardRefs.current.get(selectedId);
    const container = scrollContainerRef.current;
    if (cardEl && container) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = cardEl.getBoundingClientRect();
      const scrollLeft =
        container.scrollLeft +
        cardRect.left -
        containerRect.left -
        (containerRect.width - cardRect.width) / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedId]);

  const addCardHeight = variant === 'large' ? 'w-48 sm:w-56' : 'w-20 sm:w-24';

  return (
    <div
      ref={scrollContainerRef}
      className="flex justify-center gap-3 overflow-x-auto pb-2 pt-1"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* Admin 전용 + 카드 (맨 왼쪽) */}
      {showAddCard && (
        <button
          onClick={onAdd}
          className={`relative flex-shrink-0 ${addCardHeight} rounded-2xl border-2 border-dashed border-primary/30 bg-primary/4 hover:bg-primary/8 hover:border-primary/50 transition-all duration-200 active:scale-[0.97] flex flex-col items-center justify-center gap-2 cursor-pointer`}
          style={{ aspectRatio: '2/3' }}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FiPlus size={variant === 'large' ? 20 : 14} className="text-primary" />
          </div>
          {variant === 'large' && (
            <span className="text-xs font-medium text-primary/70 text-center px-2 leading-tight">
              신규 등록
            </span>
          )}
        </button>
      )}

      {/* 작품 카드 목록 */}
      {musicals.map((musical) => (
        <div
          key={musical.id}
          ref={(el) => {
            if (el) cardRefs.current.set(musical.id, el);
          }}
        >
          <MusicalCard
            musical={musical}
            variant={variant}
            selected={selectedId === musical.id}
            onClick={() => onSelect(musical)}
          />
        </div>
      ))}
    </div>
  );
}
