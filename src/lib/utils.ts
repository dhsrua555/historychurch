const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** 사이트 내부 경로에 base 경로를 붙입니다. 외부 주소(http…)는 그대로 둡니다. */
export function href(path = '/'): string {
  if (!path) return '';
  if (/^(https?:|mailto:|tel:|#|data:)/.test(path)) return path;
  return BASE + (path.startsWith('/') ? path : `/${path}`);
}

/** YouTube 주소나 ID 를 받아 11자리 영상 ID 만 돌려줍니다. */
export function youtubeId(input: string): string {
  const s = input.trim();
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : s;
}

export const ytThumb = (id: string, size: 'maxresdefault' | 'hqdefault' | 'mqdefault' = 'maxresdefault') =>
  `https://i.ytimg.com/vi/${youtubeId(id)}/${size}.jpg`;

const pad = (n: number) => String(n).padStart(2, '0');

/** 2026.09.20 */
export const dot = (d: Date) => `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;

/** 2026년 9월 20일 주일 */
export function longDate(d: Date): string {
  const days = ['주일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${days[d.getUTCDay()]}`;
}

/** 최신순. 같은 날짜면 나중에 만든 글(파일 이름 뒤 -2, -3 …)이 먼저 옵니다. */
export const byDateDesc = <T extends { id: string; data: { date: Date } }>(a: T, b: T) =>
  b.data.date.getTime() - a.data.date.getTime() || b.id.localeCompare(a.id, 'en', { numeric: true });

/** 마크다운 본문에서 미리보기용 짧은 글을 만듭니다. */
export function excerpt(markdown = '', length = 110): string {
  const plain = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[#>*_`~✜]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > length ? `${plain.slice(0, length).trim()}…` : plain;
}
