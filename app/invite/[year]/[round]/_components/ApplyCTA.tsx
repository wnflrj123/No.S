import Link from 'next/link';

interface Props {
  year: number;
  round: number;
  disabled: boolean;
}

export default function ApplyCTA({ year, round, disabled }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 pointer-events-none">
      <div
        aria-hidden
        className="h-8 bg-gradient-to-b from-transparent to-white"
      />
      <div className="pointer-events-auto p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-6px_18px_-10px_rgba(0,0,0,0.15)]">
        <div className="max-w-2xl mx-auto flex flex-row md:flex-col gap-2">
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
    </div>
  );
}
