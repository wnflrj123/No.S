import './yearend.css';

/**
 * 송년 공연 페이지 전용 레이아웃.
 * 외부 관객용이라 사이트 Header/Footer 없이 단독으로 보여 준다.
 *
 * 글꼴: Pretendard (Atlassian Sans와 같은 계열의 한글 산세리프) — yearend.css에서 CDN으로 불러온다.
 */
export default function YearEndLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="[font-family:'Pretendard_Variable',Pretendard,-apple-system,BlinkMacSystemFont,system-ui,sans-serif] min-h-dvh bg-white text-[#172B4D] antialiased">
      {children}
    </div>
  );
}
