import Lozenge from './Lozenge';
import { BRAND_TEXT, HEADING, SHADOW_RAISED, TEXT_SUBTLE } from './theme';

/** 출연진 — 총연출·MC를 먼저, 그 아래 출연진 이름을 가나다순으로 깔끔하게 보여 준다. */
export default function Cast({ names, crew }: { names: string[]; crew: { label: string; names: string[] }[] }) {
  return (
    <section id="cast" aria-labelledby="cast-title" className="relative scroll-mt-14 overflow-hidden bg-white py-16 md:py-24">
      <div aria-hidden className="yearend-snowfield pointer-events-none absolute inset-0" />
      <div className="relative max-w-3xl mx-auto px-5">
        <header className="text-center">
          <h2 id="cast-title" className={`${HEADING} text-4xl md:text-5xl`}>
            출연진 🌟
          </h2>
          <p className="mt-3 text-base md:text-lg" style={{ color: TEXT_SUBTLE }}>
            오늘 무대에 오르는 {names.length}명을 소개할게요
          </p>
        </header>

        {crew.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {crew.map(c => (
              <p
                key={c.label}
                className="flex items-center gap-3 rounded-full bg-white px-5 py-3"
                style={{ boxShadow: SHADOW_RAISED }}
              >
                <Lozenge bg="#E9F2FF" fg={BRAND_TEXT}>
                  {c.label}
                </Lozenge>
                <span className={`${HEADING} text-lg leading-none`}>{c.names.join(', ')}</span>
              </p>
            ))}
          </div>
        )}

        <ul className="yearend-reveal mt-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 overflow-hidden rounded-xl" style={{ boxShadow: SHADOW_RAISED }}>
          {names.map(name => (
            <li
              key={name}
              className="border-b border-r border-[#091E42]/[0.08] bg-white py-4 text-center text-[15px] md:text-base font-semibold"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
