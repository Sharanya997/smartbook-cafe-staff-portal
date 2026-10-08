import { api } from '../api.js';

export function renderLibrary(container) {
  container.innerHTML = `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Library Monitor</h1>
          <p>Books currently at tables</p>
        </div>
        <div class="count-badge" id="libraryCount">…</div>
      </header>
      <div id="libraryList"></div>
    </div>
  `;

  let intervalId = null;

  async function load() {
    try {
      const { checkins } = await api.getLibrary();
      const list = container.querySelector('#libraryList');
      const badge = container.querySelector('#libraryCount');
      badge.textContent = `${checkins.length} book${checkins.length === 1 ? '' : 's'}`;

      if (checkins.length === 0) {
        list.innerHTML = `
          <div class="empty">
            <div class="empty-icon">📚</div>
            <p>No books checked out</p>
          </div>
        `;
        return;
      }

      list.innerHTML = `<div class="library-grid">${checkins.map(libraryCard).join('')}</div>`;

      list.querySelectorAll('[data-checkout]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const docId = btn.dataset.checkout;
          if (!confirm('Mark this book as checked out?')) return;
          btn.disabled = true;
          try {
            await api.checkOutBook(docId);
            await load();
          } catch (e) {
            alert('Failed to check out: ' + e.message);
            btn.disabled = false;
          }
        });
      });
    } catch (e) {
      console.error(e);
      container.querySelector('#libraryList').innerHTML =
        `<div class="empty"><p>Failed to load: ${SB.escapeHtml(e.message)}</p></div>`;
    }
  }

  function libraryCard(entry) {
    const dwell = SB.formatDwell(entry.checkedInAt);
    return `
      <div class="library-card ${dwell.long ? 'library-card--alert' : ''}">
        <div class="row-top">
          <div class="row-left">
            <span class="table-badge">Table ${entry.tableNumber}</span>
            <span class="book-title-cell">"${SB.escapeHtml(entry.title)}"</span>
          </div>
          ${dwell.long ? `<span class="dwell-badge">Dwell: ${dwell.text}</span>` : ''}
        </div>
        <button class="btn-checkout" data-checkout="${entry.docId}">Check Out</button>
      </div>
    `;
  }

  load();
  intervalId = setInterval(load, 10000);

  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      if (intervalId) clearInterval(intervalId);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}