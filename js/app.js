import {
  ArrowDown, Camera, createIcons, MapPin, Menu, MessageCircle,
  Minus, Plus, Search, ShoppingBag, Trash2, X,
} from 'lucide';
import { CATALOG_FALLBACK } from './catalog-data.js';
import { getPricing, normalizeSearch } from './catalog-utils.js';
import { getProductImageUrl, isSupabaseConfigured, supabase } from './supabase.js';

window.__SARA_APP_READY = true;

const WHATSAPP_NUMBER = '558588540534';
const CART_STORAGE_KEY = 'sara-cosmeticos-cart-v2';
const CATEGORY_LABELS = {
  cabelos: 'Cabelos', corpo: 'Corpo e banho', kits: 'Kits e presentes',
  maquiagem: 'Maquiagem', outros: 'Outros', perfumaria: 'Perfumaria', skincare: 'Skincare',
};
const CATEGORY_TONES = {
  cabelos: 'gold', corpo: 'green', kits: 'lilac', maquiagem: 'coral',
  outros: 'rose', perfumaria: 'rose', skincare: 'blue',
};

let products = [];
const elements = {};
const state = {
  cart: loadCart(), catalogStatus: 'loading', currentFilter: 'todos', search: '', toastTimer: null,
};

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  cacheElements();
  setCurrentYear();
  bindEvents();
  renderProducts();
  renderCart();
  refreshIcons();
  loadProducts();
}

function cacheElements() {
  elements.cartCount = document.getElementById('cartCount');
  elements.cartDrawer = document.getElementById('cartDrawer');
  elements.cartItems = document.getElementById('cartItems');
  elements.cartTotalLabel = document.getElementById('cartTotalLabel');
  elements.cartTotal = document.getElementById('cartTotal');
  elements.catalogTools = document.querySelector('.catalog-tools');
  elements.filterList = document.querySelector('.filter-list');
  elements.menuButton = document.querySelector('[data-menu-toggle]');
  elements.navLinks = document.getElementById('navLinks');
  elements.productCount = document.getElementById('productCount');
  elements.productSearch = document.getElementById('productSearch');
  elements.productsGrid = document.getElementById('productsGrid');
  elements.toast = document.getElementById('toast');
}

function bindEvents() {
  elements.menuButton?.addEventListener('click', toggleMenu);
  document.querySelectorAll('[data-nav-link]').forEach((link) => link.addEventListener('click', closeMenu));
  document.querySelector('[data-cart-open]')?.addEventListener('click', openCart);
  document.querySelectorAll('[data-cart-close]').forEach((element) => element.addEventListener('click', closeCart));
  document.querySelector('[data-checkout]')?.addEventListener('click', checkoutOnWhatsApp);
  elements.filterList?.addEventListener('click', handleFilterAction);
  elements.productsGrid?.addEventListener('click', handleProductAction);
  elements.cartItems?.addEventListener('click', handleCartAction);
  elements.productSearch?.addEventListener('input', (event) => {
    state.search = normalizeSearch(event.target.value);
    renderProducts();
  });
  document.addEventListener('keydown', handleKeyboard);
  window.addEventListener('resize', handleResize);
}

function renderProducts() {
  if (!elements.productsGrid) return;
  if (state.catalogStatus === 'loading') return renderCatalogMessage('Carregando o catálogo...');
  if (state.catalogStatus === 'configuration-error') {
    return renderCatalogMessage('O catálogo está sendo configurado. Fale com a Sara pelo WhatsApp.');
  }
  if (state.catalogStatus === 'error') {
    return renderCatalogMessage('Não foi possível carregar o catálogo agora. Tente novamente em instantes ou fale com a Sara.');
  }

  const filteredProducts = products.filter((product) => {
    const matchesCategory = state.currentFilter === 'todos' || product.category === state.currentFilter;
    const searchable = normalizeSearch(`${product.name} ${product.brand} ${product.code}`);
    return matchesCategory && (!state.search || searchable.includes(state.search));
  });
  if (elements.productCount) {
    elements.productCount.textContent = `${filteredProducts.length} ${filteredProducts.length === 1 ? 'produto' : 'produtos'}`;
  }
  if (filteredProducts.length === 0) {
    const message = products.length === 0
      ? 'O catálogo está sendo atualizado. Fale com a Sara para consultar os produtos disponíveis.'
      : 'Nenhum produto encontrado com esses filtros.';
    renderCatalogMessage(message);
  } else {
    elements.productsGrid.replaceChildren(...filteredProducts.map(createProductCard));
  }
  refreshIcons();
}

