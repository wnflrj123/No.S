'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { db } from '@/lib/firebase';
import {
  REGISTRATIONS_COLLECTION,
  SUPPORTERS_COLLECTION,
  MAX_NAME_LENGTH,
} from '@/lib/invites/constants';
import type { InviteRegistration, InviteSupporter, SponsorAccount } from '@/lib/invites/types';
import SponsorAccountCard from './SponsorAccountCard';

interface SupporterEntry {
  id: string;
  name: string;
  source: 'registration' | 'wall';
  createdAtMs: number;
}

interface Props {
  year: number;
  round: number;
  inviteId: string;
  title: string;
  overline?: string;
  sponsorAccount: SponsorAccount;
}

const CONFETTI_COLORS = [
  '#0066B3', '#3a8fd6', '#ffd700', '#ff6b6b', '#ff85a2',
  '#a8e6cf', '#fff', '#ffb347', '#c084fc', '#34d399',
  '#f472b6', '#facc15',
];

function celebrateNewSupporter(name: string) {
  const burst = (opts: confetti.Options) =>
    confetti({ colors: CONFETTI_COLORS, ...opts, zIndex: 60 });

  burst({ particleCount: 180, spread: 90, origin: { y: 0.55 }, startVelocity: 65 });
  setTimeout(() => burst({ particleCount: 120, angle: 60, spread: 80, origin: { x: 0, y: 0.7 } }), 120);
  setTimeout(() => burst({ particleCount: 120, angle: 120, spread: 80, origin: { x: 1, y: 0.7 } }), 120);
  setTimeout(() => burst({ particleCount: 100, spread: 120, startVelocity: 55, origin: { y: 0.3 }, scalar: 1.2 }), 300);

  try {
    const bouquet = confetti.shapeFromText({ text: '💐', scalar: 3 });
    const heart = confetti.shapeFromText({ text: '💝', scalar: 2.5 });
    setTimeout(() => {
      confetti({
        shapes: [bouquet, heart],
        scalar: 3,
        particleCount: 25,
        spread: 140,
        startVelocity: 35,
        gravity: 0.6,
        ticks: 300,
        origin: { y: 0.2 },
        zIndex: 60,
      });
    }, 200);
  } catch {
    // 미지원 브라우저는 polygon confetti만
  }

  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate([60, 30, 60]); } catch { /* noop */ }
  }
  // name은 시그니처 호환용 — 추후 이름 강조 효과에 활용 가능
  void name;
}

