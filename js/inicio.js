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
let festiveDatesCache = [];
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

async function loadFestiveDates() {
    try {
        const { data: dates } = await supabaseClient
            .from('fechas_festivas')
            .select('*, descuentos(codigo, tipo, valor)')
            .eq('activo', true)
            .order('fecha_inicio', { ascending: true });

        if (!dates || dates.length === 0) return;

        festiveDatesCache = dates;
        const section = document.getElementById('festiveDatesSection');
        section.style.display = '';

        // Inject Calendar Container UI
        const listContainer = document.getElementById('festiveDatesList');
        listContainer.style.display = 'block'; // Remove grid that was inline
        listContainer.innerHTML = `
            <div class="calendar-wrapper" style="background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-xl); padding:var(--sp-6);">
                <div class="calendar-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-6);">
                    <button id="prevMonthBtn" class="btn btn--secondary" style="padding:var(--sp-2) var(--sp-4);"><i class="fa-solid fa-chevron-left"></i></button>
                    <h3 id="calendarMonthTitle" style="margin:0; font-size:var(--fs-xl); color:var(--color-heading); text-transform:capitalize;"></h3>
                    <button id="nextMonthBtn" class="btn btn--secondary" style="padding:var(--sp-2) var(--sp-4);"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
                <div class="calendar-grid-header" style="display:grid; grid-template-columns:repeat(7, 1fr); text-align:center; font-weight:700; color:var(--color-text-muted); margin-bottom:var(--sp-2);">
                    <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                </div>
                <div id="calendarDays" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:var(--sp-2);"></div>
                <div id="calendarEvents" style="margin-top:var(--sp-6); display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:var(--sp-4);"></div>
            </div>
        `;

        document.getElementById('prevMonthBtn').addEventListener('click', () => changeMonth(-1));
        document.getElementById('nextMonthBtn').addEventListener('click', () => changeMonth(1));

        renderCalendar();

    } catch (err) {
        console.error('Error loading festive dates:', err);
    }
}

function changeMonth(delta) {
    currentCalendarMonth += delta;
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    renderCalendar();
}

function renderCalendar() {
    const title = document.getElementById('calendarMonthTitle');
    const daysGrid = document.getElementById('calendarDays');
    const eventsGrid = document.getElementById('calendarEvents');

    const date = new Date(currentCalendarYear, currentCalendarMonth, 1);
    title.textContent = date.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });

    // Calendar logic
    const firstDay = date.getDay();
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();

    // Find events happening in this month
    const monthEvents = festiveDatesCache.filter(d => {
        const start = new Date(d.fecha_inicio);
        const end = new Date(d.fecha_fin);
        return (start.getFullYear() === currentCalendarYear && start.getMonth() === currentCalendarMonth) ||
            (end.getFullYear() === currentCalendarYear && end.getMonth() === currentCalendarMonth) ||
            (start <= date && end >= new Date(currentCalendarYear, currentCalendarMonth, daysInMonth));
    });

    let daysHtml = '';
    // Empty padding days
    for (let i = 0; i < firstDay; i++) {
        daysHtml += `<div style="padding:var(--sp-3); border-radius:var(--radius-md); background:transparent;"></div>`;
    }

    // Days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const currentIterDate = new Date(currentCalendarYear, currentCalendarMonth, i);
        let hasEvent = monthEvents.find(e => {
            const s = new Date(e.fecha_inicio); s.setHours(0, 0, 0, 0);
            const en = new Date(e.fecha_fin); en.setHours(23, 59, 59, 999);
            return currentIterDate >= s && currentIterDate <= en;
        });

        const isToday = currentIterDate.getDate() === today.getDate() && currentIterDate.getMonth() === today.getMonth() && currentIterDate.getFullYear() === today.getFullYear();

        let bg = 'var(--color-surface)';
        let color = 'var(--color-text)';
        let border = '1px solid var(--color-border)';

        if (hasEvent) {
            bg = `${hasEvent.color}20`;
            color = hasEvent.color;
            border = `1px solid ${hasEvent.color}`;
        }
        if (isToday) {
            border = `2px solid var(--color-heading)`;
        }

        daysHtml += `<div style="text-align:center; padding:var(--sp-3); border-radius:var(--radius-md); background:${bg}; color:${color}; border:${border}; font-weight:${hasEvent ? '800' : '400'};">
            ${i}
        </div>`;
    }
    daysGrid.innerHTML = daysHtml;

    // Render Event Cards below calendar
    if (monthEvents.length === 0) {
        eventsGrid.innerHTML = `<p style="color:var(--color-text-dim); text-align:center; grid-column:1/-1;">No hay promociones especiales este mes.</p>`;
    } else {
        eventsGrid.innerHTML = monthEvents.map(d => {
            const start = new Date(d.fecha_inicio);
            const end = new Date(d.fecha_fin);
            const discount = d.descuentos
                ? `<div style="margin-top:var(--sp-3); padding:var(--sp-2) var(--sp-3); background:${d.color}20; border-radius:var(--radius-md); font-size:var(--fs-sm); font-weight:700; color:${d.color};">
                    🏷️ Código: <span style="font-family:monospace;">${d.descuentos.codigo}</span> — ${d.descuentos.tipo === 'porcentaje' ? d.descuentos.valor + '% OFF' : '$' + d.descuentos.valor + ' OFF'}
                </div>`
                : '';

            return `<div class="fade-in" style="background:var(--color-surface); border-left:4px solid ${d.color}; border-radius:var(--radius-lg); padding:var(--sp-4);">
                <h4 style="margin:0 0 var(--sp-1) 0; color:${d.color}; font-size:var(--fs-base);">${d.nombre}</h4>
                <p style="margin:0; font-size:var(--fs-xs); color:var(--color-text-dim);">
                    ${start.toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('es-EC', { month: 'short', day: 'numeric' })}
                </p>
                ${discount}
            </div>`;
        }).join('');
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
        const img = p.imagen_url || p.imagen
            ? `<img src="${p.imagen_url || p.imagen}" alt="${p.nombre}" style="width:100%; height:180px; object-fit:cover;" loading="lazy">`
            : `<div style="width:100%; height:180px; background:var(--color-surface); display:flex; align-items:center; justify-content:center; color:var(--color-text-dim); font-size:2rem;">📦</div>`;

        return `<div class="fade-in" style="background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-lg); overflow:hidden; transition:transform .2s; position:relative;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
            ${img}
            <div style="padding:var(--sp-4);">
                <h4 style="margin:0 0 var(--sp-1) 0; color:var(--color-heading); font-size:var(--fs-base);">${p.nombre}</h4>
                <p style="margin:0 0 var(--sp-4) 0; font-size:var(--fs-xs); color:var(--color-text-dim); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${p.descripcion || p.nombre}</p>
                <div style="display:flex; justify-content:center;">
                    <a href="tienda.html" class="btn btn--primary" style="font-size:var(--fs-xs); padding:var(--sp-2) var(--sp-4); width:100%; text-align:center;">Cotizar / Ver Más</a>
                </div>
            </div>
        </div>`;
    }).join('');
}
