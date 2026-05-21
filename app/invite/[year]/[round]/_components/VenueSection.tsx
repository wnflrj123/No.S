import type { Venue } from '@/lib/invites/types';

// 지도 임베드를 허용할 신뢰 호스트 화이트리스트
const ALLOWED_MAP_HOSTS = [
  'www.google.com',
  'maps.google.com',
  'map.naver.com',
  'pcmap.place.naver.com',
  'map.kakao.com',
  'place.map.kakao.com',
];

function isSafeEmbedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    return ALLOWED_MAP_HOSTS.some(h => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export default function VenueSection({ venue }: { venue: Venue }) {
  const { mapLinks } = venue;
  const hasMap = mapLinks.naver || mapLinks.kakao || mapLinks.google;
  const showEmbed = venue.mapEmbedUrl && isSafeEmbedUrl(venue.mapEmbedUrl);

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
      {showEmbed && (
        <div className="mt-4 mx-auto max-w-xl rounded-xl overflow-hidden border border-gray-200 aspect-[16/9] bg-gray-100">
          <iframe
            src={venue.mapEmbedUrl}
            title={`${venue.name} 지도`}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      )}
      {hasMap && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
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
