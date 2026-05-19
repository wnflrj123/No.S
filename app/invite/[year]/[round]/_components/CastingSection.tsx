import Image from 'next/image';
import type { InviteRound } from '@/lib/invites/types';

interface Props {
  rounds: InviteRound[];
  inviteId: string;
}

export default function CastingSection({ rounds, inviteId }: Props) {
  const hasAnyCasting = rounds.some(r => r.casting.length > 0);
  if (!hasAnyCasting) return null;

  return (
    <section className="px-5 py-8 bg-gray-50">
      <h2 className="text-lg font-bold text-gray-900 mb-3">캐스팅</h2>
      <div className="space-y-6">
        {rounds
          .filter(r => r.casting.length > 0)
          .map(r => (
            <div key={r.roundNo}>
              <h3 className="text-sm font-bold text-[#0066B3] mb-3">
                {r.roundNo}회차 · {r.teamName}
              </h3>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {r.casting.map((c, i) => (
                  <li
                    key={`${r.roundNo}-${i}`}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200"
                  >
                    {c.photoFile ? (
                      <div className="relative aspect-[3/4] bg-gray-100">
                        <Image
                          src={`/invites/${inviteId}/cast/${c.photoFile}`}
                          alt={c.role}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                        사진 준비 중
                      </div>
                    )}
                    <div className="p-3">
                      <div className="text-sm font-semibold text-gray-900">{c.role}</div>
                      {c.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-3 whitespace-pre-line">
                          {c.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </section>
  );
}
