import BarricadeSilhouette from './_components/BarricadeSilhouette';

/**
 * 정기공연 신청 페이지 전용 레이아웃.
 * 사이트 메인 Header/Footer를 노출하지 않는 미니멀 레이아웃.
 * 빈티지 페이퍼톤(크림) + 하단 바리케이드 실루엣으로 레미제라블 무드를
 * 깔되, 폼·카드는 자체 흰 배경을 유지해 시인성을 그대로 두었다.
 */
export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-[#F8F2E5] text-gray-900">
      {children}
      <BarricadeSilhouette />
    </div>
  );
}