function createProductCard(product) {
  const article = createElement('article', 'product-card');
  const info = createElement('div', 'product-info');
  const bottom = createElement('div', 'product-bottom');
  const prices = createElement('div', 'product-prices');
  const addButton = createElement('button', 'add-button');
  const addIcon = document.createElement('i');
  addButton.type = 'button';
  addButton.setAttribute('aria-label', product.available ? `Adicionar ${product.name} ao carrinho` : `${product.name} indisponível`);
  addIcon.dataset.lucide = 'plus';
  addIcon.setAttribute('aria-hidden', 'true');
  addButton.append(addIcon, createElement('span', '', 'Adicionar'));
  if (product.originalPrice) {
    prices.append(createElement('s', 'product-original-price', formatCurrency(product.originalPrice)));
    article.append(createElement('span', 'promotion-badge', 'Oferta'));
  }
  if (!product.available) article.append(createElement('span', 'availability-badge', 'Indisponível'));
  if (product.priceFrom && product.price !== null) prices.append(createElement('span', 'price-prefix', 'A partir de'));
  prices.append(createElement(
    'span',
    `product-price${product.price === null ? ' is-consult' : ''}`,
    product.price === null ? 'Consulte' : formatCurrency(product.price),
  ));
  addButton.dataset.productId = String(product.id);
  addButton.disabled = !product.available;
  bottom.append(prices, addButton);
  info.append(
    createElement('p', 'product-brand', product.brand),
    createElement('h3', 'product-name', product.name),
  );
  if (product.description) info.append(createElement('p', 'product-description', product.description));
  info.append(bottom);
  article.append(createProductVisual(product, 'product-visual'), info);
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
    const button = createElement('button', 'filter-button', category === 'todos' ? 'Todos' : (CATEGORY_LABELS[category] || category));
    button.type = 'button';
    button.dataset.filter = category;
    button.classList.toggle('is-active', category === state.currentFilter);
    button.setAttribute('aria-pressed', String(category === state.currentFilter));
    return button;
  });
  elements.filterList.replaceChildren(...filters);
  elements.filterList.hidden = products.length === 0;
  elements.catalogTools.hidden = products.length === 0;
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
  if (button) addToCart(Number(button.dataset.productId));
}

function addToCart(productId) {
  const product = findProduct(productId);
  if (!product?.available) return;
  const cartItem = state.cart.find((item) => item.productId === productId);
  if (cartItem) {
    if (cartItem.quantity >= product.stock) {
      showToast('Você já adicionou toda a quantidade disponível.');
      return;
    }
    cartItem.quantity += 1;
  } else {
    state.cart.push({ productId, quantity: 1 });
  }
  persistAndRenderCart();
  showToast(`${product.name} foi adicionado ao carrinho.`);
  openCart();
}

function renderCart() {
  if (!elements.cartItems || !elements.cartTotal || !elements.cartCount) return;
  const itemCount = state.cart.reduce((total, item) => total + item.quantity, 0);
  elements.cartCount.textContent = String(itemCount);
  elements.cartCount.classList.toggle('is-hidden', itemCount === 0);
  const hasUnpricedItems = cartHasUnpricedItems();
  const hasPricedItems = cartHasPricedItems();
  elements.cartTotal.textContent = hasUnpricedItems
    ? (hasPricedItems ? `${formatCurrency(calculateCartTotal())} + consulta` : 'A confirmar')
    : formatCurrency(calculateCartTotal());
  if (elements.cartTotalLabel) {
    elements.cartTotalLabel.textContent = hasUnpricedItems && hasPricedItems ? 'Subtotal conhecido' : 'Total estimado';
  }
  elements.cartItems.replaceChildren(...(state.cart.length ? state.cart.map(createCartItem) : [createEmptyCart()]));
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
  const details = createElement('div');
  const quantityControl = createElement('div', 'quantity-control');
  const removeButton = createIconButton({ className: 'remove-button', icon: 'trash-2', label: `Remover ${product.name}` });
  removeButton.dataset.cartAction = 'remove';
  removeButton.dataset.productId = String(product.id);
  quantityControl.append(
    createQuantityButton('minus', 'Diminuir quantidade', 'decrease', product.id),
    createElement('span', '', String(item.quantity)),
    createQuantityButton('plus', 'Aumentar quantidade', 'increase', product.id),
  );
  details.append(
    createElement('h3', 'cart-item-name', product.name),
    createElement(
      'p',
      'cart-item-price',
      product.price === null ? 'Valor a confirmar' : formatCurrency(product.price * item.quantity),
    ),
    quantityControl,
  );
  row.append(createProductVisual(product, 'cart-item-visual'), details, removeButton);
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
  const product = findProduct(productId);
  const cartItem = state.cart.find((item) => item.productId === productId);
  if (!cartItem || !product) return;
  if (button.dataset.cartAction === 'increase') cartItem.quantity = Math.min(cartItem.quantity + 1, product.stock);
  if (button.dataset.cartAction === 'decrease') cartItem.quantity -= 1;
  if (button.dataset.cartAction === 'remove' || cartItem.quantity <= 0) {
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
    return total + (product && product.price !== null ? product.price * item.quantity : 0);
  }, 0);
}

