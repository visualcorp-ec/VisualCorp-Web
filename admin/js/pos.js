/**
 * VisualCorp Point of Sale (POS) Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (!supabaseClient) {
        console.error('Supabase client not initialized.');
        return;
    }

    let catalog = [];
    let ticket = []; // { id, nombre, precio, qty }
    let currentClient = { id: null, nombre: 'Cliente Local (Mostrador)' };

    const gridEl = document.getElementById('posGrid');
    const listEl = document.getElementById('ticketList');
    const totalEl = document.getElementById('posTotal');

    // Load Catalog
    async function loadCatalog() {
        gridEl.innerHTML = '<div style="color:#fff; padding:20px;">Cargando catálogo...</div>';

        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('activo', true)
            .order('nombre');

        if (error) {
            console.error('Error fetching POS catalog', error);
            gridEl.innerHTML = '<div style="color:red; padding:20px;">Error al cargar.</div>';
            return;
        }

        catalog = data;
        renderCatalog(catalog);
    }

    function renderCatalog(items) {
        gridEl.innerHTML = '';
        if (items.length === 0) {
            gridEl.innerHTML = '<div style="color:var(--color-text-dim);">No se encontraron productos.</div>';
            return;
        }

        items.forEach(prod => {
            const el = document.createElement('div');
            el.className = 'pos-product';
            const imgUrl = prod.imagen_url || '../assets/placeholder.png'; // Assuming generic placeholder

            el.innerHTML = `
                <img src="${imgUrl}" class="pos-product__img" alt="${prod.nombre}" onerror="this.src=''; this.style.background='#333'">
                <div class="pos-product__info">
                    <div class="pos-product__title">${prod.nombre}</div>
                    <div class="pos-product__price">$${prod.precio.toFixed(2)}</div>
                </div>
            `;

            el.addEventListener('click', () => addToTicket(prod));
            gridEl.appendChild(el);
        });
    }

    // Ticket Management
    function addToTicket(prod) {
        const existing = ticket.find(item => item.id === prod.id);
        if (existing) {
            existing.qty++;
        } else {
            ticket.push({
                id: prod.id,
                nombre: prod.nombre,
                precio: prod.precio,
                qty: 1
            });
        }
        renderTicket();
    }

    function updateQty(id, delta) {
        const item = ticket.find(i => i.id === id);
        if (!item) return;

        item.qty += delta;
        if (item.qty <= 0) {
            ticket = ticket.filter(i => i.id !== id);
        }
        renderTicket();
    }

    function renderTicket() {
        if (ticket.length === 0) {
            listEl.innerHTML = `
                <div style="color:var(--color-text-dim); text-align:center; padding-top:var(--sp-8);">
                    <i class="fa-solid fa-cart-arrow-down" style="font-size:2rem; opacity:0.3; margin-bottom:var(--sp-2);"></i><br>
                    El carrito está vacío
                </div>
            `;
            totalEl.textContent = '$0.00';
            return;
        }

        listEl.innerHTML = '';
        let total = 0;

        ticket.forEach(item => {
            const subt = item.precio * item.qty;
            total += subt;

            const el = document.createElement('div');
            el.className = 'ticket-item';

            el.innerHTML = `
                <div style="flex:1;">
                    <div class="ticket-item__name">${item.nombre}</div>
                    <div style="color:var(--color-accent); font-size:var(--fs-xs);">$${item.precio.toFixed(2)} c/u</div>
                </div>
                <div class="ticket-item__controls">
                    <button class="qty-btn" onclick="updateQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
                    <span style="width:20px; text-align:center; font-weight:700;">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
                </div>
                <div style="width: 70px; text-align:right; font-weight:800;">$${subt.toFixed(2)}</div>
            `;
            listEl.appendChild(el);
        });

        totalEl.textContent = `$${total.toFixed(2)}`;
    }

    // Expose for inline onclick
    window.updateQty = updateQty;
    window.selectClient = () => {
        const name = prompt("Ingrese nombre del Cliente Local:");
        if (name && name.trim()) {
            currentClient.nombre = name.trim();
            document.getElementById('clientName').textContent = currentClient.nombre;
        }
    };

    // Connect Search
    document.getElementById('posSearch')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = catalog.filter(p => p.nombre.toLowerCase().includes(term));
        renderCatalog(filtered);
    });

    // Proforma (PDF) Workflow
    document.getElementById('btnProforma')?.addEventListener('click', () => {
        if (ticket.length === 0) {
            alert('Añade productos para generar una proforma.');
            return;
        }

        const total = ticket.reduce((acc, i) => acc + (i.precio * i.qty), 0);

        // Build an off-screen HTML template for the PDF
        const pdfContent = document.createElement('div');
        pdfContent.style.padding = '40px';
        pdfContent.style.fontFamily = 'Arial, sans-serif';
        pdfContent.style.color = '#333';
        pdfContent.style.background = '#fff';

        const itemsHtml = ticket.map(i => `
            <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;">${i.nombre}</td>
                <td style="padding:10px; border-bottom:1px solid #eee; text-align:center;">${i.qty}</td>
                <td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">$${i.precio.toFixed(2)}</td>
                <td style="padding:10px; border-bottom:1px solid #eee; text-align:right; font-weight:bold;">$${(i.precio * i.qty).toFixed(2)}</td>
            </tr>
        `).join('');

        pdfContent.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 40px;">
                <div>
                    <h1 style="color:#000; margin:0; font-size:28px;">Visual<span style="color:#f2b705;">Corp</span></h1>
                    <p style="color:#666; font-size:12px; margin:5px 0 0 0;">Soluciones Gráficas y Publicitarias</p>
                </div>
                <div style="text-align:right;">
                    <h2 style="margin:0; color:#444;">PROFORMA</h2>
                    <p style="color:#666; font-size:12px; margin:5px 0 0 0;">Fecha: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                <strong>Cliente:</strong> ${currentClient.nombre}
            </div>

            <table style="width:100%; border-collapse: collapse; margin-bottom: 40px; font-size: 14px;">
                <thead>
                    <tr style="background:#f2b705; color:#000;">
                        <th style="padding:10px; text-align:left;">Descripción</th>
                        <th style="padding:10px; text-align:center;">Cant.</th>
                        <th style="padding:10px; text-align:right;">P.Unit ($)</th>
                        <th style="padding:10px; text-align:right;">Subtotal ($)</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div style="display:flex; justify-content:flex-end;">
                <div style="width:250px;">
                    <div style="display:flex; justify-content:space-between; padding:10px 0; border-top:2px solid #000; font-size:18px; font-weight:bold;">
                        <span>TOTAL:</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                    <p style="font-size:10px; color:#888; text-align:right; margin-top:5px;">Documento no válido como factura fiscal.</p>
                </div>
            </div>
        `;

        // Generate PDF using html2pdf
        const opt = {
            margin: 1,
            filename: `Proforma_VisualCorp_${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(pdfContent).save();
    });

    // Checkout (Cobrar) Workflow
    document.getElementById('btnCobrar')?.addEventListener('click', async () => {
        if (ticket.length === 0) return;

        const total = ticket.reduce((acc, i) => acc + (i.precio * i.qty), 0);
        const confirmMsg = `¿Confirmar venta por $${total.toFixed(2)}?\nCliente: ${currentClient.nombre}`;

        if (!confirm(confirmMsg)) return;

        try {
            document.getElementById('btnCobrar').disabled = true;
            document.getElementById('btnCobrar').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';

            // Insert POS Order into Supabase CRM
            const { data: orderData, error: orderErr } = await supabaseClient
                .from('ordenes')
                .insert([{
                    estado: 'aceptado',
                    etapa: 'produccion', // Default POS orders jump to production layout
                    total: total,
                    prioridad: 'media',
                    metodo_pago: 'efectivo', // Can be expanded to POS terminal selection
                    // If no explicit user, we leave client_id null and store basic meta in "direccion" or note (Workaround for standalone pos)
                    direccion: JSON.stringify({ notas: `Venta Mostrador: ${currentClient.nombre}` })
                }])
                .select()
                .single();

            if (orderErr) throw orderErr;

            // Insert Items
            const itemsToInsert = ticket.map(i => ({
                orden_id: orderData.id,
                producto_id: i.id,
                cantidad: i.qty,
                precio_unitario: i.precio,
                opciones: { src: 'Local POS' }
            }));

            const { error: itemsErr } = await supabaseClient
                .from('orden_items')
                .insert(itemsToInsert);

            if (itemsErr) throw itemsErr;

            alert('Venta registrada exitosamente.');
            ticket = [];
            currentClient = { id: null, nombre: 'Cliente Local (Mostrador)' };
            document.getElementById('clientName').textContent = currentClient.nombre;
            renderTicket();

        } catch (err) {
            console.error('POS Checkout Error', err);
            alert('Error al registrar la venta en la Base de Datos.');
        } finally {
            document.getElementById('btnCobrar').disabled = false;
            document.getElementById('btnCobrar').innerHTML = '<i class="fa-solid fa-money-bill-wave"></i> Cobrar';
        }
    });

    // Boot
    loadCatalog();
});
