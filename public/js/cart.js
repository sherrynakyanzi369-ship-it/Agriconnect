function cartFeedback(message, isError) {
  const el = document.getElementById('cart-feedback');
  if (!el) return;
  el.textContent = message || '';
  el.className = isError ? 'muted cart-feedback cart-feedback-error' : 'muted cart-feedback';
}

function updateSummary(data) {
  const total = document.getElementById('cart-total');
  if (total) {
    total.textContent = '$' + Number(data.cartTotal || 0).toFixed(2);
    const sub = document.getElementById('subtotal');
    if (sub) sub.textContent = total.textContent;
  }

  const badge = document.querySelector('.nav-cart .cart-count');
  if (badge) {
    badge.textContent = data.count;
    if (data.count <= 0) badge.classList.add('hide');
  }

  if (data.lines) {
    const lineTotals = document.querySelectorAll('td[data-field="lineTotal"]');
    lineTotals.forEach((cell) => {
      const row = cell.closest('tr[data-product]');
      if (row) {
        const found = data.lines.find((l) => l.productId === row.dataset.product);
        if (found) cell.textContent = '$' + Number(found.totalPrice || 0).toFixed(2);
      }
    });
  }
}

async function cartRequest(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

function bindCartInputs() {
  document.querySelectorAll('.cart-qty input[data-product]').forEach((input) => {
    input.addEventListener('change', async () => {
      input.disabled = true;
      try {
        const data = await cartRequest('/cart/update/' + input.dataset.product, {
          quantity: input.value,
        });
        if (data.message) cartFeedback(data.message, true);
        if (data.ok) {
          updateSummary(data);
          const line = data.lines.find((l) => l.productId === input.dataset.product);
          if (line) input.value = line.quantity;
        }
      } catch (err) {
        cartFeedback('Could not update quantity', true);
      } finally {
        input.disabled = false;
      }
    });
  });

  document.querySelectorAll('.cart-remove').forEach((button) => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const row = button.closest('tr[data-product]');
      if (!row) return;
      button.disabled = true;
      try {
        const data = await cartRequest('/cart/remove/' + row.dataset.product, {});
        if (data.ok) {
          row.remove();
          updateSummary(data);
          if (data.count <= 0) {
            const page = document.querySelector('#cart-page');
            if (page) {
              page.outerHTML =
                '<p class="empty">Your cart is empty. <a href="/products">Browse produce</a> to find fresh goods.</p>';
            }
          }
        }
      } catch (err) {
        cartFeedback('Could not remove item', true);
      } finally {
        button.disabled = false;
      }
    });
  });
}

if (document.querySelector('#cart-page')) {
  bindCartInputs();
}