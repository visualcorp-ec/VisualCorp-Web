// ============================================
// tienda.js — Tienda mejorada con búsqueda,
//             ordenamiento, categorías y carrito
// ============================================

(async function () {
    const grid = document.getElementById('product-grid');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const categoryList = document.getElementById('categoryList');
    const resultCount = document.getElementById('resultCount');

    if (!grid) return;

    // --- Estado ---
    let allProducts = [];
    let activeCategory = 'Todos';
    let searchTerm = '';
    let sortBy = 'nombre-asc';

    // --- Init ---
    async function init() {
        showSkeletons();
        try {
            const [souv, pers, imp] = await Promise.all([
                getSouvenirs(),
                getPersonalizados(),
                getImpresiones()
            ]);

            allProducts = [...souv, ...pers, ...imp];
            renderCategories();
            applyFilters();
            renderCarousels();
        } catch (err) {
            console.error('Error cargando tienda:', err);
            grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__title">Error al cargar productos</div>
          <div class="empty-state__text">Intenta recargar la página.</div>
        </div>`;
        }
    }

    // --- Skeletons ---
    function showSkeletons() {
        grid.innerHTML = Array.from({ length: 8 }, () =>
            '<div class="skeleton skeleton--card"></div>'
        ).join('');
    }

    // --- Categorías sidebar ---
    function renderCategories() {
        const cats = {};
        allProducts.forEach(p => {
            const main = p.categoria_principal || 'Otros';
            const sub = p.subcategoria || 'General';
            if (!cats[main]) cats[main] = new Set();
            cats[main].add(sub);
        });

        let html = `<button class="cat-btn active" data-cat="Todos">🏷️ Todos <span class="cat-count">${allProducts.length}</span></button>`;

        const icons = {
            'Impresiones': '🖨️',
            'Souvenirs': '🎁',
            'Productos Personalizados': '✂️'
        };

        Object.keys(cats).sort().forEach(main => {
            const count = allProducts.filter(p => p.categoria_principal === main).length;
            const icon = icons[main] || '📦';
            html += `<button class="cat-btn" data-cat="${main}">${icon} ${main} <span class="cat-count">${count}</span></button>`;

            // Subcategorías
            [...cats[main]].sort().forEach(sub => {
                const subCount = allProducts.filter(p => p.categoria_principal === main && p.subcategoria === sub).length;
                html += `<button class="cat-btn cat-btn--sub" data-cat="${main}" data-sub="${sub}">› ${sub} <span class="cat-count">${subCount}</span></button>`;
            });
        });

        categoryList.innerHTML = html;

        categoryList.addEventListener('click', e => {
            const btn = e.target.closest('.cat-btn');
            if (!btn) return;
            categoryList.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.cat;
            // If has subcategory filter
            if (btn.dataset.sub) {
                activeCategory = btn.dataset.cat + '::' + btn.dataset.sub;
            }
            applyFilters();
        });
    }

    // --- Aplicar filtros ---
    function applyFilters() {
        let filtered = [...allProducts];

        // Category filter
        if (activeCategory !== 'Todos') {
            if (activeCategory.includes('::')) {
                const [cat, sub] = activeCategory.split('::');
                filtered = filtered.filter(p => p.categoria_principal === cat && p.subcategoria === sub);
            } else {
                filtered = filtered.filter(p => p.categoria_principal === activeCategory);
            }
        }

        // Hide featured section if searching or filtering by category, show catalog focus
        const catalogSection = document.getElementById('mainStoreCatalog');
        const featuredSection = document.querySelector('.store-featured');
        if (featuredSection) {
            if (activeCategory !== 'Todos' || searchTerm !== '') {
                featuredSection.style.display = 'none';
            } else {
                featuredSection.style.display = 'block';
            }
        }

        // Search filter
        if (searchTerm) {
            const searchTermLower = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                (p.nombre || '').toLowerCase().includes(searchTermLower) ||
                (p.codigo || '').toLowerCase().includes(searchTermLower) ||
                (p.subcategoria || '').toLowerCase().includes(searchTermLower)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'nombre-asc': return (a.nombre || '').localeCompare(b.nombre || '');
                case 'nombre-desc': return (b.nombre || '').localeCompare(a.nombre || '');
                case 'precio-asc': return getMinPrice(a) - getMinPrice(b);
                case 'precio-desc': return getMinPrice(b) - getMinPrice(a);
                default: return 0;
            }
        });

        resultCount.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''}`;
        renderProducts(filtered);
    }

    function getMinPrice(p) {
        if (p.precio_pvp) return p.precio_pvp;
        if (p.escalas_precios && Array.isArray(p.escalas_precios) && p.escalas_precios.length > 0) {
            return p.escalas_precios[0].pvp || 0;
        }
        return 0;
    }

    // --- Events ---
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            searchTerm = e.target.value.trim();
            applyFilters();
        });
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', e => {
            sortBy = e.target.value;
            applyFilters();
        });
    }

    // --- Render products ---
    function renderProducts(products) {
        if (products.length === 0) {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">🔍</div>
          <div class="empty-state__title">Sin resultados</div>
          <div class="empty-state__text">No se encontraron productos con esos filtros.</div>
        </div>`;
            return;
        }

        grid.innerHTML = products.map((p, i) => {
            const delay = `fade-in-delay-${(i % 4) + 1}`;
            const imgSrc = p.imagen_url || 'https://placehold.co/400x260/1a2035/f2b705?text=Sin+Imagen';
            const price = getDisplayPrice(p);
            const priceLabel = getDisplayPriceLabel(p);

            return `
        <article class="product-card fade-in ${delay}" data-id="${p.id}">
          <img class="product-card__img" src="${imgSrc}" alt="${p.nombre}" loading="lazy">
          <div class="product-card__body">
            <span class="product-card__code">${p.codigo || ''}</span>
            <h3 class="product-card__name">${p.nombre}</h3>
            <span class="product-card__sub">${p.subcategoria || ''}</span>
            <div class="product-card__price-row">
              <div>
                <span class="product-card__price">${price}</span>
                <span class="product-card__price-label">${priceLabel}</span>
              </div>
              <button class="btn-add-cart" data-id="${p.id}" title="Agregar al carrito">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </article>`;
        }).join('');

        // Add to cart events
        grid.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const p = allProducts.find(x => x.id === id);
                if (!p) return;
                Carrito.addItem({
                    id: p.id,
                    nombre: p.nombre,
                    codigo: p.codigo,
                    precio: getMinPrice(p),
                    cantidad: 1,
                    imagen: p.imagen_url || '',
                    subcategoria: p.subcategoria,
                    escalas_precios: p.escalas_precios || []
                });
            });
        });
    }

    // Render Trending & New Products
    function renderCarousels() {
        const trendingGrid = document.getElementById('trendingProducts');
        const newGrid = document.getElementById('newProducts');

        if (!trendingGrid || !newGrid || allProducts.length === 0) return;

        // --- Ofertas Flash (Random selection) ---
        const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
        const trending = shuffled.slice(0, 4);

        trendingGrid.innerHTML = trending.map((p, i) => {
            const delay = `fade-in-delay-${(i % 4) + 1}`;
            const imgSrc = p.imagen_url || 'https://placehold.co/400x260/1a2035/f2b705?text=Sin+Imagen';
            const price = getDisplayPrice(p);
            const priceLabel = getDisplayPriceLabel(p);

            return `
        <article class="product-card fade-in ${delay}" data-id="${p.id}">
          <div class="product-badge" style="position:absolute; top:12px; left:12px; background:var(--color-accent); color:#111; padding:2px 10px; border-radius:var(--radius-full); font-size:var(--fs-xs); font-weight:800; z-index:2; box-shadow:0 2px 10px rgba(0,0,0,0.5);">⚡ OFERTA FLASH</div>
          <img class="product-card__img" src="${imgSrc}" alt="${p.nombre}" loading="lazy">
          <div class="product-card__body">
            <h3 class="product-card__name">${p.nombre}</h3>
            <span class="product-card__sub">${p.subcategoria || ''}</span>
            <div class="product-card__price-row">
              <div>
                <span class="product-card__price">${price}</span>
                <span class="product-card__price-label">${priceLabel}</span>
              </div>
              <button class="btn-add-cart" data-id="${p.id}" title="Agregar al carrito">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </article>`;
        }).join('');

        // --- Lo Más Nuevo (Another set of products, ideally newest but we'll use next slice) ---
        const newArrivals = shuffled.slice(4, 8);

        newGrid.innerHTML = newArrivals.map((p, i) => {
            const delay = `fade-in-delay-${(i % 4) + 1}`;
            const imgSrc = p.imagen_url || 'https://placehold.co/400x260/1a2035/f2b705?text=Sin+Imagen';
            const price = getDisplayPrice(p);
            const priceLabel = getDisplayPriceLabel(p);

            return `
        <article class="product-card fade-in ${delay}" data-id="${p.id}">
          <div class="product-badge" style="position:absolute; top:12px; left:12px; background:#06b6d4; color:#fff; padding:2px 10px; border-radius:var(--radius-full); font-size:var(--fs-xs); font-weight:800; z-index:2; box-shadow:0 2px 10px rgba(0,0,0,0.5);">✨ NUEVO</div>
          <img class="product-card__img" src="${imgSrc}" alt="${p.nombre}" loading="lazy">
          <div class="product-card__body">
            <h3 class="product-card__name">${p.nombre}</h3>
            <span class="product-card__sub">${p.subcategoria || ''}</span>
            <div class="product-card__price-row">
              <div>
                <span class="product-card__price">${price}</span>
                <span class="product-card__price-label">${priceLabel}</span>
              </div>
              <button class="btn-add-cart" data-id="${p.id}" title="Agregar al carrito">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
          </div>
        </article>`;
        }).join('');

        // Attach event listeners for Add to Cart for both grids
        [trendingGrid, newGrid].forEach(grid => {
            grid.querySelectorAll('.btn-add-cart').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const p = allProducts.find(x => x.id === id);
                    if (!p) return;
                    Carrito.addItem({
                        id: p.id,
                        nombre: p.nombre,
                        codigo: p.codigo,
                        precio: getMinPrice(p),
                        cantidad: 1,
                        imagen: p.imagen_url || '',
                        subcategoria: p.subcategoria,
                        escalas_precios: p.escalas_precios || []
                    });
                });
            });
        });
    }

    function getDisplayPrice(p) {
        if (p.precio_pvp) return `$${Number(p.precio_pvp).toFixed(2)}`;
        if (p.escalas_precios && Array.isArray(p.escalas_precios) && p.escalas_precios.length > 0) {
            return `$${Number(p.escalas_precios[0].pvp).toFixed(2)}`;
        }
        return 'Consultar';
    }

    function getDisplayPriceLabel(p) {
        if (p.precio_pvp && p.tipo_calculo === 'm2') return '/ m²';
        if (p.precio_pvp) return 'c/u';
        if (p.escalas_precios && p.escalas_precios.length > 0) return `desde ${p.escalas_precios[0].qty}+ uni`;
        return '';
    }

    // --- Init ---
    init();
})();
