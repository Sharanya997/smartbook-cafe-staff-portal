import { api, setToken } from '../api.js';
import { navigate } from '../router.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <div class="brand-icon">📖</div>
          <h1>SmartBook Café</h1>
          <p>Staff Portal</p>
        </div>
        <form id="loginForm" class="login-form">
          <label>
            Username
            <input id="username" type="text" required autocomplete="username" />
          </label>
          <label>
            Password
            <input id="password" type="password" required autocomplete="current-password" />
          </label>
          <p id="loginError" class="error" style="display:none"></p>
          <button type="submit" id="loginBtn" class="submit-btn">Sign in</button>
        </form>
        <p class="hint">Default: staff / smartbook2024</p>
      </div>
    </div>
  `;

  const form = container.querySelector('#loginForm');
  const errorEl = container.querySelector('#loginError');
  const btn = container.querySelector('#loginBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Signing in…';

    const username = container.querySelector('#username').value.trim();
    const password = container.querySelector('#password').value;

    try {
      const res = await api.login(username, password);
      setToken(res.token);
      localStorage.setItem('staffUser', res.username);
      navigate('dashboard');
    } catch (err) {
      errorEl.textContent = err.message || 'Login failed';
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });
}