function cartHasUnpricedItems() {
  return state.cart.some((item) => findProduct(item.productId)?.price === null);
}

function cartHasPricedItems() {
  return state.cart.some((item) => findProduct(item.productId)?.price !== null);
}

function checkoutOnWhatsApp() {
  if (state.cart.length === 0) return showToast('Adicione pelo menos um produto antes de enviar o pedido.');
  const productLines = state.cart.map((item) => {
    const product = findProduct(item.productId);
    const itemPrice = product.price === null
      ? 'valor a confirmar'
      : `${product.priceFrom ? 'a partir de ' : ''}${formatCurrency(product.price * item.quantity)}`;
    return `- ${item.quantity}x ${product.name} (${product.brand}) - ${itemPrice}`;
  });
  const totalLine = cartHasUnpricedItems()
    ? (cartHasPricedItems()
      ? `Subtotal dos itens com preço: ${formatCurrency(calculateCartTotal())} (há valores a confirmar)`
      : 'Total: a confirmar')
    : `Total estimado: ${formatCurrency(calculateCartTotal())}`;
  const message = [
    'Olá, Sara! Gostaria de fazer este pedido:', '', ...productLines, '',
    totalLine, '',
    'Pode confirmar a disponibilidade e combinar a entrega comigo?',
  ].join('\n');
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
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

function toggleMenu() { setMenuOpen(!elements.navLinks?.classList.contains('is-open')); }
function closeMenu() { setMenuOpen(false); }
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
  if (event.key === 'Escape') { closeMenu(); closeCart(); }
}
function handleResize() { if (window.innerWidth > 760) closeMenu(); }

function showToast(message) {
  if (!elements.toast) return;
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  state.toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 2400);
}

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(savedCart)) return [];
    return savedCart.filter((item) => Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch { return []; }
}

async function loadProducts() {
  let catalogData = CATALOG_FALLBACK;

  if (!isSupabaseConfigured || !supabase) {
    catalogData = CATALOG_FALLBACK;
  } else {
    const { data, error } = await supabase
      .from('produtos')
      .select('id,codigo,nome,marca,categoria,preco,preco_promocional,preco_a_partir_de,quantidade_estoque,descricao,imagem_path,destaque,ordem')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true });
    if (error) console.error('Falha ao carregar o Supabase; usando o catálogo de segurança:', error.message);
    else catalogData = data;
  }

  products = catalogData.map(normalizeProduct);
  state.catalogStatus = 'ready';
  state.cart = state.cart.flatMap((item) => {
    const product = findProduct(item.productId);
    return product?.available ? [{ ...item, quantity: Math.min(item.quantity, product.stock) }] : [];
  });
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  renderFilters();
  renderProducts();
  renderCart();
}

function normalizeProduct(product) {
  const pricing = getPricing(product.preco, product.preco_promocional);
  return {
    available: Number(product.quantidade_estoque) > 0,
    brand: String(product.marca || 'Sara Cosméticos'), category: String(product.categoria || 'outros'),
    code: String(product.codigo || ''), description: String(product.descricao || ''), id: Number(product.id),
    imageUrl: getProductImageUrl(product.imagem_path), name: String(product.nome || 'Produto'),
    ...pricing,
    priceFrom: Boolean(product.preco_a_partir_de),
    stock: Math.max(0, Number(product.quantidade_estoque) || 0), tone: CATEGORY_TONES[product.categoria] || 'rose',
  };
}

function createProductVisual(product, className) {
  const visual = createElement('div', `${className} tone-${product.tone}`);
  if (!product.imageUrl) { visual.textContent = product.brand; return visual; }
  const image = createElement('img', 'product-image');
  image.src = product.imageUrl;
  image.alt = product.name;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', () => visual.replaceChildren(document.createTextNode(product.brand)), { once: true });
  visual.append(image);
  return visual;
}

function renderCatalogMessage(message) { elements.productsGrid?.replaceChildren(createElement('p', 'empty-products', message)); }
function findProduct(productId) { return products.find((product) => product.id === productId); }
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
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function refreshIcons() {
  createIcons({
    icons: { ArrowDown, Camera, MapPin, Menu, MessageCircle, Minus, Plus, Search, ShoppingBag, Trash2, X },
  });
}
