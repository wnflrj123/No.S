import type { Venue } from '@/lib/invites/types';

export default function VenueSection({ venue }: { venue: Venue }) {
  const { mapLinks } = venue;
  const hasMap = mapLinks.naver || mapLinks.kakao || mapLinks.google;

  return (
    <section className="px-5 py-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">장소</h2>
      <div className="text-base font-semibold text-gray-900">{venue.name}</div>
      <div className="text-sm text-gray-600 mt-1">{venue.address}</div>
      {venue.directions?.trim() && (
        <p className="text-sm text-gray-700 mt-3 whitespace-pre-line leading-relaxed">
          {venue.directions}
        </p>
      )}
      {hasMap && (
        <div className="flex flex-wrap gap-2 mt-4">
          {mapLinks.naver && <MapButton href={mapLinks.naver} label="네이버지도" color="#03C75A" />}
          {mapLinks.kakao && (
            <MapButton href={mapLinks.kakao} label="카카오맵" color="#FEE500" textColor="#191919" />
          )}
          {mapLinks.google && <MapButton href={mapLinks.google} label="구글맵" color="#4285F4" />}
        </div>
      )}
    </section>
  );
}

function MapButton({
  href,
  label,
  color,
  textColor = '#ffffff',
}: {
  href: string;
  label: string;
  color: string;
  textColor?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="px-4 py-2 rounded-lg text-sm font-medium"
      style={{ background: color, color: textColor }}
    >
      {label}
    </a>
  );
}