export default function SupporterWall(p: Props) {
  const [registrationSponsors, setRegistrationSponsors] = useState<SupporterEntry[]>([]);
  const [wallSupporters, setWallSupporters] = useState<SupporterEntry[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  // 1) 신청자 중 후원 체크한 사람 실시간 구독
  useEffect(() => {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('inviteId', '==', p.inviteId),
      where('isSponsor', '==', true),
    );
    const unsub = onSnapshot(q, snap => {
      const list: SupporterEntry[] = [];
      for (const d of snap.docs) {
        const data = d.data() as Omit<InviteRegistration, 'id'>;
        const status = data.status ?? 'active';
        if (status !== 'active') continue;
        list.push({
          id: `r:${d.id}`,
          name: data.name,
          source: 'registration',
          createdAtMs: data.sponsorCheckedAt?.toMillis?.() ?? data.createdAt.toMillis(),
        });
      }
      setRegistrationSponsors(list);
    });
    return () => unsub();
  }, [p.inviteId]);

  // 2) wall-only supporter 실시간 구독
  useEffect(() => {
    const q = query(
      collection(db, SUPPORTERS_COLLECTION),
      where('inviteId', '==', p.inviteId),
    );
    const unsub = onSnapshot(q, snap => {
      const list: SupporterEntry[] = snap.docs.map(d => {
        const data = d.data() as Omit<InviteSupporter, 'id'>;
        return {
          id: `s:${d.id}`,
          name: data.name,
          source: 'wall' as const,
          createdAtMs: data.createdAt?.toMillis?.() ?? 0,
        };
      });
      setWallSupporters(list);
    });
    return () => unsub();
  }, [p.inviteId]);

  // 합쳐서 정렬 + 새 인원 등장 감지
  const allSupporters = useMemo(() => {
    const merged = [...registrationSponsors, ...wallSupporters].sort(
      (a, b) => b.createdAtMs - a.createdAtMs,
    );
    return merged;
  }, [registrationSponsors, wallSupporters]);

  // 첫 로드 후 새 supporter 추가 감지 → 폭죽 + 강조
  useEffect(() => {
    if (!initialized.current) {
      // 첫 스냅샷은 기존 명단 — 효과 없이 등록만
      allSupporters.forEach(s => knownIds.current.add(s.id));
      if (allSupporters.length > 0) initialized.current = true;
      // 빈 명단이어도 다음 변화부터 신규로 인식
      else initialized.current = true;
      return;
    }
    const newOnes = allSupporters.filter(s => !knownIds.current.has(s.id));
    if (newOnes.length === 0) return;
    newOnes.forEach(s => knownIds.current.add(s.id));
    // 가장 최신 1명 강조
    const latest = newOnes[0];
    setRecentlyAdded(latest.id);
    celebrateNewSupporter(latest.name);
    const t = setTimeout(() => setRecentlyAdded(null), 4500);
    return () => clearTimeout(t);
  }, [allSupporters]);

  return (
    <main className="relative min-h-dvh overflow-hidden text-white thanks-bg flex flex-col">
      <WallPetals />
      <WallFlowers />

      <header className="relative z-10 px-6 pt-10 pb-6 text-center">
        {p.overline?.trim() && (
          <div className="text-sm sm:text-base md:text-lg font-semibold text-white/90 mb-3 drop-shadow">
            {p.overline}
          </div>
        )}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-2xl thanks-headline">
          💐 응원해주신 분들 💐
        </h1>
        <p className="mt-3 text-base sm:text-lg md:text-xl text-white/90 drop-shadow">
          {p.title} — 함께해주신 모든 분께 진심으로 감사드립니다.
        </p>
      </header>

      <section className="relative z-10 flex-1 px-4 sm:px-8 pb-32">
        {allSupporters.length === 0 ? (
          <p className="text-center text-white/80 mt-20 text-lg">
            아직 응원해주신 분이 없어요. 첫 응원을 기다리고 있습니다 💛
          </p>
        ) : (
          <ul className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-6xl mx-auto">
            {allSupporters.map(s => (
              <li
                key={s.id}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/95 text-gray-900 font-semibold text-base sm:text-lg shadow-lg backdrop-blur-sm ${
                  s.id === recentlyAdded
                    ? 'ring-4 ring-yellow-300 scale-110 transition-transform'
                    : 'transition-transform'
                }`}
              >
                💛 {s.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="fixed bottom-0 inset-x-0 z-20 p-4 sm:p-6 flex justify-center pointer-events-none">
        <button
          type="button"
          onClick={() => setShowSendModal(true)}
          className="pointer-events-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#0066B3] rounded-full font-bold text-base sm:text-lg shadow-2xl hover:bg-yellow-50 transition-colors"
        >
          💐 응원 꽃다발 보내기
        </button>
      </div>

      {showSendModal && (
        <SendBouquetModal
          year={p.year}
          round={p.round}
          sponsorAccount={p.sponsorAccount}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </main>
  );
}

function SendBouquetModal({
  year,
  round,
  sponsorAccount,
  onClose,
}: {
  year: number;
  round: number;
  sponsorAccount: SponsorAccount;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(`이름은 ${MAX_NAME_LENGTH}자 이내로 입력해주세요.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invites/${year}/${round}/supporter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.message ?? '저장에 실패했습니다.');
        return;
      }
      // onSnapshot이 곧 화면을 갱신하고 폭죽도 자동 발사됨
      onClose();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white text-gray-900 rounded-2xl max-w-md w-full p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-900">💐 응원 꽃다발 보내기</h4>
          <button onClick={onClose} className="text-gray-400 text-lg" aria-label="닫기">✕</button>
        </div>

        <p className="text-sm text-gray-600">
          아래 계좌로 응원을 보내주시고, 이름을 입력해주시면 응원해주신 분 명단에 표시됩니다.
        </p>

        <div className="mt-3">
          <SponsorAccountCard account={sponsorAccount} />
        </div>

        <label className="block mt-4">
          <span className="text-sm font-medium text-gray-700">이름 또는 닉네임</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            placeholder="예: 김응원"
            className="input mt-1"
            autoFocus
          />
        </label>

        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <button
          type="button"
          onClick={handleSend}
          disabled={submitting}
          className="mt-4 w-full py-3 bg-[#0066B3] text-white rounded-xl font-semibold disabled:bg-gray-300"
        >
          {submitting ? '보내는 중…' : '꽃다발 보냈어요! 💐'}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          입력하신 이름은 응원해주신 분 명단에 즉시 표시됩니다.
        </p>
      </div>
    </div>
  );
}

/** wall 전용 꽃잎 (ThanksContent의 PetalRain과 동일 패턴) */
function WallPetals() {
  const petals = Array.from({ length: 28 }, (_, i) => i);
  const colors = ['#ffc1d6', '#ffd6e7', '#ff9bb3', '#ffe9a8', '#fff', '#ffb3c6', '#d8b4fe'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {petals.map(i => {
        const left = (i * 3.57) % 100;
        const drift = (i % 2 === 0 ? 1 : -1) * (60 + ((i * 13) % 140));
        const dur = 9 + ((i * 5) % 10);
        const delay = (i * 0.6) % 10;
        const color = colors[i % colors.length];
        const size = 16 + (i % 5) * 4;
        return (
          <span
            key={i}
            className="petal"
            style={
              {
                left: `${left}%`,
                ['--drift' as string]: `${drift}px`,
                ['--dur' as string]: `${dur}s`,
                ['--delay' as string]: `${delay}s`,
              } as React.CSSProperties
            }
          >
            <svg
              width={size}
              height={Math.round(size * 1.4)}
              viewBox="0 0 20 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 0.5 C 15.5 7 18 14 15 22 C 13 26 11 27.5 10 27.5 C 9 27.5 7 26 5 22 C 2 14 4.5 7 10 0.5 Z"
                fill={color}
              />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

/** wall 전용 날아다니는 꽃다발 */
function WallFlowers() {
  const items = [
    { dir: 'lr' as const, startY: '20vh', midY: '5vh', endY: '40vh', dur: 11, delay: 0, paletteIdx: 0, size: 110 },
    { dir: 'rl' as const, startY: '55vh', midY: '15vh', endY: '65vh', dur: 13, delay: 2, paletteIdx: 1, size: 120 },
    { dir: 'lr' as const, startY: '75vh', midY: '40vh', endY: '15vh', dur: 14, delay: 4, paletteIdx: 2, size: 100 },
    { dir: 'rl' as const, startY: '30vh', midY: '55vh', endY: '20vh', dur: 12, delay: 6, paletteIdx: 3, size: 110 },
    { dir: 'lr' as const, startY: '45vh', midY: '25vh', endY: '60vh', dur: 13, delay: 8, paletteIdx: 4, size: 115 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {items.map((it, i) => (
        <span
          key={i}
          className={it.dir === 'lr' ? 'flower-fly-lr' : 'flower-fly-rl'}
          style={
            {
              ['--start-y' as string]: it.startY,
              ['--mid-y' as string]: it.midY,
              ['--end-y' as string]: it.endY,
              ['--dur' as string]: `${it.dur}s`,
              ['--delay' as string]: `${it.delay}s`,
            } as React.CSSProperties
          }
        >
          <BouquetSvg size={it.size} paletteIdx={it.paletteIdx} />
        </span>
      ))}
    </div>
  );
}

const BOUQUET_PALETTES: { petals: string[]; center: string; leaf: string }[] = [
  { petals: ['#ff85a2', '#ff9bb3'], center: '#ffd700', leaf: '#86c8a3' },
  { petals: ['#f9a8d4', '#fbcfe8'], center: '#fde68a', leaf: '#86c8a3' },
  { petals: ['#fda4af', '#ffe4e6'], center: '#fde047', leaf: '#86c8a3' },
  { petals: ['#fcd34d', '#fef3c7'], center: '#fb923c', leaf: '#86c8a3' },
  { petals: ['#c084fc', '#e9d5ff'], center: '#fde68a', leaf: '#86c8a3' },
];

function BouquetSvg({ size, paletteIdx }: { size: number; paletteIdx: number }) {
  const p = BOUQUET_PALETTES[paletteIdx % BOUQUET_PALETTES.length];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="22" cy="60" rx="14" ry="6" fill={p.leaf} transform="rotate(-30 22 60)" />
      <ellipse cx="78" cy="60" rx="14" ry="6" fill={p.leaf} transform="rotate(30 78 60)" />
      <ellipse cx="50" cy="80" rx="16" ry="6" fill={p.leaf} />
      <Flower cx={50} cy={42} r={20} petalColor={p.petals[0]} centerColor={p.center} />
      <Flower cx={28} cy={32} r={14} petalColor={p.petals[1]} centerColor={p.center} />
      <Flower cx={72} cy={32} r={14} petalColor={p.petals[0]} centerColor={p.center} />
      <Flower cx={32} cy={62} r={11} petalColor={p.petals[1]} centerColor={p.center} />
      <Flower cx={68} cy={62} r={11} petalColor={p.petals[1]} centerColor={p.center} />
      <rect x="42" y="78" width="16" height="14" rx="3" fill="#fb7185" />
      <path d="M42 92 L34 96 L42 88 Z" fill="#fb7185" />
      <path d="M58 92 L66 96 L58 88 Z" fill="#fb7185" />
    </svg>
  );
}

function Flower({
  cx,
  cy,
  r,
  petalColor,
  centerColor,
}: {
  cx: number;
  cy: number;
  r: number;
  petalColor: string;
  centerColor: string;
}) {
  const petalR = r * 0.6;
  const offset = r * 0.55;
  return (
    <g>
      <circle cx={cx} cy={cy - offset} r={petalR} fill={petalColor} />
      <circle cx={cx + offset} cy={cy - offset * 0.3} r={petalR} fill={petalColor} />
      <circle cx={cx - offset} cy={cy - offset * 0.3} r={petalR} fill={petalColor} />
      <circle cx={cx + offset * 0.7} cy={cy + offset * 0.7} r={petalR} fill={petalColor} />
      <circle cx={cx - offset * 0.7} cy={cy + offset * 0.7} r={petalR} fill={petalColor} />
      <circle cx={cx} cy={cy} r={r * 0.35} fill={centerColor} />
    </g>
  );
}
