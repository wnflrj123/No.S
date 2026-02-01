/**
 * 푸터 컴포넌트
 */

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            &copy; {currentYear} No.S (넘버에스) - 삼성전자 뮤지컬 동호회
          </p>
          <p className="text-xs text-gray-500 mt-2">
            예약 공유 플랫폼
          </p>
        </div>
      </div>
    </footer>
  );
}
