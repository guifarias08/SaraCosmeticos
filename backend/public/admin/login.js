document.addEventListener('DOMContentLoaded', initLogin);

async function initLogin() {
  const form = document.getElementById('loginForm');
  const button = document.getElementById('loginButton');
  const message = document.getElementById('loginMessage');

  try {
    const session = await getAdminSession();
    if (session?.autenticado) {
      window.location.replace('dashboard.html');
      return;
    }
  } catch {
    // A ausência de sessão é esperada na tela de login.
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage(message, '');

    if (!form.reportValidity()) return;

    button.disabled = true;
    button.textContent = 'Entrando...';

    try {
      await apiFetch('/api/admin/login', {
        method: 'POST',
        redirectOnUnauthorized: false,
        body: JSON.stringify({
          email: document.getElementById('email').value,
          senha: document.getElementById('senha').value,
        }),
      });
      window.location.replace('dashboard.html');
    } catch (error) {
      setMessage(message, error.message);
    } finally {
      button.disabled = false;
      button.textContent = 'Entrar no painel';
    }
  });
}

function setMessage(element, text) {
  element.textContent = text;
  element.hidden = !text;
}
