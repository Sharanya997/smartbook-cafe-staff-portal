import { api } from '../api.js';
import { navigate } from '../router.js';

export async function renderDashboard(container) {
  container.innerHTML = `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, staff</p>
        </div>
      </header>
      <div class="stat-grid">
        <div class="stat-card" data-nav="kitchen">
          <div class="stat-icon" style="background: rgba(145, 183, 190, 0.15)">🍳</div>
          <div>
            <div class="stat-value" id="statOrders">—</div>
            <div class="stat-label">Active Orders</div>
          </div>
        </div>
        <div class="stat-card" data-nav="library">
          <div class="stat-icon" style="background: rgba(76, 175, 80, 0.15)">📚</div>
          <div>
            <div class="stat-value" id="statBooks">—</div>
            <div class="stat-label">Books at Tables</div>
          </div>
        </div>
        <div class="stat-card" data-nav="catalog">
          <div class="stat-icon" style="background: rgba(255, 179, 0, 0.15)">📖</div>
          <div>
            <div class="stat-value" id="statCatalog">—</div>
            <div class="stat-label">Books in Catalog</div>
          </div>
        </div>
      </div>
      <div class="quick-links">
        <h2>Quick Actions</h2>
        <div class="quick-grid">
          <button class="quick-btn" data-nav="kitchen">
            <span>🍳</span>
            <div>
              <div class="quick-title">Kitchen Display</div>
              <div class="quick-sub">Manage live orders</div>
            </div>
          </button>
          <button class="quick-btn" data-nav="library">
            <span>📚</span>
            <div>
              <div class="quick-title">Library Monitor</div>
              <div class="quick-sub">Track books at tables</div>
            </div>
          </button>
          <button class="quick-btn" data-nav="catalog">
            <span>📖</span>
            <div>
              <div class="quick-title">Book Catalog</div>
              <div class="quick-sub">Add, edit or remove books</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.nav));
  });

  try {
    const stats = await api.getStats();
    container.querySelector('#statOrders').textContent = stats.activeOrders ?? 0;
    container.querySelector('#statBooks').textContent = stats.booksAtTables ?? 0;
    container.querySelector('#statCatalog').textContent = stats.catalogSize ?? 0;
  } catch (e) {
    console.error(e);
  }
}