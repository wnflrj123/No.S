import { NextRequest, NextResponse } from 'next/server';

interface HolidayItem {
  dateName: string;
  locdate: number;
  isHoliday: string;
}

interface HolidayApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: { item: HolidayItem | HolidayItem[] } | '';
      totalCount: number;
    };
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!year || !month) {
    return NextResponse.json({ error: 'year, month 파라미터가 필요합니다' }, { status: 400 });
  }

  const apiKey = process.env.HOLIDAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });
  }

  try {
    const url = new URL('https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo');
    url.searchParams.set('serviceKey', apiKey);
    url.searchParams.set('solYear', year);
    url.searchParams.set('solMonth', month.padStart(2, '0'));
    url.searchParams.set('_type', 'json');
    url.searchParams.set('numOfRows', '50');

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    const data: HolidayApiResponse = await res.json();

    if (data.response.header.resultCode !== '00') {
      return NextResponse.json({ error: data.response.header.resultMsg }, { status: 502 });
    }

    const items = data.response.body.items;
    if (!items || (typeof items === 'string' && items === '')) {
      return NextResponse.json({ holidays: {} });
    }

    const itemList = Array.isArray(items.item) ? items.item : [items.item];
    const holidays: { [date: string]: string } = {};

    for (const item of itemList) {
      if (item.isHoliday === 'Y') {
        const dateStr = item.locdate.toString();
        const formatted = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        holidays[formatted] = item.dateName;
      }
    }

    return NextResponse.json({ holidays }, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    });
  } catch (error) {
    console.error('공휴일 API 호출 실패:', error);
    return NextResponse.json({ error: '공휴일 정보를 가져오지 못했습니다' }, { status: 502 });
  }
}
