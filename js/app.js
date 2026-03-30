// ── CONFIGURACIÓN ──────────────────────────────────────
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5xm6Je1IaxMtNGBTM8apwuJJHdQgyJCG1qbcvuEh3JAkPbsERwdqoGJSIfMmyXIiO2QLv0egO2KRB/pub?gid=0&single=true&output=csv';
const WA_NUMBER = '573151736313'; // ← Fredy reemplaza con su número

// ── ESTADO GLOBAL ───────────────────────────────────────
let allProducts = [];

// ── PARSEAR CSV ─────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const cols = [];
    let inQuote = false;
    let current = '';

    for (let char of line) {
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        cols.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim());

    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] || '').replace(/\r/g, '').trim();
    });
    return obj;
  }).filter(p => p.nombre);
}

// ── FORMATO PRECIO ──────────────────────────────────────
function formatPrice(valor) {
  const numero = parseInt(valor.replace(/\D/g, ''));
  return isNaN(numero) ? valor : '$' + numero.toLocaleString('es-CO');
}

// ── CREAR CARD ──────────────────────────────────────────
function createCard(producto) {
  const disponible = producto.disponible?.toUpperCase() !== 'NO';
  const mensaje = encodeURIComponent(`Hola! Me interesa "${producto.nombre}" 🛍️`);

  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.category = producto.categoria?.toLowerCase() || 'unisex';

  card.innerHTML = `
    <img 
    class="product-img" 
    src="${producto.imagen}" 
    alt=""
    onerror="this.removeAttribute('alt'); this.style.background='linear-gradient(145deg, #e8dfc8, #d4c9aa)'; this.src='';"
    >
    <div class="product-body">
      <div class="product-name">${producto.nombre}</div>
      <p class="product-desc">${producto.descripcion}</p>
      <div class="product-footer">
        <div class="product-price">${formatPrice(producto.precio)} COP</div>
        ${disponible
          ? `<a href="https://wa.me/${WA_NUMBER}?text=${mensaje}" target="_blank" class="buy-btn">Pedir</a>`
          : `<span style="font-size:0.78rem;color:var(--muted);">Agotado</span>`
        }
      </div>
    </div>
  `;

  return card;
}

// ── RENDERIZAR PRODUCTOS ────────────────────────────────
function renderProducts(filter) {
  const catalog = document.getElementById('catalog');
  catalog.innerHTML = '';

  const filtered = filter === 'todos'
    ? allProducts
    : allProducts.filter(p => p.categoria?.toLowerCase() === filter);

  if (filtered.length === 0) {
    catalog.innerHTML = '<div class="empty-state">No hay prendas en esta categoría.</div>';
    return;
  }

  filtered.forEach(producto => {
    catalog.appendChild(createCard(producto));
  });
}

// ── FILTROS ─────────────────────────────────────────────
function filterProducts(category, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts(category);
}

// ── CARGAR DATOS DESDE GOOGLE SHEETS ───────────────────
async function loadCatalog() {
  const catalog = document.getElementById('catalog');
  catalog.innerHTML = '<div class="loading-state">Cargando catálogo...</div>';

  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error('Error al cargar');

    const text = await response.text();
    allProducts = parseCSV(text);
    renderProducts('todos');

  } catch (error) {
    catalog.innerHTML = '<div class="error-state">No pudimos cargar el catálogo. Escríbenos por WhatsApp.</div>';
    console.error('Error:', error);
  }
}

// ── ARRANCAR ────────────────────────────────────────────
loadCatalog();