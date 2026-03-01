// ============================================
// inicio.js — Homepage dynamic content
// Hero carousel, festive dates, popular products
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadCarousel();
    loadFestiveDates();
    loadPopularProducts();
});

// ===== HERO CAROUSEL =====
async function loadCarousel() {
    try {
        const { data: slides } = await supabaseClient
            .from('carousel_slides')
            .select('*')
            .eq('activo', true)
            .order('orden', { ascending: true });

        if (!slides || slides.length === 0) return; // Keep default hero

        const carousel = document.getElementById('heroCarousel');
        const dots = document.getElementById('heroDots');
        const defaultHero = document.getElementById('heroDefault');
        const slideContent = document.getElementById('heroSlideContent');

        // Build slides
        carousel.innerHTML = slides.map((s, i) => `
            <div class="hero-slide" data-idx="${i}" style="position:absolute; inset:0; opacity:${i === 0 ? 1 : 0}; transition:opacity 1s ease; background:url('${s.imagen_url}') center/cover no-repeat;">
                <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(11,15,25,.7) 0%, rgba(11,15,25,.5) 100%);"></div>
            </div>
        `).join('');

        // Show dots
        if (slides.length > 1) {
            dots.style.display = 'flex';
            dots.innerHTML = slides.map((_, i) => `
                <button class="carousel-dot ${i === 0 ? 'active' : ''}" data-idx="${i}" style="width:12px; height:12px; border-radius:50%; border:2px solid var(--color-accent); background:${i === 0 ? 'var(--color-accent)' : 'transparent'}; cursor:pointer; transition:all .3s;"></button>
            `).join('');
        }

        let currentSlide = 0;

        function showSlide(idx) {
            const allSlides = carousel.querySelectorAll('.hero-slide');
            allSlides.forEach((s, i) => s.style.opacity = i === idx ? '1' : '0');

            const allDots = dots.querySelectorAll('.carousel-dot');
            allDots.forEach((d, i) => {
                d.classList.toggle('active', i === idx);
                d.style.background = i === idx ? 'var(--color-accent)' : 'transparent';
            });

            // Update text content
            const slide = slides[idx];
            if (slide.titulo || slide.subtitulo) {
                defaultHero.style.display = 'none';
                slideContent.style.display = '';
                document.getElementById('heroSlideTitle').innerHTML = slide.titulo || '';
                document.getElementById('heroSlideSubtitle').textContent = slide.subtitulo || '';
            } else {
                defaultHero.style.display = '';
                slideContent.style.display = 'none';
            }

            currentSlide = idx;
        }

        // Dot click handlers
        dots.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', () => showSlide(parseInt(dot.dataset.idx)));
        });

        // Autoplay
        if (slides.length > 1) {
            setInterval(() => {
                showSlide((currentSlide + 1) % slides.length);
            }, 5000);
        }

    } catch (err) {
        console.error('Error loading carousel:', err);
    }
}

