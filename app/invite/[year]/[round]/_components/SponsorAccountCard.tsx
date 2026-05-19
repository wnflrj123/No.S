'use client';

import { useState } from 'react';
import type { SponsorAccount } from '@/lib/invites/types';

export default function SponsorAccountCard({ account }: { account: SponsorAccount }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 미지원 환경 — 사용자가 직접 선택해 복사하도록 둠
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm text-gray-500">{account.bankName}</div>
        <div className="text-base font-bold tracking-wide text-gray-900 break-all">
          {account.accountNumber}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">예금주: {account.accountHolder}</div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 text-sm px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        {copied ? '복사됨!' : '복사'}
      </button>
    </div>
  );
}
