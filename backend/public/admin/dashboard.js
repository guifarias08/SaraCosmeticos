const dashboardState = {
  products: [],
  search: '',
  status: 'todos',
  toastTimer: null,
};

const dashboardElements = {};

document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
  cacheDashboardElements();
  bindDashboardEvents();

  try {
    const session = await getAdminSession();
    if (!session?.autenticado) throw new Error('Sessão inválida.');
    dashboardElements.adminName.textContent = session.admin.nome;
  } catch {
    window.location.replace('login.html');
    return;
  }

  await loadProducts();
}

function cacheDashboardElements() {
  dashboardElements.active = document.getElementById('ativo');
  dashboardElements.activeProducts = document.getElementById('activeProducts');
  dashboardElements.adminName = document.getElementById('adminName');
  dashboardElements.cancelButton = document.getElementById('cancelButton');
  dashboardElements.form = document.getElementById('productForm');
  dashboardElements.formMessage = document.getElementById('formMessage');
  dashboardElements.formTitle = document.getElementById('formTitle');
  dashboardElements.imageFile = document.getElementById('imagemArquivo');
  dashboardElements.imagePreview = document.getElementById('imagePreview');
  dashboardElements.imagePreviewElement = document.getElementById('imagePreviewElement');
  dashboardElements.imageUrl = document.getElementById('imagemUrl');
  dashboardElements.lowStockProducts = document.getElementById('lowStockProducts');
  dashboardElements.productEditor = document.getElementById('productEditor');
  dashboardElements.productId = document.getElementById('productId');
  dashboardElements.productsTable = document.getElementById('productsTable');
  dashboardElements.saveButton = document.getElementById('saveButton');
  dashboardElements.searchInput = document.getElementById('searchInput');
  dashboardElements.statusFilter = document.getElementById('statusFilter');
  dashboardElements.toast = document.getElementById('toast');
  dashboardElements.totalProducts = document.getElementById('totalProducts');
}

function bindDashboardEvents() {
  document.getElementById('logoutButton').addEventListener('click', logoutAdmin);
  document.getElementById('newProductButton').addEventListener('click', () => {
    resetProductForm();
    focusProductEditor();
  });

  dashboardElements.cancelButton.addEventListener('click', resetProductForm);
  dashboardElements.form.addEventListener('submit', saveProduct);
  dashboardElements.productsTable.addEventListener('click', handleTableAction);

  dashboardElements.searchInput.addEventListener('input', (event) => {
    dashboardState.search = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  dashboardElements.statusFilter.addEventListener('change', (event) => {
    dashboardState.status = event.target.value;
    renderProducts();
  });

  dashboardElements.imageFile.addEventListener('change', previewSelectedFile);
  dashboardElements.imageUrl.addEventListener('change', () => {
    showImagePreview(dashboardElements.imageUrl.value.trim());
  });
}

async function loadProducts() {
  setTableMessage('Carregando produtos...');

  try {
    dashboardState.products = await apiFetch('/api/produtos/admin/todos');
    renderStats();
    renderProducts();
  } catch (error) {
    setTableMessage(error.message);
  }
}

function renderStats() {
  const products = dashboardState.products;
  dashboardElements.totalProducts.textContent = String(products.length);
  dashboardElements.activeProducts.textContent = String(products.filter((product) => product.ativo).length);
  dashboardElements.lowStockProducts.textContent = String(
    products.filter((product) => product.ativo && product.quantidade_estoque <= 3).length,
  );
}

function renderProducts() {
  const products = getFilteredProducts();

  if (products.length === 0) {
    setTableMessage('Nenhum produto encontrado.');
    return;
  }

  dashboardElements.productsTable.replaceChildren(...products.map(createProductRow));
}

function getFilteredProducts() {
  return dashboardState.products.filter((product) => {
    const searchableText = [product.codigo, product.nome, product.marca, product.categoria]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = !dashboardState.search || searchableText.includes(dashboardState.search);
    const matchesStatus = dashboardState.status === 'todos'
      || (dashboardState.status === 'ativos' && product.ativo)
      || (dashboardState.status === 'inativos' && !product.ativo)
      || (dashboardState.status === 'baixo' && product.ativo && product.quantidade_estoque <= 3);

    return matchesSearch && matchesStatus;
  });
}

function createProductRow(product) {
  const row = document.createElement('tr');
  const productCell = document.createElement('td');
  const productSummary = createElement('div', 'product-summary');
  const media = createProductMedia(product);
  const text = document.createElement('div');
  const name = createElement('strong', '', product.nome);
  const meta = createElement(
    'small',
    '',
    [product.codigo, product.marca, product.categoria].filter(Boolean).join(' · '),
  );
  const priceCell = document.createElement('td');
  const stockCell = document.createElement('td');
  const statusCell = document.createElement('td');
  const actionsCell = document.createElement('td');
  const actions = createElement('div', 'row-actions');

  text.append(name, meta);
  productSummary.append(media, text);
  productCell.append(productSummary);
  priceCell.append(createPriceDisplay(product));

  stockCell.textContent = String(product.quantidade_estoque);
  if (product.quantidade_estoque <= 3) stockCell.classList.add('stock-low');

  statusCell.append(createElement(
    'span',
    `status-badge ${product.ativo ? 'status-active' : 'status-inactive'}`,
    product.ativo ? 'Publicado' : 'Oculto',
  ));

  actions.append(
    createActionButton('Editar', 'edit', product.id),
    createActionButton(product.ativo ? 'Ocultar' : 'Publicar', 'status', product.id),
  );
  actionsCell.append(actions);

  row.append(productCell, priceCell, stockCell, statusCell, actionsCell);
  return row;
}

function createProductMedia(product) {
  const media = createElement('div', 'product-thumb');

  if (!product.imagem_url) {
    media.append(createElement('span', '', getInitials(product.nome)));
    return media;
  }

  const image = document.createElement('img');
  image.src = resolveImageUrl(product.imagem_url);
  image.alt = '';
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    media.replaceChildren(createElement('span', '', getInitials(product.nome)));
  });
  media.append(image);
  return media;
}

