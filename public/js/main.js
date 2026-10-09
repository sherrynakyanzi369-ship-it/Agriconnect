function dismissFlash(el) {
  el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  el.style.opacity = '0';
  el.style.transform = 'translateY(-6px)';
  setTimeout(() => el.remove(), 300);
}

let toastTimer = null;
function showToast(message, isError) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = (isError ? '<span class="toast-icon" aria-hidden="true">!</span>' : '<span class="toast-icon" aria-hidden="true">✓</span>') + '<span></span>';
  toast.querySelector('span + span').textContent = message;
  toast.classList.remove('toast-error');
  if (isError) toast.classList.add('toast-error');
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2600);
}

function setCartBadge(count) {
  const badge = document.querySelector('.nav-cart .cart-count');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('hide');
    badge.style.animation = 'none';
    void badge.offsetWidth;
    badge.style.animation = '';
  } else {
    badge.classList.add('hide');
  }
}

async function quickAdd(e) {
  const btn = e.target.closest('.quick-add');
  if (!btn || btn.dataset.busy) return;
  e.preventDefault();
  e.stopPropagation();
  btn.dataset.busy = '1';
  const original = btn.textContent;
  btn.textContent = 'Adding…';
  btn.disabled = true;
  try {
    const res = await fetch('/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ product: btn.dataset.product, quantity: 1 }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.ok) {
      setCartBadge(data.count);
      showToast(data.message || 'Added to cart');
      return;
    }
    showToast((data && data.message) || 'Could not add to cart', true);
  } catch (err) {
    showToast('Could not add to cart', true);
  } finally {
    btn.textContent = original;
    btn.disabled = false;
    delete btn.dataset.busy;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.flash .flash-close').forEach((btn) => {
    btn.addEventListener('click', () => dismissFlash(btn.closest('.flash')));
  });

  document.querySelectorAll('.flash').forEach((el) => {
    setTimeout(() => dismissFlash(el), 5000);
  });

  document.addEventListener('click', quickAdd);

  setupReveal();
  setupCountUp();
  setupLightbox();
  setupImagePreview();
});

/* ------------------------------------------------------------
   Scroll reveal — fade elements up as they enter the viewport
   ------------------------------------------------------------ */
function setupReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => {
    const siblings = Array.from(el.parentElement.children).filter((s) => s.classList.contains('reveal'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.transitionDelay = Math.min(idx * 60, 420) + 'ms';
    observer.observe(el);
  });
}

/* ------------------------------------------------------------
   Count-up — animate numeric hero stats
   ------------------------------------------------------------ */
function setupCountUp() {
  const nums = document.querySelectorAll('[data-count]');
  if (!nums.length) return;

  const format = (val) => val.toLocaleString('en-US');
  const animate = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (target === 0) {
      el.textContent = '0';
      return;
    }
    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    nums.forEach((el) => animate(el));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  nums.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------
   Lightbox — open the product photo full screen
   ------------------------------------------------------------ */
function setupLightbox() {
  const trigger = document.getElementById('gallery-main');
  const lightbox = document.getElementById('lightbox');
  if (!trigger || !lightbox) return;

  const open = () => {
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  };

  trigger.addEventListener('click', open);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.closest('.lightbox-close')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) close();
  });
}

/* ------------------------------------------------------------
   Image upload preview — show a live thumbnail of the chosen file
   ------------------------------------------------------------ */
function setupImagePreview() {
  document.querySelectorAll('.file-field input[type="file"]').forEach((input) => {
    const preview = input.parentElement.querySelector('.file-preview');
    if (!preview) return;

    const existing = input.dataset.preview || '';
    if (existing && preview.classList.contains('has-img')) {
      preview.src = existing;
    }

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) {
        if (existing) {
          preview.src = existing;
          preview.classList.add('has-img');
        } else {
          preview.removeAttribute('src');
          preview.classList.remove('has-img');
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.src = ev.target.result;
        preview.classList.add('has-img');
      };
      reader.readAsDataURL(file);
    });
  });
}