import { Fragment } from 'react';

/**
 * 문구를 어구 단위로 줄바꿈되게 보여 준다.
 * - `\n`: 항상 줄을 바꾼다 (감싸는 요소에 whitespace-pre-line 필요).
 * - `|`: "여기서는 끊어도 된다"는 표시. `|`로 나뉜 조각은 한 덩어리로 묶여서,
 *   화면이 넓으면 한 줄로 이어지고 좁으면 조각 사이에서만 줄이 넘어간다.
 *   덕분에 휴대폰에서 "무대로 ✊"처럼 말끝만 혼자 떨어지는 일이 없다.
 */
export default function Phrases({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <Fragment key={i}>
          {i > 0 && '\n'}
          {line.includes('|')
            ? line.split('|').map((chunk, j) => (
                <Fragment key={j}>
                  {j > 0 && ' '}
                  <span className="inline-block">{chunk.trim()}</span>
                </Fragment>
              ))
            : line}
        </Fragment>
      ))}
    </>
  );
}
