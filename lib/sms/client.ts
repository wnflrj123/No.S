/**
 * 솔라피 SMS/LMS 발송 클라이언트 (서버 전용).
 *
 * 솔라피 REST API를 HMAC-SHA256 서명으로 직접 호출한다. 의존성 추가 없이 fetch + crypto만 사용.
 * Edge Runtime에서는 Node crypto가 동작하지 않으므로 Node.js runtime의 API route에서만 사용.
 */

import crypto from 'node:crypto';
import type { SendSmsInput, SendSmsResult } from './types';

const SOLAPI_ENDPOINT = 'https://api.solapi.com/messages/v4/send';

function buildAuthHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const data = date + salt;
  const signature = crypto.createHmac('sha256', apiSecret).update(data).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, '');
}

interface SolapiCredentials {
  apiKey: string;
  apiSecret: string;
  sender: string; // 발신번호 (하이픈 제거 후 사용)
}

function readCredentials(): SolapiCredentials | null {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = process.env.SOLAPI_SENDER;
  if (!apiKey || !apiSecret || !sender) return null;
  return { apiKey, apiSecret, sender: normalizePhone(sender) };
}

/**
 * LMS 1건 발송. 솔라피는 type을 명시하지 않으면 본문 길이로 자동 추론하지만,
 * 길이 변동에 따라 SMS로 떨어지는 사고를 막기 위해 LMS를 명시한다.
 */
export async function sendLms(input: SendSmsInput): Promise<SendSmsResult> {
  const creds = readCredentials();
  if (!creds) {
    return { ok: false, error: 'SOLAPI env vars missing (SOLAPI_API_KEY/SOLAPI_API_SECRET/SOLAPI_SENDER)' };
  }

  const to = normalizePhone(input.to);
  if (!/^01[016789]\d{7,8}$/.test(to)) {
    return { ok: false, error: `INVALID_PHONE: ${input.to}` };
  }

  const text = input.text.slice(0, 2000); // LMS 본문 한도

  const body = {
    message: {
      to,
      from: creds.sender,
      text,
      subject: input.subject,
      type: 'LMS' as const,
    },
  };

  try {
    const res = await fetch(SOLAPI_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(creds.apiKey, creds.apiSecret),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { ok: false, error: `SOLAPI ${res.status}: ${errText.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'fetch failed' };
  }
}
