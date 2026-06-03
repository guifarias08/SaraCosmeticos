// Dados temporarios. Na etapa de backend, estes arrays podem vir de uma API.
const products = [
  { id: 1, name: 'Base Líquida HD', brand: 'Maybelline', price: 'R$ 38,90', oldPrice: 'R$ 55,00', tag: 'off', stars: '★★★★★', emoji: '💄', category: 'maquiagem' },
  { id: 2, name: 'Sérum Vitamina C', brand: 'L\'Oréal', price: 'R$ 89,90', oldPrice: null, tag: 'new', stars: '★★★★★', emoji: '✨', category: 'skincare' },
  { id: 3, name: 'Máscara Capilar', brand: 'Kerastase', price: 'R$ 72,00', oldPrice: 'R$ 95,00', tag: 'off', stars: '★★★★☆', emoji: '💆‍♀️', category: 'cabelos' },
  { id: 4, name: 'Paleta Nude', brand: 'MAC', price: 'R$ 120,00', oldPrice: null, tag: 'new', stars: '★★★★★', emoji: '🎨', category: 'maquiagem' },
  { id: 5, name: 'Hidratante Facial', brand: 'Natura', price: 'R$ 54,90', oldPrice: 'R$ 68,00', tag: 'off', stars: '★★★★★', emoji: '🌿', category: 'skincare' },
  { id: 6, name: 'Óleo Capilar', brand: 'O Boticário', price: 'R$ 44,50', oldPrice: null, tag: '', stars: '★★★★☆', emoji: '🌾', category: 'cabelos' },
  { id: 7, name: 'Batom Líquido Matte', brand: 'NYX', price: 'R$ 32,90', oldPrice: 'R$ 45,00', tag: 'off', stars: '★★★★★', emoji: '💋', category: 'maquiagem' },
  { id: 8, name: 'Perfume Floral', brand: 'Eudora', price: 'R$ 98,00', oldPrice: null, tag: 'new', stars: '★★★★★', emoji: '🌸', category: 'perfumaria' },
];

const state = {
  cart: [],
  currentFilter: 'todos',
};

const selectors = {
  loader: 'loader',
  mobileMenu: 'mobileMenu',
  navbar: 'navbar',
  productsGrid: 'productsGrid',
  cartCount: 'cartCount',
  cartOverlay: 'cartOverlay',
  cartDrawer: 'cartDrawer',
  cartItems: 'cartItems',
  cartEmpty: 'cartEmpty',
  cartTotal: 'cartTotal',
  toast: 'toast',
};

document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('load', hideLoader);

function initApp() {
  setText('currentYear', String(new Date().getFullYear()));
  renderProducts();
  bindEvents();
  initCursor();
  initReveal();
}

function bindEvents() {
  window.addEventListener('scroll', handleNavbarScroll);

  document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
    button.addEventListener('click', toggleMenu);
  });

  document.querySelectorAll('[data-mobile-link]').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.querySelector('[data-cart-open]')?.addEventListener('click', openCart);
  document.querySelectorAll('[data-cart-close]').forEach((element) => {
    element.addEventListener('click', closeCart);
  });
  document.querySelector('[data-checkout]')?.addEventListener('click', checkout);

  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => setFilter(button.dataset.filter));
  });

  document.querySelectorAll('[data-category]').forEach((card) => {
    card.addEventListener('click', () => filterProducts(card.dataset.category));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        filterProducts(card.dataset.category);
      }
    });
  });

  document.getElementById(selectors.productsGrid)?.addEventListener('click', handleProductsClick);
  document.getElementById(selectors.cartItems)?.addEventListener('click', handleCartClick);
}

function hideLoader() {
  setTimeout(() => {
    document.getElementById(selectors.loader)?.classList.add('hidden');
  }, 900);
}

function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  const canUseCustomCursor = cursor && ring && window.matchMedia('(pointer: fine)').matches;

  if (!canUseCustomCursor) return;

  let mx = 0;
  let my = 0;
  let rx = 0;
  let ry = 0;

  document.addEventListener('mousemove', (event) => {
    mx = event.clientX;
    my = event.clientY;
  });

  document.addEventListener('mouseover', (event) => {
    if (event.target.closest('a, button, .product-card, .category-card')) {
      cursor.classList.add('cursor-hover');
      ring.classList.add('cursor-ring-hover');
    }
  });

  document.addEventListener('mouseout', (event) => {
    if (event.target.closest('a, button, .product-card, .category-card')) {
      cursor.classList.remove('cursor-hover');
      ring.classList.remove('cursor-ring-hover');
    }
  });

  function animateCursor() {
    cursor.style.left = `${mx}px`;
    cursor.style.top = `${my}px`;
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;
    requestAnimationFrame(animateCursor);
  }

  animateCursor();
}

function handleNavbarScroll() {
  document.getElementById(selectors.navbar)?.classList.toggle('scrolled', window.scrollY > 60);
}

function toggleMenu() {
  document.getElementById(selectors.mobileMenu)?.classList.toggle('open');
}

function closeMenu() {
  document.getElementById(selectors.mobileMenu)?.classList.remove('open');
}

function renderProducts(filter = state.currentFilter) {
  const grid = document.getElementById(selectors.productsGrid);
  if (!grid) return;

  const items = filter === 'todos'
    ? products
    : products.filter((product) => product.category === filter);

  grid.replaceChildren(...items.map(createProductCard));
}

