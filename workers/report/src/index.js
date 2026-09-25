/**
 * 히스토리교회 홈페이지 오류 제보함
 *
 * 홈페이지의 /report/ 양식에서 보낸 제보를 비공개 GitHub 저장소(historychurch-reports)의 이슈로 만듭니다.
 * - 관리자는 GitHub 알림(메일)으로 제보를 받고, 이슈를 닫아서 처리 완료를 표시합니다.
 * - 제보자는 로그인할 필요가 없습니다.
 *
 * 보안
 * - ALLOWED_ORIGINS 에 적힌 사이트에서 보낸 요청만 받습니다.
 * - 스팸 방지: 숨은 입력칸(honeypot), 너무 빠른 제출 차단, 글자 수 제한, IP 당 1분에 5건 제한.
 * - GITHUB_TOKEN 은 제보함 저장소의 Issues 쓰기 권한만 가진 토큰이어야 합니다 (Cloudflare 에 암호화된 Secret 으로 저장).
 */

const TYPES = ['화면이 이상해요', '내용이 틀려요', '영상·링크가 안 돼요', '기타'];

/** 제어 문자를 지우고 길이를 자릅니다. */
const clean = (value, max) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);

/** 이슈 본문에서 @멘션·#이슈번호가 다른 사람을 부르거나 링크되지 않게 막습니다. */
const neutralize = (text) => text.replace(/([@#])(?=\w)/g, '$1​');

const quote = (text) =>
  neutralize(text)
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');

const json = (body, status, headers) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });

export default {
  async fetch(request, env) {
    const allowedOrigins = (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const origin = request.headers.get('Origin') ?? '';
    const allowed = allowedOrigins.includes(origin);
    const cors = allowed ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: allowed ? 204 : 403,
        headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' },
      });
    }
    if (request.method !== 'POST' || pathname !== '/report') return json({ error: 'not_found' }, 404, cors);
    if (!allowed) return json({ error: 'forbidden' }, 403, cors);

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (env.REPORT_LIMITER) {
      const { success } = await env.REPORT_LIMITER.limit({ key: ip });
      if (!success) return json({ error: 'rate_limited' }, 429, cors);
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ error: 'bad_request' }, 400, cors);
    }

    // 사람이 아닌 프로그램이 채우는 숨은 칸 → 성공한 척하고 버립니다.
    if (data.website) return json({ ok: true }, 200, cors);
    if (typeof data.elapsed !== 'number' || data.elapsed < 3000) return json({ error: 'too_fast' }, 400, cors);

    const message = clean(data.message, 3000);
    if (message.length < 5) return json({ error: 'message_required' }, 400, cors);
    const type = TYPES.includes(data.type) ? data.type : '기타';
    const page = clean(data.page, 300);
    const contact = clean(data.contact, 200);
    const viewport = clean(data.viewport, 40);
    const userAgent = clean(request.headers.get('User-Agent'), 300);
    const country = clean(request.headers.get('CF-IPCountry'), 8);

    const title = `[${type}] ${neutralize(clean(message.replace(/\s+/g, ' '), 50))}`;
    const body = [
      `**유형**: ${type}`,
      `**페이지**: ${page ? neutralize(page) : '(적지 않음)'}`,
      `**연락처**: ${contact ? neutralize(contact) : '(없음)'}`,
      '',
      '**내용**',
      quote(message),
      '',
      '<details><summary>기기 정보</summary>',
      '',
      `- 화면 크기: ${viewport || '-'}`,
      `- 브라우저: ${neutralize(userAgent) || '-'}`,
      `- 국가: ${country || '-'}`,
      '',
      '</details>',
      '',
      '_홈페이지 오류 제보함에서 자동으로 만든 글입니다._',
    ].join('\n');

    const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'historychurch-report',
      },
      body: JSON.stringify({ title, body, labels: ['제보', type] }),
    });

    if (!res.ok) {
      console.error('GitHub issue creation failed', res.status, await res.text());
      return json({ error: 'upstream' }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  },
};
