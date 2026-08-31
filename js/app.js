const WHATSAPP_NUMBER = '558588540534';
const CART_STORAGE_KEY = 'sara-cosmeticos-cart';
const API_ORIGIN = resolveApiOrigin();
const CATEGORY_LABELS = {
  cabelos: 'Cabelos',
  corpo: 'Corpo',
  kits: 'Kits',
  maquiagem: 'Maquiagem',
  outros: 'Outros',
  perfumaria: 'Perfumaria',
  skincare: 'Skincare',
};
const CATEGORY_TONES = {
  cabelos: 'gold',
  corpo: 'green',
  kits: 'lilac',
  maquiagem: 'coral',
  outros: 'rose',
  perfumaria: 'rose',
  skincare: 'blue',
};

let products = [];

const state = {
  cart: loadCart(),
  catalogStatus: 'loading',
  currentFilter: 'todos',
  toastTimer: null,
};

const elements = {};

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  cacheElements();
  setCurrentYear();
  bindEvents();
  renderProducts();
  renderCart();
  initRevealAnimations();
  refreshIcons();
  loadProducts();
}

function cacheElements() {
  elements.cartCount = document.getElementById('cartCount');
  elements.cartDrawer = document.getElementById('cartDrawer');
  elements.cartItems = document.getElementById('cartItems');
  elements.cartTotal = document.getElementById('cartTotal');
  elements.filterList = document.querySelector('.filter-list');
  elements.menuButton = document.querySelector('[data-menu-toggle]');
  elements.navLinks = document.getElementById('navLinks');
  elements.productsGrid = document.getElementById('productsGrid');
  elements.toast = document.getElementById('toast');
}

function bindEvents() {
  elements.menuButton?.addEventListener('click', toggleMenu);

  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.querySelector('[data-cart-open]')?.addEventListener('click', openCart);

  document.querySelectorAll('[data-cart-close]').forEach((element) => {
    element.addEventListener('click', closeCart);
  });

  document.querySelector('[data-checkout]')?.addEventListener('click', checkoutOnWhatsApp);

  elements.filterList?.addEventListener('click', handleFilterAction);

  elements.productsGrid?.addEventListener('click', handleProductAction);
  elements.cartItems?.addEventListener('click', handleCartAction);

  document.addEventListener('keydown', handleKeyboard);
  window.addEventListener('resize', handleResize);
}

function renderProducts() {
  if (!elements.productsGrid) return;

  if (state.catalogStatus === 'loading') {
    renderCatalogMessage('Carregando o catálogo...');
    return;
  }

  if (state.catalogStatus === 'error') {
    renderCatalogMessage('Não foi possível carregar o catálogo agora. Fale com a Sara pelo WhatsApp.');
    return;
  }

  const filteredProducts = state.currentFilter === 'todos'
    ? products
    : products.filter((product) => product.category === state.currentFilter);

  const cards = filteredProducts.map(createProductCard);

  if (cards.length === 0) {
    const message = products.length === 0
      ? 'O catálogo está sendo atualizado. Fale com a Sara para consultar os produtos disponíveis.'
      : 'Nenhum produto encontrado nesta categoria.';
    renderCatalogMessage(message);
  } else {
    elements.productsGrid.replaceChildren(...cards);
  }

  refreshIcons();
}

function createProductCard(product) {
  const article = createElement('article', 'product-card');
  const visual = createProductVisual(product, 'product-visual');
  const info = createElement('div', 'product-info');
  const brand = createElement('p', 'product-brand', product.brand);
  const name = createElement('h3', 'product-name', product.name);
  const bottom = createElement('div', 'product-bottom');
  const prices = createElement('div', 'product-prices');
  const price = createElement('span', 'product-price', formatCurrency(product.price));
  const addButton = createIconButton({
    className: 'add-button',
    icon: 'plus',
    label: product.available
      ? `Adicionar ${product.name} ao carrinho`
      : `${product.name} indisponível`,
  });

  if (product.originalPrice) {
    prices.append(createElement('s', 'product-original-price', formatCurrency(product.originalPrice)));
  }
  prices.append(price);
  addButton.dataset.productId = String(product.id);
  addButton.disabled = !product.available;
  bottom.append(prices, addButton);
  info.append(brand, name, bottom);
  article.append(visual, info);

  return article;
}

function handleFilterAction(event) {
  const button = event.target.closest('[data-filter]');
  if (button) setFilter(button.dataset.filter);
}

function renderFilters() {
  if (!elements.filterList) return;

  const categories = [...new Set(products.map((product) => product.category))];
  const filters = ['todos', ...categories].map((category) => {
    const label = category === 'todos' ? 'Todos' : (CATEGORY_LABELS[category] || category);
    const button = createElement('button', 'filter-button', label);
    button.type = 'button';
    button.dataset.filter = category;
    button.classList.toggle('is-active', category === state.currentFilter);
    button.setAttribute('aria-pressed', String(category === state.currentFilter));
    return button;
  });

  elements.filterList.replaceChildren(...filters);
  elements.filterList.hidden = products.length === 0;
}

