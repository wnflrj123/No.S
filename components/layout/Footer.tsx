export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200/60 mt-auto">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">No.S</span>
            <span className="text-xs text-gray-400">넘버에스</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {currentYear} No.S - 삼성전자 뮤지컬 동호회
          </p>
        </div>
      </div>
    </footer>
  );
}
