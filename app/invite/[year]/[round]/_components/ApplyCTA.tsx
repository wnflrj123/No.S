import Link from 'next/link';

interface Props {
  year: number;
  round: number;
  disabled: boolean;
}

export default function ApplyCTA({ year, round, disabled }: Props) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-20 p-4 bg-white/80 backdrop-blur-xl shadow-[0_-18px_40px_-10px_rgba(15,23,42,0.20),0_-3px_8px_-1px_rgba(15,23,42,0.12)] md:static md:px-5 md:pt-4 md:pb-16 md:bg-transparent md:backdrop-blur-none md:shadow-none"
    >
      <div className="max-w-2xl mx-auto flex flex-row gap-2 md:flex-col">
        {disabled ? (
          <button
            disabled
            className="flex-[7] md:flex-none py-4 bg-gray-200 text-gray-500 rounded-xl font-semibold text-base"
          >
            신청이 종료되었습니다
          </button>
        ) : (
          <Link
            href={`/invite/${year}/${round}/apply`}
            className="flex-[7] md:flex-none block py-4 bg-[#0066B3] text-white rounded-xl font-semibold text-base text-center hover:bg-[#0055a0] transition-colors"
          >
            신청하기
          </Link>
        )}
        <Link
          href={`/invite/${year}/${round}/check`}
          className="flex-[3] md:flex-none block py-4 md:py-2.5 bg-white text-[#0066B3] border border-[#0066B3]/30 rounded-xl font-medium text-sm text-center hover:bg-blue-50 transition-colors"
        >
          신청 확인하기
        </Link>
      </div>
    </div>
  );
}
