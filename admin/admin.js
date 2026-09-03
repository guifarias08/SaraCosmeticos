import { getProductImageUrl, isSupabaseConfigured, PRODUCT_IMAGE_BUCKET, supabase } from '../js/supabase.js';
import { normalizeSearch } from '../js/catalog-utils.js';

const state = { products: [], search: '', toastTimer: null, previewUrl: '' };
const elements = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheElements();
  bindEvents();

  if (!isSupabaseConfigured || !supabase) {
    setMessage(elements.loginMessage, 'Configure o Supabase antes de acessar o painel.');
    elements.loginForm.querySelector('button').disabled = true;
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (!error && data.session && isAdmin(data.session.user)) {
    await openDashboard(data.session.user);
  }
}

function cacheElements() {
  elements.activeProducts = document.getElementById('activeProducts');
  elements.adminEmail = document.getElementById('adminEmail');
  elements.cancelButton = document.getElementById('cancelButton');
  elements.currentImagePath = document.getElementById('currentImagePath');
  elements.dashboardView = document.getElementById('dashboardView');
  elements.editorPanel = document.getElementById('editorPanel');
  elements.editorTitle = document.getElementById('editorTitle');
  elements.imageInput = document.getElementById('imagem');
  elements.imagePreview = document.getElementById('imagePreview');
  elements.imagePreviewElement = document.getElementById('imagePreviewElement');
  elements.loginForm = document.getElementById('loginForm');
  elements.loginMessage = document.getElementById('loginMessage');
  elements.loginView = document.getElementById('loginView');
  elements.lowStockProducts = document.getElementById('lowStockProducts');
  elements.productForm = document.getElementById('productForm');
  elements.productList = document.getElementById('productList');
  elements.productMessage = document.getElementById('productMessage');
  elements.saveButton = document.getElementById('saveButton');
  elements.search = document.getElementById('adminSearch');
  elements.toast = document.getElementById('adminToast');
  elements.totalProducts = document.getElementById('totalProducts');
}

function bindEvents() {
  elements.loginForm.addEventListener('submit', login);
  elements.productForm.addEventListener('submit', saveProduct);
  elements.productList.addEventListener('click', handleProductAction);
  elements.cancelButton.addEventListener('click', resetForm);
  elements.imageInput.addEventListener('change', previewImage);
  elements.search.addEventListener('input', (event) => {
    state.search = normalizeSearch(event.target.value);
    renderProducts();
  });
  document.getElementById('logoutButton').addEventListener('click', logout);
  document.getElementById('newProductButton').addEventListener('click', () => {
    resetForm();
    focusEditor();
  });
}

async function login(event) {
  event.preventDefault();
  setMessage(elements.loginMessage, '');
  setLoginBusy(true);

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user || !isAdmin(data.user)) {
    if (data.user) await supabase.auth.signOut();
    setMessage(elements.loginMessage, 'E-mail ou senha inválidos, ou acesso administrativo não autorizado.');
    setLoginBusy(false);
    return;
  }

  elements.loginForm.reset();
  await openDashboard(data.user);
  setLoginBusy(false);
}

async function openDashboard(user) {
  elements.adminEmail.textContent = user.email || 'Administradora';
  elements.loginView.hidden = true;
  elements.dashboardView.hidden = false;
  await loadProducts();
}

async function logout() {
  await supabase.auth.signOut();
  state.products = [];
  elements.dashboardView.hidden = true;
  elements.loginView.hidden = false;
  document.getElementById('loginEmail').focus();
}

function isAdmin(user) {
  return user?.app_metadata?.role === 'admin';
}

async function loadProducts() {
  elements.productList.replaceChildren(createElement('p', 'empty', 'Carregando produtos...'));
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('atualizado_em', { ascending: false });

  if (error) {
    if (error.code === 'PGRST301' || error.message.toLowerCase().includes('jwt')) await logout();
    elements.productList.replaceChildren(createElement('p', 'empty', 'Não foi possível carregar o catálogo.'));
    showToast(error.message);
    return;
  }

  state.products = data;
  renderStats();
  renderProducts();
}

function renderStats() {
  elements.totalProducts.textContent = String(state.products.length);
  elements.activeProducts.textContent = String(state.products.filter((product) => product.ativo).length);
  elements.lowStockProducts.textContent = String(
    state.products.filter((product) => product.ativo && product.quantidade_estoque <= 3).length,
  );
}

