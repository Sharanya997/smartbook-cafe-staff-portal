import './router.js';
import { api, clearToken } from './api.js';
import { navigate } from './router.js';

// ============================================================
// Global logout handler
// ============================================================

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
    await api.logout();
  } catch (_) {}
  clearToken();
  navigate('login');
});

// ============================================================
// Shared UI helpers (imported by view files via window)
// ============================================================

window.SB = {
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  },
  timeAgo(dateInput) {
    if (!dateInput) return '';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  },
  formatDwell(dateInput) {
    if (!dateInput) return { text: '—', long: false };
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    return {
      text: mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`,
      long: mins > 30,
    };
  },
};