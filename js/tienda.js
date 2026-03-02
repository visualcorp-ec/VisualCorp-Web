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

            const isSoldOut = p.control_stock && p.stock <= 0;
            const btnHtml = isSoldOut
                ? `<button class="btn-add-cart" disabled style="background:#ef4444; cursor:not-allowed;" title="Agotado"><i class="fa-solid fa-ban"></i></button>`
                : `<button class="btn-add-cart" data-id="${p.id}" title="Agregar al carrito"><i class="fa-solid fa-cart-plus"></i></button>`;

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
              ${btnHtml}
            </div>
          </div>
        </article>`;
        }).join('');

        attachCartEvents(grid);
    }

    // Render Trending & New Products
    // Render Trending, New, Popular, Promo
    function renderCarousels() {
        const wrapTrending = document.getElementById('trendingProducts');
        const wrapNew = document.getElementById('newProducts');
        const wrapPopular = document.getElementById('popularProducts');
        const wrapPromo = document.getElementById('promoProducts');

        if (allProducts.length === 0) return;

        // Filtrar según flags de Admin
        const flash = allProducts.filter(p => p.oferta_flash);
        const nuevos = allProducts.filter(p => p.nuevo);
        const populares = allProducts.filter(p => p.popular);
        const promociones = allProducts.filter(p => p.promocion);

        const generateHTML = (arr, badgeText, badgeColor) => {
            if (arr.length === 0) return `<div style="grid-column:1/-1; color:var(--color-text-dim); font-size:var(--fs-sm);">Próximamente más productos...</div>`;
            return arr.slice(0, 4).map((p, i) => {
                const delay = `fade-in-delay-${(i % 4) + 1}`;
                const imgSrc = p.imagen_url || 'https://placehold.co/400x260/1a2035/f2b705?text=Sin+Imagen';
                const price = getDisplayPrice(p);
                const priceLabel = getDisplayPriceLabel(p);

                const isSoldOut = p.control_stock && p.stock <= 0;
                const btnHtml = isSoldOut
                    ? `<button class="btn-add-cart" disabled style="background:#ef4444; width:30px; height:30px; font-size:.8rem; cursor:not-allowed;" title="Agotado"><i class="fa-solid fa-ban"></i></button>`
                    : `<button class="btn-add-cart" data-id="${p.id}" title="Agregar al carrito"><i class="fa-solid fa-cart-plus"></i></button>`;

                return `
        <article class="product-card product-card--compact fade-in ${delay}" data-id="${p.id}">
          <div class="product-badge" style="position:absolute; top:8px; left:8px; background:${badgeColor}; color:#fff; padding:2px 8px; border-radius:var(--radius-sm); font-size:10px; font-weight:800; z-index:2; text-transform:uppercase;">${badgeText}</div>
          <img class="product-card__img" src="${imgSrc}" alt="${p.nombre}" loading="lazy">
          <div class="product-card__body">
            <h3 class="product-card__name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${p.nombre}">${p.nombre}</h3>
            <span class="product-card__sub">${p.subcategoria || ''}</span>
            <div class="product-card__price-row" style="margin-top:auto;">
              <div>
                <span class="product-card__price">${price}</span>
                <span class="product-card__price-label">${priceLabel}</span>
              </div>
              ${btnHtml}
            </div>
          </div>
        </article>`;
            }).join('');
        };

        if (wrapTrending) wrapTrending.innerHTML = generateHTML(flash, '⚡ Flash', '#f59e0b');
        if (wrapNew) wrapNew.innerHTML = generateHTML(nuevos, '✨ Nuevo', '#06b6d4');
        if (wrapPopular) wrapPopular.innerHTML = generateHTML(populares, '🔥 Popular', '#ef4444');
        if (wrapPromo) wrapPromo.innerHTML = generateHTML(promociones, '🎁 Promoción', '#22c55e');

        // Attach event listeners for Add to Cart
        [wrapTrending, wrapNew, wrapPopular, wrapPromo].forEach(grid => {
            if (!grid) return;
            attachCartEvents(grid);
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

    // --- Unified Cart Events & Modal Logic ---
    function attachCartEvents(container) {
        container.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                // Si el botón está deshabilitado por falta de stock
                if (btn.disabled) return;

                const id = btn.dataset.id;
                const p = allProducts.find(x => x.id === id);
                if (!p) return;

                if (p.variantes && p.variantes.tiene_variantes) {
                    openVariantModal(p);
                } else {
                    Carrito.addItem({
                        id: p.id,
                        nombre: p.nombre,
                        codigo: p.codigo,
                        precio: getMinPrice(p),
                        cantidad: 1,
                        imagen: p.imagen_url || '',
                        subcategoria: p.subcategoria,
                        escalas_precios: p.escalas_precios || [],
                        variantes: null,
                        control_stock: p.control_stock,
                        stock: p.stock
                    });
                }
            });
        });
    }

    // Modal UI Elements
    let selectedProductForVariant = null;
    let currentSelectedColor = null;
    let currentSelectedSize = null;

    const variantModal = document.getElementById('variantModal');
    if (variantModal) {
        document.getElementById('closeVariantModal').addEventListener('click', () => variantModal.style.display = 'none');
        variantModal.addEventListener('click', e => { if (e.target === variantModal) variantModal.style.display = 'none'; });

        document.getElementById('btnConfirmVariant').addEventListener('click', () => {
            if (!selectedProductForVariant) return;

            const variantString = [currentSelectedColor, currentSelectedSize].filter(Boolean).join(' - ');

            Carrito.addItem({
                id: selectedProductForVariant.id,
                nombre: selectedProductForVariant.nombre,
                codigo: selectedProductForVariant.codigo,
                precio: getMinPrice(selectedProductForVariant),
                cantidad: 1,
                imagen: selectedProductForVariant.imagen_url || '',
                subcategoria: selectedProductForVariant.subcategoria,
                escalas_precios: selectedProductForVariant.escalas_precios || [],
                variantes: {
                    seleccion: variantString
                },
                control_stock: selectedProductForVariant.control_stock,
                stock: selectedProductForVariant.stock
            });
            variantModal.style.display = 'none';
        });
    }

    function openVariantModal(p) {
        selectedProductForVariant = p;
        currentSelectedColor = null;
        currentSelectedSize = null;

        document.getElementById('varModalName').textContent = p.nombre;
        document.getElementById('varModalPrice').textContent = getDisplayPrice(p);
        document.getElementById('varModalImg').src = p.imagen_url || 'https://placehold.co/80x80/2a3045/fff?text=No+Img';

        // Stock Message
        const stockMsg = document.getElementById('varStockMsg');
        if (p.control_stock) {
            stockMsg.textContent = `Apresúrate, quedan solo ${p.stock} unidades en stock.`;
        } else {
            stockMsg.textContent = '';
        }

        // Options
        const v = p.variantes || {};
        const grpColor = document.getElementById('varColorGroup');
        const grpSize = document.getElementById('varSizeGroup');
        const listColor = document.getElementById('varColorOptions');
        const listSize = document.getElementById('varSizeOptions');
        const btnConfirm = document.getElementById('btnConfirmVariant');
        btnConfirm.disabled = true;

        const checkCompletion = () => {
            const needsColor = v.colores && v.colores.length > 0;
            const needsSize = v.tallas && v.tallas.length > 0;
            const colorOk = !needsColor || currentSelectedColor;
            const sizeOk = !needsSize || currentSelectedSize;
            btnConfirm.disabled = !(colorOk && sizeOk);
        };

        if (v.colores && v.colores.length > 0) {
            grpColor.style.display = 'block';
            listColor.innerHTML = v.colores.map(c => `<button class="variant-btn variant-color-btn" data-val="${c}">${c}</button>`).join('');
            listColor.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    listColor.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    currentSelectedColor = btn.dataset.val;
                    checkCompletion();
                });
            });
        } else {
            grpColor.style.display = 'none';
        }

        if (v.tallas && v.tallas.length > 0) {
            grpSize.style.display = 'block';
            listSize.innerHTML = v.tallas.map(t => `<button class="variant-btn variant-size-btn" data-val="${t}">${t}</button>`).join('');
            listSize.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    listSize.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    currentSelectedSize = btn.dataset.val;
                    checkCompletion();
                });
            });
        } else {
            grpSize.style.display = 'none';
        }

        variantModal.style.display = 'flex';
    }

    // --- Promos Toggle Accordion ---
    const btnTogglePromos = document.getElementById('btnTogglePromos');
    const promoContainer = document.getElementById('promoContainer');

    if (btnTogglePromos && promoContainer) {
        // Initialize max-height block
        let isPromoVisible = true;
        btnTogglePromos.addEventListener('click', () => {
            if (!isPromoVisible) {
                // Show
                promoContainer.style.height = promoContainer.scrollHeight + 'px';
                btnTogglePromos.innerHTML = 'Ocultar Promociones <i class="fa-solid fa-chevron-up"></i>';
                btnTogglePromos.classList.replace('btn--primary', 'btn--outline');
                setTimeout(() => {
                    promoContainer.style.height = 'auto';
                    isPromoVisible = true;
                }, 300);
            } else {
                // Hide
                promoContainer.style.height = promoContainer.scrollHeight + 'px';
                // Trigger reflow
                promoContainer.offsetHeight;
                promoContainer.style.height = '0px';
                btnTogglePromos.innerHTML = 'Mostrar Promociones <i class="fa-solid fa-chevron-down"></i>';
                btnTogglePromos.classList.replace('btn--outline', 'btn--primary');
                isPromoVisible = false;
            }
        });
    }

    // --- Init ---
    init();
})();
