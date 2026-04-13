import { Musical } from '@/types';

interface MusicalCardProps {
  musical: Musical;
  variant: 'large' | 'mini';
  selected?: boolean;
  onClick: () => void;
}

export default function MusicalCard({ musical, variant, selected, onClick }: MusicalCardProps) {
  if (variant === 'large') {
    return (
      <button
        onClick={onClick}
        className={`relative flex-shrink-0 w-48 sm:w-56 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.97] card-hover ${
          selected ? 'ring-2 ring-primary shadow-lg' : ''
        }`}
        style={{ aspectRatio: '2/3' }}
      >
        {/* 포스터 이미지 */}
        {musical.imageUrl ? (
          <img
            src={musical.imageUrl}
            alt={musical.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <span className="text-primary/60 text-4xl font-bold">
              {musical.name.charAt(0)}
            </span>
          </div>
        )}

        {/* 하단 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* 작품명 */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-sm leading-tight line-clamp-2">
            {musical.name}
          </p>
        </div>
      </button>
    );
  }

  // mini variant
  return (
    <button
      onClick={onClick}
      className={`relative flex-shrink-0 w-20 sm:w-24 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.97] card-hover ${
        selected ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
      }`}
      style={{ aspectRatio: '2/3' }}
    >
      {/* 포스터 이미지 */}
      {musical.imageUrl ? (
        <img
          src={musical.imageUrl}
          alt={musical.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <span className="text-primary/60 text-xl font-bold">
            {musical.name.charAt(0)}
          </span>
        </div>
      )}

      {/* 하단 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* 작품명 */}
      <div className="absolute bottom-0 left-0 right-0 p-1.5">
        <p className="text-white font-semibold text-[10px] leading-tight line-clamp-2">
          {musical.name}
        </p>
      </div>
    </button>
  );
}