function setFilter(filter) {
  state.currentFilter = filter;

  document.querySelectorAll('[data-filter]').forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  renderProducts();
}

function handleProductAction(event) {
  const button = event.target.closest('[data-product-id]');
  if (!button) return;

  addToCart(Number(button.dataset.productId));
}

function addToCart(productId) {
  const product = findProduct(productId);
  if (!product || !product.available) return;

  const cartItem = state.cart.find((item) => item.productId === productId);

  if (cartItem) {
    cartItem.quantity += 1;
  } else {
    state.cart.push({ productId, quantity: 1 });
  }

  persistAndRenderCart();
  showToast(`${product.name} foi adicionado ao carrinho.`);
}

function renderCart() {
  if (!elements.cartItems || !elements.cartTotal || !elements.cartCount) return;

  const itemCount = state.cart.reduce((total, item) => total + item.quantity, 0);
  const total = calculateCartTotal();

  elements.cartCount.textContent = String(itemCount);
  elements.cartCount.classList.toggle('is-hidden', itemCount === 0);
  elements.cartTotal.textContent = formatCurrency(total);

  if (state.cart.length === 0) {
    elements.cartItems.replaceChildren(createEmptyCart());
  } else {
    elements.cartItems.replaceChildren(...state.cart.map(createCartItem));
  }

  refreshIcons();
}

function createEmptyCart() {
  const empty = createElement('div', 'cart-empty');
  const content = createElement('div');
  const icon = document.createElement('i');

  icon.dataset.lucide = 'shopping-bag';
  icon.setAttribute('aria-hidden', 'true');
  content.append(icon, createElement('p', '', 'Seu carrinho está vazio.'));
  empty.append(content);

  return empty;
}

function createCartItem(item) {
  const product = findProduct(item.productId);
  if (!product) return document.createDocumentFragment();

  const row = createElement('article', 'cart-item');
  const visual = createProductVisual(product, 'cart-item-visual');
  const details = createElement('div');
  const name = createElement('h3', 'cart-item-name', product.name);
  const price = createElement(
    'p',
    'cart-item-price',
    formatCurrency(product.price * item.quantity),
  );
  const quantityControl = createElement('div', 'quantity-control');
  const decreaseButton = createQuantityButton('minus', 'Diminuir quantidade', 'decrease', product.id);
  const increaseButton = createQuantityButton('plus', 'Aumentar quantidade', 'increase', product.id);
  const quantity = createElement('span', '', String(item.quantity));
  const removeButton = createIconButton({
    className: 'remove-button',
    icon: 'trash-2',
    label: `Remover ${product.name}`,
  });

  removeButton.dataset.cartAction = 'remove';
  removeButton.dataset.productId = String(product.id);

  quantityControl.append(decreaseButton, quantity, increaseButton);
  details.append(name, price, quantityControl);
  row.append(visual, details, removeButton);

  return row;
}

function createQuantityButton(icon, label, action, productId) {
  const button = createIconButton({ icon, label });
  button.dataset.cartAction = action;
  button.dataset.productId = String(productId);
  return button;
}

function handleCartAction(event) {
  const button = event.target.closest('[data-cart-action]');
  if (!button) return;

  const productId = Number(button.dataset.productId);
  const action = button.dataset.cartAction;
  const cartItem = state.cart.find((item) => item.productId === productId);
  if (!cartItem) return;

  if (action === 'increase') cartItem.quantity += 1;
  if (action === 'decrease') cartItem.quantity -= 1;

  if (action === 'remove' || cartItem.quantity <= 0) {
    state.cart = state.cart.filter((item) => item.productId !== productId);
  }

  persistAndRenderCart();
}

function persistAndRenderCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  renderCart();
}

function calculateCartTotal() {
  return state.cart.reduce((total, item) => {
    const product = findProduct(item.productId);
    return total + (product ? product.price * item.quantity : 0);
  }, 0);
}

