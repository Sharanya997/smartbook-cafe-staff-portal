// ============================================================
// Hash router — no build step, no dependencies
// ============================================================

import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderKitchen } from './views/kitchen.js';
import { renderLibrary } from './views/library.js';
import { renderCatalog } from './views/catalog.js';

const routes = {
  login: { view: renderLogin, public: true },
  dashboard: { view: renderDashboard },
  kitchen: { view: renderKitchen },
  library: { view: renderLibrary },
  catalog: { view: renderCatalog },
};

const sidebar = document.getElementById('sidebar');
const main = document.getElementById('main');

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash || 'dashboard';
}

function setActiveNav(route) {
  document.querySelectorAll('.nav-link').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}

export function navigate(route) {
  window.location.hash = `#/${route}`;
}

export function handleRoute() {
  const routeName = parseHash();
  const route = routes[routeName];

  if (!route) {
    navigate('dashboard');
    return;
  }

  const hasToken = !!localStorage.getItem('staffToken');

  if (!route.public && !hasToken) {
    navigate('login');
    return;
  }

  if (route.public && hasToken) {
    navigate('dashboard');
    return;
  }

  if (routeName === 'login') {
    sidebar.classList.add('hidden');
    main.classList.add('main--no-sidebar');
  } else {
    sidebar.classList.remove('hidden');
    main.classList.remove('main--no-sidebar');
    setActiveNav(routeName);
  }

  main.innerHTML = '';
  route.view(main);
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);