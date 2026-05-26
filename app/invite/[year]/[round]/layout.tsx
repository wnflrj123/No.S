/**
 * 정기공연 신청 페이지 전용 레이아웃.
 * 사이트 메인 Header/Footer를 노출하지 않는 미니멀 레이아웃.
 */
export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-white">{children}</div>;
}
