const WHATSAPP_NUMBER = '558588540534';
const CART_STORAGE_KEY = 'sara-cosmeticos-cart';

// Catálogo demonstrativo. Na integração com o backend, estes dados virão da API.
const products = [
  {
    id: 1,
    name: 'Body Splash Floral',
    brand: 'Avon',
    category: 'perfumaria',
    price: 49.9,
    tone: 'rose',
  },
  {
    id: 2,
    name: 'Perfume Feminino',
    brand: 'Eudora',
    category: 'perfumaria',
    price: 129.9,
    tone: 'lilac',
  },
  {
    id: 3,
    name: 'Colônia Masculina',
    brand: 'O Boticário',
    category: 'perfumaria',
    price: 139.9,
    tone: 'blue',
  },
  {
    id: 4,
    name: 'Hidratante Corporal',
    brand: 'Natura',
    category: 'corpo',
    price: 44.9,
    tone: 'green',
  },
  {
    id: 5,
    name: 'Kit de Cuidados',
    brand: 'O Boticário',
    category: 'corpo',
    price: 89.9,
    tone: 'gold',
  },
  {
    id: 6,
    name: 'Batom Cremoso',
    brand: 'Avon',
    category: 'maquiagem',
    price: 29.9,
    tone: 'coral',
  },
  {
    id: 7,
    name: 'Máscara para Cílios',
    brand: 'Eudora',
    category: 'maquiagem',
    price: 39.9,
    tone: 'blue',
  },
  {
    id: 8,
    name: 'Sabonete em Barra',
    brand: 'Natura',
    category: 'corpo',
    price: 24.9,
    tone: 'green',
  },
];

const state = {
  cart: loadCart(),
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
}

function cacheElements() {
  elements.cartCount = document.getElementById('cartCount');
  elements.cartDrawer = document.getElementById('cartDrawer');
  elements.cartItems = document.getElementById('cartItems');
  elements.cartTotal = document.getElementById('cartTotal');
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

  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => setFilter(button.dataset.filter));
  });

  elements.productsGrid?.addEventListener('click', handleProductAction);
  elements.cartItems?.addEventListener('click', handleCartAction);

  document.addEventListener('keydown', handleKeyboard);
  window.addEventListener('resize', handleResize);
}

function renderProducts() {
  if (!elements.productsGrid) return;

  const filteredProducts = state.currentFilter === 'todos'
    ? products
    : products.filter((product) => product.category === state.currentFilter);

  const cards = filteredProducts.map(createProductCard);

  if (cards.length === 0) {
    elements.productsGrid.replaceChildren(
      createElement('p', 'empty-products', 'Nenhum produto encontrado nesta categoria.'),
    );
  } else {
    elements.productsGrid.replaceChildren(...cards);
  }

  refreshIcons();
}

function createProductCard(product) {
  const article = createElement('article', 'product-card');
  const visual = createElement('div', `product-visual tone-${product.tone}`, product.brand);
  const info = createElement('div', 'product-info');
  const brand = createElement('p', 'product-brand', product.brand);
  const name = createElement('h3', 'product-name', product.name);
  const bottom = createElement('div', 'product-bottom');
  const price = createElement('span', 'product-price', formatCurrency(product.price));
  const addButton = createIconButton({
    className: 'add-button',
    icon: 'plus',
    label: `Adicionar ${product.name} ao carrinho`,
  });

  addButton.dataset.productId = String(product.id);
  bottom.append(price, addButton);
  info.append(brand, name, bottom);
  article.append(visual, info);

  return article;
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
  if (!product) return;

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
  const visual = createElement('div', `cart-item-visual tone-${product.tone}`, product.brand);
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
      && products.some((product) => product.id === item.productId)
    ));
  } catch {
    return [];
  }
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