function createProductCard(product) {
  const card = createElement('div', 'product-card');
  const image = createElement('div', 'product-img');
  const placeholder = createElement('div', 'product-placeholder', product.emoji);
  const info = createElement('div', 'product-info');
  const brand = createElement('div', 'product-brand', product.brand);
  const name = createElement('div', 'product-name', product.name);
  const stars = createElement('div', 'product-stars', product.stars);
  const price = createElement('div', 'product-price');
  const currentPrice = createElement('span', 'price-new', product.price);
  const wishlist = createElement('button', 'product-wishlist');
  const addButton = createElement('button', 'btn-add-cart', 'Adicionar');

  wishlist.type = 'button';
  wishlist.title = 'Favoritar';
  wishlist.setAttribute('aria-label', `Favoritar ${product.name}`);
  wishlist.dataset.wishlist = String(product.id);

  addButton.type = 'button';
  addButton.dataset.productId = String(product.id);

  image.append(placeholder);
  if (product.tag) {
    image.append(createElement('span', `product-tag ${product.tag}`, product.tag === 'new' ? 'NOVO' : product.tag.toUpperCase()));
  }
  image.append(wishlist);

  price.append(currentPrice);
  if (product.oldPrice) {
    price.append(createElement('span', 'price-old', product.oldPrice));
  }

  info.append(brand, name, stars, price, addButton);
  card.append(image, info);

  return card;
}

function handleProductsClick(event) {
  const wishlistButton = event.target.closest('[data-wishlist]');
  const cartButton = event.target.closest('[data-product-id]');

  if (wishlistButton) {
    toggleWishlist(wishlistButton);
    return;
  }

  if (cartButton) {
    const product = products.find((item) => item.id === Number(cartButton.dataset.productId));
    if (!product) return;

    addToCart(product);
    cartButton.textContent = '✓ Adicionado!';
    cartButton.classList.add('added');
    setTimeout(() => {
      cartButton.textContent = 'Adicionar';
      cartButton.classList.remove('added');
    }, 1800);
  }
}

function setFilter(filter) {
  state.currentFilter = filter;
  document.querySelectorAll('[data-filter]').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
  });
  renderProducts(filter);
}

function filterProducts(category) {
  setFilter(category);
  document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
}

function toggleWishlist(button) {
  button.classList.toggle('active');
  showToast(button.classList.contains('active') ? '🤍 Adicionado aos favoritos!' : 'Removido dos favoritos');
}

function addToCart(product) {
  state.cart.push({
    name: product.name,
    price: product.price,
    emoji: product.emoji,
  });
  updateCartUI();
  showToast(`🛒 ${product.name} adicionado ao carrinho!`);
}

function removeFromCart(index) {
  state.cart.splice(index, 1);
  updateCartUI();
  renderCartItems();
}

function updateCartUI() {
  const count = document.getElementById(selectors.cartCount);
  if (!count) return;

  count.classList.toggle('is-hidden', state.cart.length === 0);
  count.textContent = String(state.cart.length);
}

function renderCartItems() {
  const list = document.getElementById(selectors.cartItems);
  const empty = document.getElementById(selectors.cartEmpty);
  const total = document.getElementById(selectors.cartTotal);
  if (!list || !empty || !total) return;

  list.replaceChildren();

  if (state.cart.length === 0) {
    empty.style.display = 'block';
    list.append(empty);
    total.textContent = 'R$ 0,00';
    return;
  }

  empty.style.display = 'none';
  state.cart.forEach((item, index) => list.append(createCartItem(item, index)));
  total.textContent = formatCurrency(state.cart.reduce((sum, item) => sum + parseCurrency(item.price), 0));
}

function createCartItem(item, index) {
  const row = createElement('div', 'cart-item');
  const thumb = createElement('div', 'cart-item-thumb', item.emoji);
  const details = createElement('div');
  const removeButton = createElement('button', 'cart-item-remove', '✕');

  removeButton.type = 'button';
  removeButton.dataset.removeIndex = String(index);
  removeButton.setAttribute('aria-label', `Remover ${item.name} do carrinho`);

  details.append(
    createElement('div', 'cart-item-name', item.name),
    createElement('div', 'cart-item-price', item.price),
  );
  row.append(thumb, details, removeButton);

  return row;
}

function handleCartClick(event) {
  const removeButton = event.target.closest('[data-remove-index]');
  if (!removeButton) return;

  removeFromCart(Number(removeButton.dataset.removeIndex));
}

function openCart() {
  renderCartItems();
  document.getElementById(selectors.cartOverlay)?.classList.add('open');
  document.getElementById(selectors.cartDrawer)?.classList.add('open');
}

function closeCart() {
  document.getElementById(selectors.cartOverlay)?.classList.remove('open');
  document.getElementById(selectors.cartDrawer)?.classList.remove('open');
}

function checkout() {
  if (state.cart.length === 0) {
    showToast('Seu carrinho está vazio!');
    return;
  }

  showToast('✅ Redirecionando para o pagamento...');
  closeCart();
}

function showToast(message) {
  const toast = document.getElementById(selectors.toast);
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function initReveal() {
  const elements = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach((element) => observer.observe(element));
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function parseCurrency(value) {
  return Number(value.replace('R$ ', '').replace('.', '').replace(',', '.'));
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