function checkoutOnWhatsApp() {
  if (state.cart.length === 0) {
    showToast('Adicione pelo menos um produto antes de enviar o pedido.');
    return;
  }

  const productLines = state.cart.map((item) => {
    const product = findProduct(item.productId);
    const subtotal = product.price * item.quantity;
    return `- ${item.quantity}x ${product.name} (${product.brand}) - ${formatCurrency(subtotal)}`;
  });

  const message = [
    'Olá, Sara! Gostaria de fazer este pedido:',
    '',
    ...productLines,
    '',
    `Total estimado: ${formatCurrency(calculateCartTotal())}`,
    '',
    'Pode confirmar a disponibilidade e combinar a entrega comigo?',
  ].join('\n');

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

function openCart() {
  closeMenu();
  document.querySelector('.cart-overlay')?.classList.add('is-open');
  elements.cartDrawer?.classList.add('is-open');
  elements.cartDrawer?.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  elements.cartDrawer?.querySelector('[data-cart-close]')?.focus();
}

function closeCart() {
  document.querySelector('.cart-overlay')?.classList.remove('is-open');
  elements.cartDrawer?.classList.remove('is-open');
  elements.cartDrawer?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
}

function toggleMenu() {
  const shouldOpen = !elements.navLinks?.classList.contains('is-open');
  setMenuOpen(shouldOpen);
}

function closeMenu() {
  setMenuOpen(false);
}

function setMenuOpen(isOpen) {
  elements.navLinks?.classList.toggle('is-open', isOpen);
  elements.menuButton?.setAttribute('aria-expanded', String(isOpen));

  if (elements.menuButton) {
    elements.menuButton.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'menu'}" aria-hidden="true"></i>`;
    elements.menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    refreshIcons();
  }
}

function handleKeyboard(event) {
  if (event.key !== 'Escape') return;
  closeMenu();
  closeCart();
}

function handleResize() {
  if (window.innerWidth > 760) closeMenu();
}

function initRevealAnimations() {
  const revealElements = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => observer.observe(element));
}

function showToast(message) {
  if (!elements.toast) return;

  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');

  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove('is-visible');
  }, 2400);
}

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(savedCart)) return [];

    return savedCart.filter((item) => (
      Number.isInteger(item.productId)
      && Number.isInteger(item.quantity)
      && item.quantity > 0
    ));
  } catch {
    return [];
  }
}

async function loadProducts() {
  try {
    const response = await fetch(`${API_ORIGIN}/api/produtos`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`API respondeu com status ${response.status}`);

    const catalog = await response.json();
    if (!Array.isArray(catalog)) throw new Error('Formato de catálogo inválido');

    products = catalog.map(normalizeProduct);
    state.catalogStatus = 'ready';
    state.cart = state.cart.filter((item) => {
      const product = findProduct(item.productId);
      return product?.available;
    });
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    renderFilters();
    renderProducts();
    renderCart();
  } catch (error) {
    console.error('Falha ao carregar produtos:', error);
    state.catalogStatus = 'error';
    products = [];
    renderFilters();
    renderProducts();
    renderCart();
  }
}

function normalizeProduct(product) {
  const regularPrice = Number(product.preco);
  const promotionalPrice = product.preco_promocional == null
    ? null
    : Number(product.preco_promocional);
  const hasPromotion = Number.isFinite(promotionalPrice) && promotionalPrice < regularPrice;

  return {
    available: Boolean(product.disponivel),
    brand: String(product.marca || 'Sara Cosméticos'),
    category: String(product.categoria || 'outros'),
    id: Number(product.id),
    imageUrl: resolveImageUrl(product.imagem_url),
    name: String(product.nome || 'Produto'),
    originalPrice: hasPromotion ? regularPrice : null,
    price: hasPromotion ? promotionalPrice : regularPrice,
    tone: CATEGORY_TONES[product.categoria] || 'rose',
  };
}

function createProductVisual(product, className) {
  const visual = createElement('div', `${className} tone-${product.tone}`);

  if (!product.imageUrl) {
    visual.textContent = product.brand;
    return visual;
  }

  const image = createElement('img', 'product-image');
  image.src = product.imageUrl;
  image.alt = product.name;
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    visual.replaceChildren(document.createTextNode(product.brand));
  }, { once: true });
  visual.append(image);
  return visual;
}

function renderCatalogMessage(message) {
  elements.productsGrid?.replaceChildren(createElement('p', 'empty-products', message));
}

function resolveApiOrigin() {
  const configuredOrigin = document.querySelector('meta[name="api-origin"]')?.content.trim();
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, '');

  const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    && window.location.port !== '3000';
  return isLocalPreview || window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
}

function resolveImageUrl(imageUrl) {
  const value = String(imageUrl || '').trim();
  if (!value || /^https:\/\//i.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
}

function findProduct(productId) {
  return products.find((product) => product.id === productId);
}

function setCurrentYear() {
  const year = document.getElementById('currentYear');
  if (year) year.textContent = String(new Date().getFullYear());
}

function createElement(tagName, className = '', text = '') {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function createIconButton({ className = '', icon, label }) {
  const button = createElement('button', className);
  const iconElement = document.createElement('i');

  button.type = 'button';
  button.setAttribute('aria-label', label);
  iconElement.dataset.lucide = icon;
  iconElement.setAttribute('aria-hidden', 'true');
  button.append(iconElement);

  return button;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function refreshIcons() {
  window.lucide?.createIcons();
}
