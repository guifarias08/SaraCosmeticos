// Ajuste aqui se o backend estiver em outro endereço (ex: quando publicar online)
const API_BASE = window.location.origin;

function getToken() {
  return localStorage.getItem('sara_admin_token');
}

function logout() {
  localStorage.removeItem('sara_admin_token');
  window.location.href = 'login.html';
}

// Toda página do dashboard chama isso no início: se não tiver token,
// manda direto pro login. A proteção final continua sendo o backend,
// mas isso evita a dona da loja ver a tela vazia sem estar logada.
function exigirLoginOuRedirecionar() {
  if (!getToken()) {
    window.location.href = 'login.html';
  }
}

// Wrapper de fetch que já manda o token e trata sessão expirada
async function apiFetch(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opcoes.headers || {}),
    },
  });

  if (resposta.status === 401) {
    logout();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Erro na requisição.');
  return dados;
}
