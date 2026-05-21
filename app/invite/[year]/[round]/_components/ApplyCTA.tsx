import Link from 'next/link';

interface Props {
  year: number;
  round: number;
  disabled: boolean;
}

export default function ApplyCTA({ year, round, disabled }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-20">
      <div className="max-w-2xl mx-auto space-y-2">
        {disabled ? (
          <button
            disabled
            className="w-full py-4 bg-gray-200 text-gray-500 rounded-xl font-semibold text-base"
          >
            신청이 종료되었습니다
          </button>
        ) : (
          <Link
            href={`/invite/${year}/${round}/apply`}
            className="block w-full py-4 bg-[#0066B3] text-white rounded-xl font-semibold text-base text-center hover:bg-[#0055a0] transition-colors"
          >
            신청하기
          </Link>
        )}
        <Link
          href={`/invite/${year}/${round}/check`}
          className="block w-full py-2.5 bg-white text-[#0066B3] border border-[#0066B3]/30 rounded-xl font-medium text-sm text-center hover:bg-blue-50 transition-colors"
        >
          신청 확인하기
        </Link>
      </div>
    </div>
  );
}