// ===== FESTIVE DATES =====
async function loadFestiveDates() {
    try {
        const { data: dates } = await supabaseClient
            .from('fechas_festivas')
            .select('*, descuentos(codigo, tipo, valor)')
            .eq('activo', true)
            .order('fecha_inicio', { ascending: true });

        if (!dates || dates.length === 0) return;

        // Filter to show upcoming and current dates (not past)
        const now = new Date();
        const upcoming = dates.filter(d => new Date(d.fecha_fin) >= now);
        if (upcoming.length === 0) return;

        const section = document.getElementById('festiveDatesSection');
        const list = document.getElementById('festiveDatesList');
        section.style.display = '';

        list.innerHTML = upcoming.map(d => {
            const start = new Date(d.fecha_inicio);
            const end = new Date(d.fecha_fin);
            const isActive = now >= start && now <= end;
            const daysUntil = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

            const countdown = isActive
                ? '<span style="color:#22c55e; font-weight:700;">🟢 ¡Ahora activa!</span>'
                : daysUntil <= 30
                    ? `<span style="color:var(--color-accent); font-weight:700;">⏰ En ${daysUntil} días</span>`
                    : `<span style="color:var(--color-text-dim);">📅 ${start.toLocaleDateString('es-EC', { month: 'long', day: 'numeric' })}</span>`;

            const discount = d.descuentos
                ? `<div style="margin-top:var(--sp-3); padding:var(--sp-2) var(--sp-3); background:${d.color}20; border-radius:var(--radius-md); font-size:var(--fs-sm); font-weight:700; color:${d.color};">
                    🏷️ Código: <span style="font-family:monospace;">${d.descuentos.codigo}</span> — ${d.descuentos.tipo === 'porcentaje' ? d.descuentos.valor + '% OFF' : '$' + d.descuentos.valor + ' OFF'}
                </div>`
                : '';

            return `<div class="fade-in" style="background:var(--color-bg-alt); border:2px solid ${d.color}40; border-radius:var(--radius-lg); overflow:hidden; transition:transform .2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
                <div style="height:6px; background:${d.color};"></div>
                <div style="padding:var(--sp-5);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-2);">
                        <h3 style="margin:0; color:${d.color}; font-size:var(--fs-lg);">${d.nombre}</h3>
                        ${countdown}
                    </div>
                    <p style="margin:0; font-size:var(--fs-sm); color:var(--color-text-dim);">
                        ${start.toLocaleDateString('es-EC', { month: 'long', day: 'numeric' })} — ${end.toLocaleDateString('es-EC', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    ${discount}
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('Error loading festive dates:', err);
    }
}

// ===== POPULAR PRODUCTS =====
async function loadPopularProducts() {
    try {
        // Get bestselling products from order items
        const { data: orderItems } = await supabaseClient
            .from('orden_items')
            .select('producto_id, nombre_producto, cantidad');

        if (!orderItems || orderItems.length === 0) {
            // Fallback: show featured products
            await loadFeaturedProducts();
            return;
        }

        // Aggregate sales
        const sales = {};
        orderItems.forEach(item => {
            if (item.producto_id) {
                if (!sales[item.producto_id]) sales[item.producto_id] = { name: item.nombre_producto, qty: 0 };
                sales[item.producto_id].qty += item.cantidad || 1;
            }
        });

        const topIds = Object.entries(sales)
            .sort((a, b) => b[1].qty - a[1].qty)
            .slice(0, 6)
            .map(([id]) => id);

        if (topIds.length === 0) { await loadFeaturedProducts(); return; }

        const { data: products } = await supabaseClient
            .from('productos')
            .select('*')
            .in('id', topIds)
            .eq('activo', true);

        if (!products || products.length === 0) { await loadFeaturedProducts(); return; }

        renderProducts(products, sales);
    } catch (err) {
        console.error('Error loading popular products:', err);
        await loadFeaturedProducts();
    }
}

async function loadFeaturedProducts() {
    try {
        const { data: products } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('activo', true)
            .limit(6);

        if (!products || products.length === 0) return;
        renderProducts(products, {});
    } catch (err) {
        console.error('Error loading featured products:', err);
    }
}

function renderProducts(products, salesMap) {
    const section = document.getElementById('popularProductsSection');
    const list = document.getElementById('popularProductsList');
    section.style.display = '';

    list.innerHTML = products.map(p => {
        const salesBadge = salesMap[p.id]
            ? `<div style="position:absolute; top:var(--sp-2); right:var(--sp-2); background:var(--color-accent); color:#111; font-size:var(--fs-xs); font-weight:800; padding:2px 8px; border-radius:var(--radius-md);">🔥 ${salesMap[p.id].qty} vendidos</div>`
            : '';

        const img = p.imagen_url || p.imagen
            ? `<img src="${p.imagen_url || p.imagen}" alt="${p.nombre}" style="width:100%; height:180px; object-fit:cover;" loading="lazy">`
            : `<div style="width:100%; height:180px; background:var(--color-surface); display:flex; align-items:center; justify-content:center; color:var(--color-text-dim); font-size:2rem;">📦</div>`;

        return `<div class="fade-in" style="background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-lg); overflow:hidden; transition:transform .2s; position:relative;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
            ${salesBadge}
            ${img}
            <div style="padding:var(--sp-4);">
                <h4 style="margin:0 0 var(--sp-1) 0; color:var(--color-heading); font-size:var(--fs-base);">${p.nombre}</h4>
                <p style="margin:0 0 var(--sp-2) 0; font-size:var(--fs-xs); color:var(--color-text-dim); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.descripcion || p.nombre}</p>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:800; color:var(--color-accent); font-size:var(--fs-lg);">$${Number(p.pvp || p.precio || 0).toFixed(2)}</span>
                    <a href="tienda.html" class="btn btn--primary" style="font-size:var(--fs-xs); padding:var(--sp-2) var(--sp-3);">Ver más</a>
                </div>
            </div>
        </div>`;
    }).join('');
}
