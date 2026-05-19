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
    </div>
  );
}

function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