function createPriceDisplay(product) {
  const wrapper = createElement('div', 'price-display');

  if (product.preco_promocional !== null) {
    wrapper.append(
      createElement('s', '', formatCurrency(product.preco)),
      createElement('strong', '', formatCurrency(product.preco_promocional)),
    );
  } else {
    wrapper.append(createElement('strong', '', formatCurrency(product.preco)));
  }

  return wrapper;
}

function createActionButton(label, action, productId) {
  const button = createElement('button', 'text-button', label);
  button.type = 'button';
  button.dataset.action = action;
  button.dataset.productId = String(productId);
  return button;
}

async function handleTableAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const productId = Number(button.dataset.productId);

  if (button.dataset.action === 'edit') {
    startProductEdit(productId);
    return;
  }

  if (button.dataset.action === 'status') {
    await toggleProductStatus(productId);
  }
}

function startProductEdit(productId) {
  const product = dashboardState.products.find((item) => item.id === productId);
  if (!product) return;

  dashboardElements.formTitle.textContent = 'Editar produto';
  dashboardElements.productId.value = String(product.id);
  document.getElementById('codigo').value = product.codigo;
  document.getElementById('nome').value = product.nome;
  document.getElementById('marca').value = product.marca || '';
  document.getElementById('categoria').value = product.categoria;
  document.getElementById('preco').value = product.preco;
  document.getElementById('precoPromocional').value = product.preco_promocional ?? '';
  document.getElementById('quantidade').value = product.quantidade_estoque;
  document.getElementById('descricao').value = product.descricao || '';
  dashboardElements.imageUrl.value = product.imagem_url || '';
  dashboardElements.imageFile.value = '';
  dashboardElements.active.checked = Boolean(product.ativo);
  dashboardElements.cancelButton.hidden = false;
  showImagePreview(product.imagem_url || '');
  setFormMessage('');
  focusProductEditor();
}

