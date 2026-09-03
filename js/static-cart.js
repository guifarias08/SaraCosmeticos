(() => {
  const WHATSAPP_NUMBER = '558588540534';
  const CART_KEY = 'sara-cosmeticos-cart-v2';

  document.addEventListener('DOMContentLoaded', () => {
    window.setTimeout(() => {
      if (!window.__SARA_APP_READY) initStaticCart();
    }, 150);
  });

  function initStaticCart() {
    const cards = [...document.querySelectorAll('#productsGrid .product-card')];
    const products = cards.map((card, index) => {
      const product = {
        id: 10001 + index,
        name: card.querySelector('.product-name')?.textContent.trim() || 'Produto',
        brand: card.querySelector('.product-brand')?.textContent.trim() || 'Sara Cosméticos',
        price: parsePrice(card.querySelector('.product-price')?.textContent),
        priceFrom: Boolean(card.querySelector('.price-prefix')),
      };
      const button = card.querySelector('[data-static-add]');
      if (button) {
        button.dataset.staticProductId = String(product.id);
        button.setAttribute('aria-label', `Adicionar ${product.name} ao carrinho`);
      }
      return product;
    });
    const productById = new Map(products.map((product) => [product.id, product]));
    const elements = {
      count: document.getElementById('cartCount'),
      drawer: document.getElementById('cartDrawer'),
      items: document.getElementById('cartItems'),
      label: document.getElementById('cartTotalLabel'),
      total: document.getElementById('cartTotal'),
      toast: document.getElementById('toast'),
    };
    let cart = loadCart().filter((item) => productById.has(item.productId));
    let toastTimer;

    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
    const year = document.getElementById('currentYear');
    if (year) year.textContent = String(new Date().getFullYear());

    document.addEventListener('click', (event) => {
      const addButton = event.target.closest('[data-static-product-id]');
      const cartAction = event.target.closest('[data-static-cart-action]');
      if (addButton) addProduct(Number(addButton.dataset.staticProductId));
      if (cartAction) updateQuantity(Number(cartAction.dataset.productId), cartAction.dataset.staticCartAction);
    });
    document.querySelector('[data-cart-open]')?.addEventListener('click', openCart);
    document.querySelectorAll('[data-cart-close]').forEach((button) => button.addEventListener('click', closeCart));
    document.querySelector('[data-checkout]')?.addEventListener('click', checkout);
    renderCart();

    function addProduct(productId) {
      const product = productById.get(productId);
      if (!product) return;
      const item = cart.find((cartItem) => cartItem.productId === productId);
      if (item) item.quantity = Math.min(item.quantity + 1, 99);
      else cart.push({ productId, quantity: 1 });
      saveAndRender();
      showToast(`${product.name} foi adicionado ao carrinho.`);
      openCart();
    }

    function updateQuantity(productId, action) {
      const item = cart.find((cartItem) => cartItem.productId === productId);
      if (!item) return;
      if (action === 'increase') item.quantity = Math.min(item.quantity + 1, 99);
      if (action === 'decrease') item.quantity -= 1;
      if (action === 'remove' || item.quantity <= 0) {
        cart = cart.filter((cartItem) => cartItem.productId !== productId);
      }
      saveAndRender();
    }

    function renderCart() {
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      elements.count.textContent = String(count);
      elements.count.classList.toggle('is-hidden', count === 0);
      elements.items.replaceChildren(...(cart.length ? cart.map(createCartItem) : [createEmptyCart()]));
      const hasUnknown = cart.some((item) => productById.get(item.productId)?.price === null);
      const hasKnown = cart.some((item) => productById.get(item.productId)?.price !== null);
      elements.label.textContent = hasUnknown && hasKnown ? 'Subtotal conhecido' : 'Total estimado';
      elements.total.textContent = hasUnknown
        ? (hasKnown ? `${formatCurrency(total())} + consulta` : 'A confirmar')
        : formatCurrency(total());
    }

    function createCartItem(item) {
      const product = productById.get(item.productId);
      const row = createElement('article', 'cart-item');
      const visual = createElement('div', 'cart-item-visual tone-rose', product.brand);
      const details = createElement('div');
      const controls = createElement('div', 'quantity-control');
      controls.append(
        actionButton('−', 'Diminuir quantidade', 'decrease', product.id),
        createElement('span', '', String(item.quantity)),
        actionButton('+', 'Aumentar quantidade', 'increase', product.id),
      );
      details.append(
        createElement('h3', 'cart-item-name', product.name),
        createElement('p', 'cart-item-price', product.price === null ? 'Valor a confirmar' : formatCurrency(product.price * item.quantity)),
        controls,
      );
      const remove = actionButton('×', `Remover ${product.name}`, 'remove', product.id);
      remove.className = 'remove-button';
      row.append(visual, details, remove);
      return row;
    }

    function createEmptyCart() {
      const empty = createElement('div', 'cart-empty');
      empty.append(createElement('p', '', 'Seu carrinho está vazio. Escolha um produto para começar.'));
      return empty;
    }

    function actionButton(text, label, action, productId) {
      const button = createElement('button', '', text);
      button.type = 'button';
      button.setAttribute('aria-label', label);
      button.dataset.staticCartAction = action;
      button.dataset.productId = String(productId);
      return button;
    }

    function checkout() {
      if (!cart.length) {
        showToast('Adicione pelo menos um produto antes de enviar o pedido.');
        return;
      }
      const lines = cart.map((item) => {
        const product = productById.get(item.productId);
        const price = product.price === null
          ? 'valor a confirmar'
          : `${product.priceFrom ? 'a partir de ' : ''}${formatCurrency(product.price * item.quantity)}`;
        return `- ${item.quantity}x ${product.name} (${product.brand}) - ${price}`;
      });
      const hasUnknown = cart.some((item) => productById.get(item.productId)?.price === null);
      const hasKnown = cart.some((item) => productById.get(item.productId)?.price !== null);
      const totalLine = hasUnknown
        ? (hasKnown ? `Subtotal conhecido: ${formatCurrency(total())} (há valores a confirmar)` : 'Total: a confirmar')
        : `Total estimado: ${formatCurrency(total())}`;
      const message = [
        'Olá, Sara! Gostaria de fazer este pedido:', '', ...lines, '', totalLine, '',
        'Pode confirmar a disponibilidade e combinar a entrega comigo?',
      ].join('\n');
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    }

    function total() {
      return cart.reduce((sum, item) => {
        const product = productById.get(item.productId);
        return sum + (product?.price === null ? 0 : product.price * item.quantity);
      }, 0);
    }

    function saveAndRender() {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      renderCart();
    }

    function openCart() {
      document.querySelector('.cart-overlay')?.classList.add('is-open');
      elements.drawer?.classList.add('is-open');
      elements.drawer?.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
    }

    function closeCart() {
      document.querySelector('.cart-overlay')?.classList.remove('is-open');
      elements.drawer?.classList.remove('is-open');
      elements.drawer?.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
    }

    function showToast(message) {
      window.clearTimeout(toastTimer);
      elements.toast.textContent = message;
      elements.toast.classList.add('is-visible');
      toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 2400);
    }
  }

  function loadCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  function parsePrice(value) {
    const text = String(value || '');
    if (!text.includes('R$')) return null;
    const parsed = Number(text.replace(/[^0-9,]/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  function createElement(tagName, className = '', text = '') {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }
})();
