'use client';

import type { Venue } from '@/lib/invites/types';

interface Props {
  value: Venue;
  onChange: (next: Venue) => void;
}

export default function VenueEditor({ value, onChange }: Props) {
  const update = (patch: Partial<Venue>) => onChange({ ...value, ...patch });
  const updateMap = (patch: Partial<Venue['mapLinks']>) =>
    onChange({ ...value, mapLinks: { ...value.mapLinks, ...patch } });

  return (
    <div className="space-y-3">
      <FieldRow label="공연장명" required>
        <input
          type="text"
          value={value.name}
          onChange={e => update({ name: e.target.value })}
          required
          maxLength={80}
          className="input"
        />
      </FieldRow>
      <FieldRow label="주소" required>
        <input
          type="text"
          value={value.address}
          onChange={e => update({ address: e.target.value })}
          required
          maxLength={200}
          className="input"
        />
      </FieldRow>
      <FieldRow label="오시는 길">
        <textarea
          value={value.directions}
          onChange={e => update({ directions: e.target.value })}
          rows={3}
          maxLength={1000}
          className="input"
          placeholder="대중교통, 주차 안내 등"
        />
      </FieldRow>
      <div className="pt-2">
        <p className="text-sm font-medium text-gray-700 mb-2">지도 링크 (선택)</p>
        <div className="grid sm:grid-cols-3 gap-2">
          <input
            type="url"
            value={value.mapLinks.naver ?? ''}
            onChange={e => updateMap({ naver: e.target.value || undefined })}
            placeholder="네이버지도 URL"
            className="input"
          />
          <input
            type="url"
            value={value.mapLinks.kakao ?? ''}
            onChange={e => updateMap({ kakao: e.target.value || undefined })}
            placeholder="카카오맵 URL"
            className="input"
          />
          <input
            type="url"
            value={value.mapLinks.google ?? ''}
            onChange={e => updateMap({ google: e.target.value || undefined })}
            placeholder="구글맵 URL"
            className="input"
          />
        </div>
      </div>
      <FieldRow
        label="지도 임베드 URL (선택)"
        hint="구글/네이버/카카오 지도에서 '공유 → 퍼가기'로 복사한 iframe src URL. 입력하면 페이지에 지도가 직접 표시됩니다."
      >
        <input
          type="url"
          value={value.mapEmbedUrl ?? ''}
          onChange={e => update({ mapEmbedUrl: e.target.value || undefined })}
          placeholder="https://www.google.com/maps/embed?pb=..."
          className="input"
        />
      </FieldRow>
    </div>
  );
}

function FieldRow({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