async function toggleProductStatus(productId) {
  const product = dashboardState.products.find((item) => item.id === productId);
  if (!product) return;

  const newStatus = !product.ativo;
  const action = newStatus ? 'publicar' : 'ocultar';

  if (!window.confirm(`Deseja ${action} "${product.nome}"?`)) return;

  try {
    await apiFetch(`/api/produtos/admin/${product.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo: newStatus }),
    });
    await loadProducts();
    showToast(`Produto ${newStatus ? 'publicado' : 'ocultado'} com sucesso.`);
  } catch (error) {
    showToast(error.message, true);
  }
}

async function saveProduct(event) {
  event.preventDefault();
  setFormMessage('');

  if (!dashboardElements.form.reportValidity()) return;

  setSaving(true);

  try {
    let imageUrl = dashboardElements.imageUrl.value.trim();
    const imageFile = dashboardElements.imageFile.files[0];

    if (imageFile) imageUrl = await uploadImage(imageFile);

    const productId = dashboardElements.productId.value;
    const payload = {
      ativo: dashboardElements.active.checked,
      categoria: document.getElementById('categoria').value,
      codigo: document.getElementById('codigo').value,
      descricao: document.getElementById('descricao').value,
      imagem_url: imageUrl,
      marca: document.getElementById('marca').value,
      nome: document.getElementById('nome').value,
      preco: document.getElementById('preco').value,
      preco_promocional: document.getElementById('precoPromocional').value,
      quantidade_estoque: document.getElementById('quantidade').value,
    };

    await apiFetch(
      productId ? `/api/produtos/admin/${productId}` : '/api/produtos/admin',
      {
        method: productId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      },
    );

    resetProductForm();
    await loadProducts();
    showToast(productId ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.');
  } catch (error) {
    setFormMessage(error.message);
  } finally {
    setSaving(false);
  }
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('imagem', file);

  const response = await apiFetch('/api/produtos/admin/upload', {
    method: 'POST',
    body: formData,
  });

  return response.url;
}

function resetProductForm() {
  dashboardElements.form.reset();
  dashboardElements.productId.value = '';
  dashboardElements.active.checked = true;
  dashboardElements.formTitle.textContent = 'Novo produto';
  dashboardElements.cancelButton.hidden = true;
  dashboardElements.imageFile.value = '';
  hideImagePreview();
  setFormMessage('');
}

function previewSelectedFile() {
  const file = dashboardElements.imageFile.files[0];
  if (!file) {
    showImagePreview(dashboardElements.imageUrl.value.trim());
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  showImagePreview(objectUrl, () => URL.revokeObjectURL(objectUrl));
}

function showImagePreview(source, onLoad) {
  if (!source) {
    hideImagePreview();
    return;
  }

  dashboardElements.imagePreviewElement.src = resolveImageUrl(source);
  dashboardElements.imagePreviewElement.onload = onLoad || null;
  dashboardElements.imagePreviewElement.onerror = hideImagePreview;
  dashboardElements.imagePreview.classList.remove('is-hidden');
}

function hideImagePreview() {
  dashboardElements.imagePreview.classList.add('is-hidden');
  dashboardElements.imagePreviewElement.removeAttribute('src');
}

function setSaving(isSaving) {
  dashboardElements.saveButton.disabled = isSaving;
  dashboardElements.cancelButton.disabled = isSaving;
  dashboardElements.saveButton.textContent = isSaving ? 'Salvando...' : 'Salvar produto';
}

function setTableMessage(message) {
  const row = document.createElement('tr');
  const cell = createElement('td', 'empty-cell', message);
  cell.colSpan = 5;
  row.append(cell);
  dashboardElements.productsTable.replaceChildren(row);
}

function setFormMessage(message) {
  dashboardElements.formMessage.textContent = message;
  dashboardElements.formMessage.hidden = !message;
}

function showToast(message, isError = false) {
  window.clearTimeout(dashboardState.toastTimer);
  dashboardElements.toast.textContent = message;
  dashboardElements.toast.classList.toggle('toast-error', isError);
  dashboardElements.toast.classList.add('is-visible');

  dashboardState.toastTimer = window.setTimeout(() => {
    dashboardElements.toast.classList.remove('is-visible');
  }, 2600);
}

function focusProductEditor() {
  dashboardElements.productEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.setTimeout(() => document.getElementById('codigo').focus(), 250);
}

function resolveImageUrl(value) {
  return value.startsWith('/') ? `${API_BASE}${value}` : value;
}

function getInitials(value) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}
