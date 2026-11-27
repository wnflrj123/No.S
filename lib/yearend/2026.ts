import type { Credit, YearEndConcert } from './types';

/** 이름 목록을 가나다순(한국어 정렬)으로 정렬한다.
 * 문구 표시: \n은 항상 줄바꿈, |는 "좁은 화면에서 여기서만 끊어도 됨"(넓으면 한 줄로 이어짐). */
const ganada = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b, 'ko'));

// ─── 단체곡 크레딧 ──────────────────────────────────────────
// 연출·반장도 무대에 서므로 출연진 목록에 이름을 한 번 더 넣는다 (가나다순).
const SHINING_STAR: Credit[] = [
  { label: '연출', names: ['이경환'], lead: true },
  { names: ganada(['이경환', '서주리', '김은지', '김태균', '이재근', '이현우', '정문경', '최유정']) },
];

const LES_MIS: Credit[] = [
  { label: '연출', names: ['이은진'], lead: true },
  {
    names: ganada([
      '이은진', '서주리', '김은지', '김재훈', '안준익', '오진환', '이동원',
      '이재근', '장선준', '최유정', '최지수', '홍덕기', '황미아',
    ]),
  },
];

// 배역 순서는 RENT 공식 캐스팅 보드(로저·마크·콜린·베니·조앤·엔젤·미미·모린) 다음 앙상블 순
const LA_VIE: Credit[] = [
  { label: '강사', names: ['정재은'], lead: true, staff: true },
  { label: '반장', names: ['이현우'], lead: true },
  { label: '로저', names: ['김성창'] },
  { label: '마크', names: ['이현우'] },
  { label: '콜린', names: ['이동원'] },
  { label: '베니', names: ['이재근'] },
  { label: '조앤', names: ['최유정'] },
  { label: '엔젤', names: ['장선준'] },
  { label: '미미', names: ['서주리'] },
  { label: '모린', names: ['이유림'] },
  { label: '레스토랑맨', names: ['이경환'] },
  { label: '소녀', names: ['이은진'] },
  { label: '그레이맨·로드니', names: ['홍덕기'] },
  { label: '미아', names: ['황미아'] },
];

const SEASONS: Credit[] = [
  { label: '연출', names: ['김재훈'], lead: true },
  {
    names: ganada([
      '김재훈', '서주리', '김성창', '김현우', '안준익', '유혜선', '이은진',
      '이재근', '이현우', '임혜란', '장선준', '정문경', '최유정',
    ]),
  },
];

const MUST_HAVE_LOVE: Credit[] = [
  { label: '연출', names: ['서주리'], lead: true },
  { names: ganada(['서주리', '김은지', '최유정', '김성창', '안준익', '이동원']) },
];

const BAND: Credit[] = [
  { label: '보컬', names: ['서주리'] },
  { label: '베이스', names: ['전지성'] },
  { label: '기타', names: ['김태균'] },
  { label: '건반', names: ['김소라'] },
  { label: '드럼', names: ['김수지'] },
];

// 창작 단막극 〈2026: DELETE〉 — 서회장이 연출·각본·기획·무대·음향·조명을 모두 맡았다. 배역 순서는 극 기준 그대로
const PLAY: Credit[] = [
  { label: '연출·각본·기획·무대·음향·조명', names: ['서주리'], lead: true },
  { label: '지유', names: ['주현지'] },
  { label: '관리자', names: ['이재근'] },
  { label: '혜진', names: ['김수지'] },
  { label: '혜진 남자친구', names: ['전지성'] },
  { label: '과거 지유', names: ['이유림', '서주리', '김은지', '이은진'] },
  { label: '과거 지유 남자친구', names: ['이동원', '유준형', '이경환'] },
];