function renderProducts() {
  const filtered = state.products.filter((product) => normalizeSearch(
    `${product.codigo} ${product.nome} ${product.marca} ${product.categoria}`,
  ).includes(state.search));

  if (!filtered.length) {
    elements.productList.replaceChildren(createElement('p', 'empty', 'Nenhum produto encontrado.'));
    return;
  }
  elements.productList.replaceChildren(...filtered.map(createProductRow));
}

function createProductRow(product) {
  const row = createElement('article', 'product-row');
  const thumb = createElement('div', 'product-thumb');
  const imageUrl = getProductImageUrl(product.imagem_path);
  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('error', () => thumb.replaceChildren(document.createTextNode(getInitials(product.nome))), { once: true });
    thumb.append(image);
  } else {
    thumb.textContent = getInitials(product.nome);
  }

  const copy = createElement('div', 'product-copy');
  copy.append(
    createElement('strong', '', product.nome),
    createElement('small', '', `${product.codigo} · ${product.marca} · ${formatProductPrice(product)} · estoque ${product.quantidade_estoque}`),
    createElement('span', `status${product.ativo ? '' : ' off'}`, product.ativo ? 'Publicado' : 'Oculto'),
  );

  const actions = createElement('div', 'row-actions');
  actions.append(
    createActionButton('Editar', 'edit', product.id),
    createActionButton(product.ativo ? 'Ocultar' : 'Publicar', 'toggle', product.id),
  );
  row.append(thumb, copy, actions);
  return row;
}

function createActionButton(label, action, productId) {
  const button = createElement('button', 'text-button', label);
  button.type = 'button';
  button.dataset.action = action;
  button.dataset.productId = String(productId);
  return button;
}

async function handleProductAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const product = state.products.find((item) => item.id === Number(button.dataset.productId));
  if (!product) return;
  if (button.dataset.action === 'edit') editProduct(product);
  if (button.dataset.action === 'toggle') await toggleProduct(product, button);
}

function editProduct(product) {
  elements.editorTitle.textContent = 'Editar produto';
  document.getElementById('productId').value = product.id;
  elements.currentImagePath.value = product.imagem_path || '';
  document.getElementById('codigo').value = product.codigo;
  document.getElementById('nome').value = product.nome;
  document.getElementById('marca').value = product.marca;
  document.getElementById('categoria').value = product.categoria;
  document.getElementById('preco').value = product.preco ?? '';
  document.getElementById('precoPromocional').value = product.preco_promocional ?? '';
  document.getElementById('precoAPartirDe').checked = product.preco_a_partir_de;
  document.getElementById('estoque').value = product.quantidade_estoque;
  document.getElementById('ordem').value = product.ordem;
  document.getElementById('descricao').value = product.descricao || '';
  document.getElementById('ativo').checked = product.ativo;
  document.getElementById('destaque').checked = product.destaque;
  elements.cancelButton.hidden = false;
  showPreview(getProductImageUrl(product.imagem_path));
  setMessage(elements.productMessage, '');
  focusEditor();
}

async function toggleProduct(product, button) {
  button.disabled = true;
  const { error } = await supabase.from('produtos').update({ ativo: !product.ativo }).eq('id', product.id);
  if (error) showToast(error.message);
  else {
    showToast(product.ativo ? 'Produto ocultado.' : 'Produto publicado.');
    await loadProducts();
  }
  button.disabled = false;
}

