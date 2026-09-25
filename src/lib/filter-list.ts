/**
 * 목록 필터 + "더 보기".
 * - [data-filter] 버튼을 누르면 data-category 가 같은 항목만 보여 줍니다.
 * - 처음에는 data-page 개수만 보여 주고, "더 보기"를 누를 때마다 더 보여 줍니다.
 * - 선택한 탭은 주소(#주보 등)에 남아서 뒤로 가기 해도 유지됩니다.
 */
export function setupFilterList(root: HTMLElement) {
  const page = Number(root.dataset.page || 12);
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const items = [...root.querySelectorAll<HTMLElement>('[data-category]')];
  const more = root.querySelector<HTMLButtonElement>('[data-more]');
  let filter = 'all';
  let shown = page;

  const render = () => {
    const matched = items.filter((el) => filter === 'all' || el.dataset.category === filter);
    items.forEach((el) => (el.hidden = true));
    matched.slice(0, shown).forEach((el) => (el.hidden = false));
    if (more) more.parentElement!.hidden = matched.length <= shown;
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  };

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      filter = b.dataset.filter || 'all';
      shown = page;
      history.replaceState(null, '', filter === 'all' ? location.pathname : `#${encodeURIComponent(filter)}`);
      render();
    }),
  );
  more?.addEventListener('click', () => {
    shown += page;
    render();
  });

  const fromHash = decodeURIComponent(location.hash.slice(1));
  if (buttons.some((b) => b.dataset.filter === fromHash)) filter = fromHash;
  render();
}