// ─── 공연 데이터 ────────────────────────────────────────────
export const yearEnd2026: YearEndConcert = {
  year: 2026,
  title: '우리의 525,600분 | No.S 2026 송년 공연',
  overline: 'No.S 2026 송년 공연 🎄',
  heroLead: '우리의',
  heroNumber: 525600,
  heroUnit: '분',
  tagline: '올해도 잘 놀았다 🎶\n2026 마지막 무대,|같이 달려요!',
  intro:
    // 휴대폰 화면(약 20자)에서도 한 줄에 들어가도록 짧게 끊었다
    'No.S의 2026년|마지막 무대이자,\n' +
    '서회장의 마지막 행사 🎄💖\n' +
    '\n' +
    '오늘만큼은 부담은 내려놓고!\n' +
    '다 같이 여유롭고 신나게\n' +
    '즐겼으면 좋겠어요 🥰\n' +
    '\n' +
    '자유롭게 소통하고,|먹고, 마시고,\n' +
    '무대하고, 즐기면서\n' +
    '행복하게 연말을|함께 마무리해요! 💕✨',
  hashtags: ['서회장', '마지막행사', '하고픈거다하라해서', '진짜다함', '집에못가'],
  crew: [{ label: '총연출, MC', names: ['서주리'] }],
  startAt: '2026-12-19T17:00:00+09:00',
  venue: {
    name: '수원 남문 로데오아트홀',
    address: '경기도 수원시 팔달구 행궁로 88, 지하 1층',
    mapEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent('경기도 수원시 팔달구 행궁로 88')}&hl=ko&z=17&output=embed`,
    mapLinks: {
      naver: `https://map.naver.com/p/search/${encodeURIComponent('남문로데오 아트홀')}`,
      kakao: `https://map.kakao.com/?q=${encodeURIComponent('남문로데오 아트홀')}`,
    },
  },
  // 관객 신청 — 구글폼 주소를 url에 넣으면 히어로·상단 메뉴·페이지 하단에 신청 버튼이 나타나요. 비어 있으면 숨겨져요.
  // note는 버튼 아래 작은 안내 문구예요 (예: '12월 12일까지 신청받아요!'). 필요 없으면 비워 두세요.
  apply: {
    url: 'https://forms.gle/DSAfNXZKc33vbUz1A',
    note: '',
  },
  notices: [
    {
      emoji: '🥂',
      title: '로비에 작은 파티 열어 둘게요',
      body: '핑거푸드, 음료, 주류까지|다 준비했어요!\n공연 중에도 언제든|로비에서 맘껏 즐겨 주세요.',
    },
    {
      emoji: '🍷',
      title: '객석엔 마실 것만 OK',
      body: '음식은 로비에서만|먹을 수 있어요.\n대신 음료는 술까지|들고 들어와도 돼요 🍻',
    },
    {
      emoji: '🍽️',
      title: '저녁은 든든하게 먹고 오기',
      body: '로비가 좁아서|식사까지는 어려워요.\n배는 미리 채우고|오는 거 추천!',
    },
    {
      emoji: '🚌',
      title: '주차 지원은 안 돼요',
      body: '공연장 주차 지원이 없어요.\n한잔할 거면|더더욱 대중교통 추천 🚇',
    },
    {
      emoji: '🎉',
      title: '준비물: 연말 텐션 하나면 끝',
      body: '박수, 환호, 떼창|전부 대환영!\n올해 마지막 파티,|같이 신나게 놀다 가요 🙌',
    },
  ],
  parts: [
    {
      no: 1,
      title: '무대 밖의 우리',
      subtitle: '뮤지컬 동호회인데|가요도 잘함 😎',
      description: '뮤지컬만 하는 줄 알았죠?|오늘은 가요도 찢고 갑니다 🎤🔥',
      icon: '🎤',
      accent: '#943D73',
      bold: '#AE4787',
      surface: '#FFECF8',
      tint: '#FDD0EC',
      items: [
        {
          kind: 'song',
          title: '줄게',
          source: { kind: 'artist', name: '조현아' },
          blurb: '댄서까지 있는|오늘의 유일한 댄스 무대!|가쟈아아 💃🕺',
          credits: [{ names: ['주현지'] }, { label: '댄서', names: ganada(['김소라', '이동원', '김수지', '이은진', '장선준']) }],
        },
        { kind: 'song', title: '발걸음', source: { kind: 'artist', name: '에메랄드캐슬' }, credits: [{ names: ['이재근'] }] },
        { kind: 'song', title: 'Firework', source: { kind: 'musical', name: '물랑루즈' }, credits: [{ names: ['최유정'] }] },
        {
          kind: 'song',
          title: '널 사랑하지 않아',
          source: { kind: 'artist', name: '어반자카파' },
          credits: [{ names: ['김소라', '장선준', '이동원'] }],
        },
        {
          kind: 'song',
          title: '슈퍼마리오 메인테마 / Summer',
          source: { kind: 'other', name: '현악 연주' },
          family: '아빠와 아들이 함께하는|현악 이중주 🎻',
          credits: [{ names: ['김재훈', '김서윤'] }],
        },
        { kind: 'song', title: '빨래', source: { kind: 'artist', name: '이적' }, credits: [{ names: ['이건창'] }] },
        {
          kind: 'song',
          title: '그래서 창문에 썬팅을 하나봐',
          source: { kind: 'artist', name: '중식이' },
          credits: [{ names: ['장선준', '김진하'] }],
        },
        {
          kind: 'song',
          title: '위로',
          source: { kind: 'artist', name: '하도권 & 이아름솔 ver.' },
          credits: [{ names: ['김소라', '김태균'] }],
        },
        { kind: 'song', title: '안아줘', source: { kind: 'artist', name: '정준일' }, credits: [{ names: ['이현우'] }] },
        {
          kind: 'song',
          title: 'Rewrite the Stars',
          source: { kind: 'musical', name: '위대한 쇼맨' },
          credits: [{ names: ['최유정', '장선준'] }],
        },
        {
          kind: 'song',
          title: '인연',
          source: { kind: 'artist', name: '윤민수 & 신용재' },
          family: '회원과 서회장 남편으로 만나|듀엣까지 하게 된 사이 🤝',
          credits: [{ names: ['유준형', '오진환'] }],
        },
        {
          kind: 'song',
          title: '이제는',
          source: { kind: 'artist', name: '서울패밀리' },
          family: '이 정도면 명예회원!|부부가 함께하는 무대 💑',
          credits: [{ names: ['김재훈', '정미정'] }],
        },
        {
          kind: 'event',
          emoji: '🕵️',
          title: '히든덕기',
          description:
            'No.S의 마스코트,|진짜 덕기님을 찾아라!\n' +
            '덕기님 그 자체인|도전자들 총출동 🙌\n' +
            '제일 완벽한 덕기한테는|고오급 상품이 있을지도?!',
        },
        {
          kind: 'song',
          title: "If I Ain't Got You",
          source: { kind: 'musical', name: '헬스키친' },
          blurb: '이제 진짜 덕기 등장 👀',
          credits: [{ names: ['김소라', '홍덕기'] }],
        },
      ],
    },
    {
      no: 2,
      title: '무대 위의 우리',
      subtitle: '우리가 사랑한 넘버,|우리가 만든 이야기',
      description: '드디어 본업 등판 🎭|뮤지컬 넘버들과|서회장의 첫 창작극 연출 도전!',
      icon: '🎭',
      accent: '#206A83',
      bold: '#227D9B',
      surface: '#E7F9FF',
      tint: '#C6EDFB',
      items: [
        { kind: 'song', title: '반짝이는 별을 찾아2', source: { kind: 'musical', name: '폴' }, credits: SHINING_STAR },
        {
          kind: 'song',
          title: 'Waving Through a Window',
          source: { kind: 'musical', name: '디어 에반 핸슨' },
          family: '서회장 남편|단독 출격 🕺',
          credits: [{ names: ['유준형'] }],
        },
        {
          kind: 'song',
          title: 'For Forever',
          source: { kind: 'musical', name: '디어 에반 핸슨' },
          blurb: '내년 우리의 두 번째 정극이|〈디어 에반 핸슨〉이라는 소식이…? 👀',
          credits: [{ names: ['이경환'] }],
        },
        {
          kind: 'song',
          title: 'Only Us',
          source: { kind: 'musical', name: '디어 에반 핸슨' },
          credits: [{ names: ['김태균', '정문경'] }],
        },
        {
          kind: 'song',
          title: '알 수 없는 그곳으로',
          source: { kind: 'musical', name: '더 라스트 키스' },
          blurb: '오늘 단막극의 주인공들!|듀엣으로 먼저 만나요! 🎭',
          credits: [{ names: ['이재근', '주현지'] }],
        },
        {
          kind: 'song',
          title: '너의 꿈속에서',
          source: { kind: 'musical', name: '프랑켄슈타인' },
          blurb: '예비 신랑이 예비 신부에게|바치는 노래 >_< 💍',
          credits: [{ names: ['김현우'] }],
        },
        {
          kind: 'song',
          title: 'Loving You Keeps Me Alive',
          source: { kind: 'musical', name: '드라큘라' },
          credits: [{ names: ['이유림', '김태균'] }],
        },
        {
          kind: 'song',
          title: 'Do You Hear the People Sing?',
          source: { kind: 'musical', name: '레미제라블' },
          blurb: '우리의 첫 정극 〈레미제라블〉,|그 추억을 다시 무대로 ✊',
          credits: LES_MIS,
        },
        {
          kind: 'song',
          title: 'One Day More',
          source: { kind: 'musical', name: '레미제라블' },
          blurb: '우리의 첫 정극 〈레미제라블〉,|그 추억을 다시 무대로 ✊',
          credits: LES_MIS,
        },
        {
          kind: 'event',
          emoji: '💐',
          title: '종범 송별회',
          description:
            '곧 머나먼 곳으로|떠나는 종범 🛫\n' + '함께해서 즐거웠고,|앞으로의 길도 늘 응원해! 💐',
        },
        { kind: 'song', title: '나는 나만의 것', source: { kind: 'musical', name: '엘리자벳' }, credits: [{ names: ['김진하'] }] },
        { kind: 'song', title: '미친 모자 장수', source: { kind: 'musical', name: '매드해터' }, credits: [{ names: ['이경환'] }] },
        {
          kind: 'song',
          title: 'Heaven on Their Mind',
          source: { kind: 'musical', name: '지저스 크라이스트 슈퍼스타' },
          credits: [{ names: ['이현우'] }],
        },
        { kind: 'song', title: '골고다', source: { kind: 'musical', name: '벤허' }, credits: [{ names: ['오진환'] }] },
        {
          kind: 'play',
          emoji: '🎭',
          label: '창작 단막극',
          title: '2026: DELETE',
          description: '2026 마무리를 위한|최고의 선택 ✨',
          durationMin: 30,
          credits: PLAY,
        },
      ],
    },
    {
      no: 3,
      title: '다음 계절의 우리',
      subtitle: '한 해를 보내고,|새 시대를 맞이하며',
      description: '크리스마스 감성 풀충전 🎄|함께하는 올해 엔딩 크레딧 🎬',
      icon: '🎄',
      accent: '#5E4DB2',
      bold: '#6E5DC6',
      surface: '#F3F0FF',
      tint: '#DFD8FD',
      items: [
        { kind: 'song', title: 'Must Have Love', source: { kind: 'artist', name: 'SG워너비 & 브라운아이드걸스' }, credits: MUST_HAVE_LOVE },
        {
          kind: 'song',
          title: 'We Both Reached for the Gun',
          source: { kind: 'musical', name: '시카고' },
          family: '자타공인|뮤지컬 배우 부부의 무대 💑',
          credits: [{ names: ['고수진', '정영호'] }],
        },
        {
          kind: 'song',
          title: 'Roxie',
          source: { kind: 'musical', name: '시카고' },
          family: '자타공인|뮤지컬 배우 부부의 무대 💑',
          credits: [{ names: ['고수진', '정영호'] }],
        },
        {
          kind: 'song',
          title: 'Text Me Merry Christmas / Die With a Smile',
          source: { kind: 'artist', name: 'Straight No Chaser / Lady Gaga & Bruno Mars' },
          blurb: '오늘의 유일한 메들리! 🎄🎶',
          credits: [{ names: ['김은지', '장선준'] }],
        },
        {
          kind: 'song',
          title: 'Love Is an Open Door',
          source: { kind: 'musical', name: '겨울왕국' },
          blurb: '연말에 겨울왕국은 못 참지! ❄️',
          credits: [{ names: ['이유림', '김태균'] }],
        },
        {
          kind: 'song',
          title: 'In Summer',
          source: { kind: 'musical', name: '겨울왕국' },
          blurb: '인외 전문 배우 출격 🤖',
          credits: [{ names: ['안준익'] }],
        },
        {
          kind: 'song',
          title: 'Let It Go',
          source: { kind: 'musical', name: '겨울왕국' },
          blurb: '엘사·안나·올라프,|아렌델 완전체 집결 ❄️',
          credits: [
            { label: '엘사', names: ['이유림'] },
            { label: '안나', names: ['서주리'] },
            { label: '올라프', names: ['안준익'] },
          ],
        },
        {
          kind: 'event',
          emoji: '👑',
          title: '퇴임식과 대관식',
          description:
            'No.S를 만든 서회장,|드디어 왕관 내려놓습니다 👑\n' + '새 회장님 대관식까지!\n' + '역사적인 순간|같이 지켜봐 주세요 🥹',
        },
        {
          kind: 'song',
          title: 'New Future',
          source: { kind: 'other', name: '애니메이션 달빛천사' },
          blurb: '새 회장님과 함께 열어 갈|새로운 No.S, 커밍순 🚀',
          group: '뚱치땅치 밴드',
          credits: BAND,
        },
        {
          kind: 'song',
          title: 'Out Tonight',
          source: { kind: 'musical', name: '렌트' },
          group: '뚱치땅치 밴드',
          credits: BAND,
        },
        {
          kind: 'song',
          title: 'La Vie Bohème',
          source: { kind: 'musical', name: '렌트' },
          blurb: 'No.S 아카데미 수강생들의|발표 무대 🎓',
          credits: LA_VIE,
        },
        {
          kind: 'song',
          title: 'Take Me or Leave Me',
          source: { kind: 'musical', name: '렌트' },
          family: 'E은진과 I은진,|현실 자매 케미 폭발 👭',
          credits: [{ names: ['이은진', '이수진'] }],
        },
        {
          kind: 'song',
          title: 'Seasons of Love',
          source: { kind: 'musical', name: '렌트' },
          blurb:
            '525,600분, 우리의 1년을|무엇으로 셀 수 있을까요?\n' +
            '함께 웃고, 울고,|노래했던 순간들.\n결국 답은 사랑이었어요 💙\n' +
            '올 한 해 정말 고마웠어요.',
          credits: SEASONS,
          note: '+ 아는 사람 다 같이 불러요! 🙌',
        },
      ],
    },
  ],
};