async function saveProduct(event) {
  event.preventDefault();
  if (!elements.productForm.reportValidity()) return;
  setMessage(elements.productMessage, '');

  const priceValue = document.getElementById('preco').value;
  const price = priceValue === '' ? null : Number(priceValue);
  const promotionalValue = document.getElementById('precoPromocional').value;
  const promotionalPrice = promotionalValue === '' ? null : Number(promotionalValue);
  if (promotionalPrice !== null && (price === null || promotionalPrice >= price)) {
    setMessage(elements.productMessage, 'O preço promocional deve ser menor que o preço normal.');
    return;
  }

  setSaving(true);
  let uploadedPath = '';
  const previousImagePath = elements.currentImagePath.value;

  try {
    const file = elements.imageInput.files[0];
    if (file) uploadedPath = await uploadImage(file);
    const payload = {
      ativo: document.getElementById('ativo').checked,
      categoria: document.getElementById('categoria').value,
      codigo: document.getElementById('codigo').value.trim(),
      descricao: document.getElementById('descricao').value.trim() || null,
      destaque: document.getElementById('destaque').checked,
      imagem_path: uploadedPath || previousImagePath || null,
      marca: document.getElementById('marca').value.trim(),
      nome: document.getElementById('nome').value.trim(),
      ordem: Number(document.getElementById('ordem').value),
      preco: price,
      preco_a_partir_de: price !== null && document.getElementById('precoAPartirDe').checked,
      preco_promocional: promotionalPrice,
      quantidade_estoque: Number(document.getElementById('estoque').value),
    };
    const id = document.getElementById('productId').value;
    const query = id
      ? supabase.from('produtos').update(payload).eq('id', Number(id)).select().single()
      : supabase.from('produtos').insert(payload).select().single();
    const { error } = await query;
    if (error) throw error;

    if (uploadedPath && previousImagePath && !previousImagePath.startsWith('https://')) {
      const { error: removeError } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([previousImagePath]);
      if (removeError) console.warn('A imagem anterior não pôde ser removida:', removeError.message);
    }
    showToast(id ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');
    resetForm();
    await loadProducts();
  } catch (error) {
    if (uploadedPath) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([uploadedPath]);
    setMessage(elements.productMessage, friendlyError(error));
  } finally {
    setSaving(false);
  }
}

async function uploadImage(file) {
  const allowedTypes = new Map([
    ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'],
  ]);
  if (!allowedTypes.has(file.type)) throw new Error('Use uma imagem JPG, PNG ou WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 5 MB.');

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Sua sessão expirou. Entre novamente.');
  const path = `${userData.user.id}/${crypto.randomUUID()}.${allowedTypes.get(file.type)}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
    cacheControl: '31536000', contentType: file.type, upsert: false,
  });
  if (error) throw error;
  return path;
}

function previewImage() {
  const file = elements.imageInput.files[0];
  if (!file) {
    showPreview(getProductImageUrl(elements.currentImagePath.value));
    return;
  }
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.previewUrl = URL.createObjectURL(file);
  showPreview(state.previewUrl);
}

function showPreview(url) {
  if (!url) {
    elements.imagePreview.hidden = true;
    elements.imagePreviewElement.removeAttribute('src');
    return;
  }
  elements.imagePreviewElement.src = url;
  elements.imagePreview.hidden = false;
}

function resetForm() {
  elements.productForm.reset();
  document.getElementById('productId').value = '';
  elements.currentImagePath.value = '';
  document.getElementById('marca').value = 'Sara Cosméticos';
  document.getElementById('estoque').value = '1';
  document.getElementById('ordem').value = '0';
  document.getElementById('ativo').checked = true;
  document.getElementById('precoAPartirDe').checked = false;
  elements.editorTitle.textContent = 'Novo produto';
  elements.cancelButton.hidden = true;
  showPreview('');
  setMessage(elements.productMessage, '');
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.previewUrl = '';
}

function focusEditor() {
  elements.editorPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => document.getElementById('codigo').focus(), 250);
}

function setLoginBusy(busy) {
  const button = elements.loginForm.querySelector('button');
  button.disabled = busy;
  button.textContent = busy ? 'Entrando...' : 'Entrar';
}

function setSaving(busy) {
  elements.saveButton.disabled = busy;
  elements.cancelButton.disabled = busy;
  elements.saveButton.textContent = busy ? 'Salvando...' : 'Salvar produto';
}

function setMessage(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('visible');
  state.toastTimer = window.setTimeout(() => elements.toast.classList.remove('visible'), 2800);
}

function friendlyError(error) {
  if (error?.code === '23505') return 'Já existe um produto com esse código.';
  if (error?.code === '23514') return 'Revise os valores informados.';
  return error?.message || 'Não foi possível salvar o produto.';
}

function getInitials(value) {
  return String(value).split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatProductPrice(product) {
  const value = product.preco_promocional ?? product.preco;
  if (value == null) return 'Consulte';
  return `${product.preco_a_partir_de ? 'a partir de ' : ''}${formatCurrency(value)}`;
}

function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}
