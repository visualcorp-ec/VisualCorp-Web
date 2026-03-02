// ============================================
// servicios.js — Lógica Dinámica para Servicios Profesionales
// ============================================

(async function () {
    const grid = document.getElementById('servicesDynamicGrid');

    if (!grid) return;

    // --- Init ---
    async function init() {
        showSkeletons();
        try {
            // Reutilizamos la función API existente o hacemos una consulta directa
            const { data: servicios, error } = await supabaseClient
                .from('productos')
                .select('*')
                .eq('activo', true)
                .eq('categoria_principal', 'Servicios');

            if (error) throw error;

            renderServices(servicios || []);
        } catch (err) {
            console.error('Error cargando servicios:', err);
            grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__title">Error al cargar servicios</div>
          <div class="empty-state__text">Intenta recargar la página.</div>
        </div>`;
        }
    }

    // --- Skeletons ---
    function showSkeletons() {
        grid.innerHTML = Array.from({ length: 4 }, () =>
            '<div class="skeleton skeleton--card"></div>'
        ).join('');
    }

    // --- Utilidades de Precio ---
    function getDisplayPrice(p) {
        if (p.precio_pvp) return `$${p.precio_pvp.toFixed(2)}`;
        if (p.escalas_precios && Array.isArray(p.escalas_precios) && p.escalas_precios.length > 0) {
            return `Desde $${p.escalas_precios[0].pvp.toFixed(2)}`;
        }
        return 'Cotizar';
    }

    // --- Render services ---
    function renderServices(services) {
        if (services.length === 0) {
            grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1; text-align:center; padding:var(--sp-8);">
          <div class="empty-state__icon" style="font-size:3rem; margin-bottom:var(--sp-4);">🛠️</div>
          <div class="empty-state__title" style="font-size:var(--fs-xl); color:var(--color-heading); font-weight:800;">Próximamente...</div>
          <div class="empty-state__text" style="color:var(--color-text-dim);">Estamos configurando nuestros nuevos servicios profesionales industriales.</div>
        </div>`;
            return;
        }

        grid.innerHTML = services.map((p, i) => {
            const delay = `fade-in-delay-${(i % 4) + 1}`;
            const imgSrc = p.imagen_url || 'https://placehold.co/600x400/1a2035/f2b705?text=Servicio+VisualCorp';
            const price = getDisplayPrice(p);

            return `
        <article class="product-card fade-in ${delay}" data-id="${p.id}" style="display:flex; flex-direction:column;">
          <img class="product-card__img" src="${imgSrc}" alt="${p.nombre}" loading="lazy" style="height:200px; object-fit:cover;">
          <div class="product-card__body" style="flex:1; display:flex; flex-direction:column;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp-2);">
                <h3 class="product-card__name" style="font-size:var(--fs-lg);">${p.nombre}</h3>
                <span class="product-badge" style="background:var(--color-accent); color:#111; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:800;">PRO</span>
            </div>
            <p style="color:var(--color-text-dim); font-size:var(--fs-sm); margin-bottom:var(--sp-4); flex:1;">
                Ideal para publicistas y empresas. Envíanos tu diseño en alta calidad (.ai, .pdf, .tiff) y nosotros nos encargamos de la producción.
            </p>
            <div class="product-card__price-row" style="margin-top:auto; border-top:1px solid var(--color-border); padding-top:var(--sp-3);">
              <div>
                <span class="product-card__price" style="font-size:var(--fs-xl);">${price}</span>
              </div>
              <button class="btn btn--primary btn-add-cart" data-id="${p.id}" title="Contratar Servicio" style="padding:var(--sp-2) var(--sp-4); border-radius:var(--radius-full);">
                Contratar <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </article>`;
        }).join('');

        // Attach cart events (using logic similar to store)
        const addToCartBtns = grid.querySelectorAll('.btn-add-cart');
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const prod = services.find(p => p.id === id);
                if (prod) {
                    // Send to cart (requires carrito.js)
                    if (window.addItemToCart) {
                        window.addItemToCart(prod, 1);
                        alert(`Servicio "${prod.nombre}" añadido al carrito. Recuerda adjuntar tus archivos en el Checkout.`);
                    }
                }
            });
        });
    }

    // --- Init ---
    init();
})();
