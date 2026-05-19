'use client';

import type { SponsorAccount } from '@/lib/invites/types';

interface Props {
  value: SponsorAccount;
  onChange: (next: SponsorAccount) => void;
}

export default function SponsorAccountEditor({ value, onChange }: Props) {
  const update = (patch: Partial<SponsorAccount>) => onChange({ ...value, ...patch });

  return (
    <div className="grid sm:grid-cols-3 gap-2">
      <input
        type="text"
        value={value.bankName}
        onChange={e => update({ bankName: e.target.value })}
        placeholder="은행명"
        maxLength={20}
        className="input"
        required
      />
      <input
        type="text"
        value={value.accountNumber}
        onChange={e => update({ accountNumber: e.target.value })}
        placeholder="계좌번호"
        maxLength={40}
        className="input"
        required
      />
      <input
        type="text"
        value={value.accountHolder}
        onChange={e => update({ accountHolder: e.target.value })}
        placeholder="예금주"
        maxLength={40}
        className="input"
        required
      />
    </div>
  );
}
