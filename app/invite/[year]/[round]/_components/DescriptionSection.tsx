/**
 * 공연 안내 섹션. TipTap이 생성한 HTML을 그대로 렌더.
 * TipTap 출력은 에디터에서 sanitize된 마크업이며, 콘텐츠 작성 권한은 Admin만 가짐.
 */
export default function DescriptionSection({ html }: { html: string }) {
  if (!html?.trim()) return null;
  return (
    <section className="px-5 py-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">공연 안내</h2>
      <div
        className="invite-prose text-sm sm:text-base leading-relaxed text-gray-800"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
