import { api } from '../api.js';

export function renderKitchen(container) {
  container.innerHTML = `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Kitchen Orders</h1>
          <p>Live orders from tables</p>
        </div>
        <div class="count-badge" id="orderCount">…</div>
      </header>
      <div id="orderList"></div>
    </div>
  `;

  let intervalId = null;

  async function load() {
    try {
      const { orders } = await api.getOrders();
      const list = container.querySelector('#orderList');
      const badge = container.querySelector('#orderCount');
      badge.textContent = `${orders.length} order${orders.length === 1 ? '' : 's'}`;

      if (orders.length === 0) {
        list.innerHTML = `
          <div class="empty">
            <div class="empty-icon">🍳</div>
            <p>No active orders</p>
          </div>
        `;
        return;
      }

      list.innerHTML = `<div class="order-grid">${orders.map(orderCard).join('')}</div>`;

      list.querySelectorAll('[data-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const status = btn.dataset.action;
          btn.disabled = true;
          try {
            await api.updateOrderStatus(id, status);
            await load();
          } catch (e) {
            alert('Failed to update order: ' + e.message);
            btn.disabled = false;
          }
        });
      });
    } catch (e) {
      console.error(e);
      container.querySelector('#orderList').innerHTML =
        `<div class="empty"><p>Failed to load orders: ${SB.escapeHtml(e.message)}</p></div>`;
    }
  }

  function orderCard(order) {
    const isPending = order.status === 'pending';
    const timeAgo = SB.timeAgo(order.timestamp);
    const bookLine = order.bookTitle
      ? `<div class="book-line">📖 Reading: <em>${SB.escapeHtml(order.bookTitle)}</em></div>`
      : '';

    const items = (order.items || [])
      .map((item) => `
        <li>
          <span class="qty">${item.quantity}×</span>
          <span class="name">${SB.escapeHtml(item.name)}</span>
          ${item.category === 'Coffee' ? '<span class="meta">(Regular, Hot)</span>' : ''}
        </li>
      `)
      .join('');

    const actionBtn = isPending
      ? `<button class="btn btn--primary" data-id="${order.id}" data-action="preparing">Start Preparing</button>`
      : `<button class="btn btn--dark" data-id="${order.id}" data-action="ready">Mark Ready</button>`;

    return `
      <div class="order-card ${isPending ? '' : 'order-card--preparing'}">
        <div class="row-top">
          <div class="row-left">
            <span class="table-badge">Table ${order.tableNumber}</span>
            <span class="time">${timeAgo}</span>
          </div>
          <span class="status status--${order.status}">${isPending ? 'Pending' : 'Preparing'}</span>
        </div>
        ${bookLine}
        <ul class="items">${items}</ul>
        <div class="actions">${actionBtn}</div>
      </div>
    `;
  }

  load();
  intervalId = setInterval(load, 5000);

  // Clean up when the route changes
  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      if (intervalId) clearInterval(intervalId);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}