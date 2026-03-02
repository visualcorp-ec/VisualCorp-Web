// ============================================
// checkout.js — Checkout flow: customize → data → pay
// ============================================

(function () {
    const items = Carrito.getItems();
    if (items.length === 0 && document.getElementById('step1')) {
        window.location.href = 'carrito.html';
        return;
    }

    let selectedMethod = '';
    let customizations = {};
    let advisors = [];
    let selectedAdvisorId = 'auto';

    // --- Product type config for customization fields ---
    const CUSTOM_FIELDS = {
        'default': [
            { key: 'archivo', label: '🖼️ Archivo adjunto (opcional)', type: 'file', accept: 'image/*,.pdf,.ai,.psd,.cdr' },
            { key: 'notas', label: '📝 Notas o descripción', type: 'textarea', placeholder: 'Describe cómo quieres tu producto, texto que deseas, colores, fechas, etc. Puedes subir un archivo arriba o enviarlo por WhatsApp.' }
        ],
        'lona': [
            { key: 'ancho', label: '📏 Ancho (cm)', type: 'number', placeholder: 'Ej: 100' },
            { key: 'alto', label: '📐 Alto (cm)', type: 'number', placeholder: 'Ej: 300' },
            { key: 'archivo', label: '🖼️ Imagen para imprimir', type: 'file', accept: 'image/*,.pdf,.ai,.psd' },
            { key: 'notas', label: '📝 Notas', type: 'textarea', placeholder: 'Acabados, ojales, instalación...' }
        ],
        'taza': [
            { key: 'descripcion', label: '🎨 Diseño deseado', type: 'textarea', placeholder: 'Describe el diseño de tu taza...' },
            { key: 'archivo', label: '🖼️ Imagen/Logo', type: 'file', accept: 'image/*,.pdf' },
            { key: 'notas', label: '📝 Notas adicionales', type: 'textarea', placeholder: 'Texto, colores preferidos...' }
        ],
        'lampara': [
            { key: 'nombre1', label: '💕 Nombre 1', type: 'text', placeholder: 'Ej: María' },
            { key: 'nombre2', label: '💕 Nombre 2', type: 'text', placeholder: 'Ej: Carlos' },
            { key: 'fecha', label: '📅 Fecha especial', type: 'text', placeholder: 'Ej: 14 de febrero' },
            { key: 'frase', label: '💬 Frase', type: 'text', placeholder: 'Ej: Juntos por siempre' },
            { key: 'foto1', label: '📷 Foto 1', type: 'file', accept: 'image/*' },
            { key: 'foto2', label: '📷 Foto 2', type: 'file', accept: 'image/*' },
            { key: 'notas', label: '📝 Notas', type: 'textarea', placeholder: 'Detalles adicionales...' }
        ],
        'ropa': [
            { key: 'talla', label: '👕 Talla', type: 'select', options: ['S', 'M', 'L', 'XL', 'XXL'] },
            { key: 'color', label: '🎨 Color preferido', type: 'text', placeholder: 'Ej: Negro, Blanco' },
            { key: 'ubicacion', label: '📍 Ubicación del diseño', type: 'select', options: ['Frente', 'Espalda', 'Manga izq.', 'Manga der.', 'Pecho izq.'] },
            { key: 'archivo', label: '🖼️ Arte/Logo', type: 'file', accept: 'image/*,.pdf,.ai' },
            { key: 'notas', label: '📝 Notas', type: 'textarea', placeholder: 'Detalles técnica (DTF, sublimación, bordado)...' }
        ],
        'impresion': [
            { key: 'ancho', label: '📏 Ancho (cm)', type: 'number', placeholder: 'Ej: 100' },
            { key: 'alto', label: '📐 Alto (cm)', type: 'number', placeholder: 'Ej: 200' },
            { key: 'archivo', label: '🖼️ Archivo de impresión', type: 'file', accept: 'image/*,.pdf,.ai,.psd,.cdr' },
            { key: 'notas', label: '📝 Notas', type: 'textarea', placeholder: 'Resolución, acabados, cantidad...' }
        ]
    };

    function getFieldsForProduct(item) {
        const name = (item.nombre || '').toLowerCase();
        const sub = (item.subcategoria || '').toLowerCase();
        if (name.includes('taza') || name.includes('jarro') || name.includes('mug')) return CUSTOM_FIELDS.taza;
        if (name.includes('lampara') || name.includes('lámpara')) return CUSTOM_FIELDS.lampara;
        if (name.includes('camiseta') || name.includes('polo') || name.includes('gorra') || name.includes('bolso') || sub.includes('ropa') || sub.includes('textil')) return CUSTOM_FIELDS.ropa;
        if (name.includes('lona') || name.includes('banner') || name.includes('vinil') || name.includes('giganto') || sub.includes('sustrato') || sub.includes('impresion')) return CUSTOM_FIELDS.impresion;
        return CUSTOM_FIELDS.default;
    }

    // --- STEP 1: Render customization forms ---
    function renderCustomize() {
        const list = document.getElementById('customizeList');
        if (!list) return;

        const isLoggedIn = typeof Auth !== 'undefined' && Auth.isLoggedIn();

        list.innerHTML = items.map((item, i) => {
            const fields = getFieldsForProduct(item);
            const needsCustom = fields.length > 1;
            const imgSrc = item.imagen || 'https://placehold.co/60x60/1a2035/f2b705?text=📦';

            let fieldsHTML = '';
            if (needsCustom && !isLoggedIn) {
                fieldsHTML = `
                    <div class="auth-error" style="margin-top:var(--sp-3);">
                        🔒 <a href="login.html" style="color:#ef4444; text-decoration:underline;">Inicia sesión</a> para personalizar este producto, o lo enviamos a un asesor por WhatsApp.
                    </div>
                    <div class="form-group" style="margin-top:var(--sp-3);">
                        <label>📝 Notas rápidas</label>
                        <textarea class="custom-field" data-idx="${i}" data-key="notas" rows="2" placeholder="Describe qué necesitas..." style="width:100%; background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:var(--sp-3); color:var(--color-text); font-family:inherit; resize:vertical;"></textarea>
                    </div>`;
            } else {
                fieldsHTML = fields.map(f => buildField(f, i)).join('');
            }

            return `
                <div class="customize-item fade-in">
                    <div class="customize-item__header">
                        <img src="${imgSrc}" alt="${item.nombre}" style="width:50px; height:50px; border-radius:var(--radius-md); object-fit:cover;">
                        <div>
                            <h4 style="margin:0; color:var(--color-heading);">${item.nombre} <span style="color:var(--color-text-dim); font-weight:400;">×${item.cantidad}</span></h4>
                            <span style="font-size:var(--fs-xs); color:var(--color-accent);">$${(item.precio * item.cantidad).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="customize-item__fields">
                        ${fieldsHTML}
                    </div>
                </div>`;
        }).join('');
    }

    function buildField(f, idx) {
        const id = `cf_${idx}_${f.key}`;
        if (f.type === 'textarea') {
            return `<div class="form-group"><label>${f.label}</label>
                <textarea class="custom-field" data-idx="${idx}" data-key="${f.key}" id="${id}" rows="2" placeholder="${f.placeholder || ''}" style="width:100%; background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:var(--sp-3); color:var(--color-text); font-family:inherit; resize:vertical;"></textarea></div>`;
        }
        if (f.type === 'file') {
            return `<div class="form-group"><label>${f.label}</label>
                <input type="file" class="custom-field custom-file" data-idx="${idx}" data-key="${f.key}" id="${id}" accept="${f.accept || '*'}" style="width:100%; background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:var(--sp-3); color:var(--color-text); font-family:inherit;"></div>`;
        }
        if (f.type === 'select') {
            const opts = f.options.map(o => `<option value="${o}">${o}</option>`).join('');
            return `<div class="form-group"><label>${f.label}</label>
                <select class="custom-field" data-idx="${idx}" data-key="${f.key}" id="${id}"><option value="">— Elegir —</option>${opts}</select></div>`;
        }
        return `<div class="form-group"><label>${f.label}</label>
            <input type="${f.type}" class="custom-field" data-idx="${idx}" data-key="${f.key}" id="${id}" placeholder="${f.placeholder || ''}" style="width:100%; background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:var(--sp-3); color:var(--color-text); font-family:inherit;"></div>`;
    }

    // --- Collect customizations ---
    function collectCustomizations() {
        customizations = {};
        document.querySelectorAll('.custom-field').forEach(el => {
            const idx = el.dataset.idx;
            const key = el.dataset.key;
            if (!customizations[idx]) customizations[idx] = {};
            if (el.type === 'file') {
                if (el.files && el.files.length > 0) customizations[idx][key] = el.files[0];
            } else {
                if (el.value.trim()) customizations[idx][key] = el.value.trim();
            }
        });
    }

    // --- STEP 2: Auto-fill if logged in ---
    function fillUserData() {
        if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
            const profile = Auth.getProfile();
            const user = Auth.getUser();
            if (profile?.nombre) document.getElementById('checkName').value = profile.nombre;
            if (profile?.telefono) document.getElementById('checkPhone').value = profile.telefono;
            if (user?.email) document.getElementById('checkEmail').value = user.email;
            const info = document.getElementById('loggedInInfo');
            if (info) info.style.display = '';
        }
        loadAdvisors();
    }

    // --- Load and render advisors ---
    async function loadAdvisors() {
        const listEl = document.getElementById('advisorList');
        if (!listEl) return;

        try {
            // Get employees
            const { data: emps } = await supabaseClient
                .from('perfiles')
                .select('id, nombre, whatsapp, foto_url, especialidad')
                .in('rol', ['empleado', 'admin'])
                .not('whatsapp', 'is', null);

            if (!emps || emps.length === 0) { listEl.innerHTML = ''; return; }

            // Get active order counts per advisor
            const { data: orders } = await supabaseClient
                .from('ordenes')
                .select('asesor_id')
                .not('estado', 'in', '(entregado,cancelado)');

            const orderCounts = {};
            (orders || []).forEach(o => {
                if (o.asesor_id) orderCounts[o.asesor_id] = (orderCounts[o.asesor_id] || 0) + 1;
            });

            advisors = emps.map(e => ({ ...e, activeOrders: orderCounts[e.id] || 0 }));

            // Render cards
            let html = `<div class="advisor-card ${selectedAdvisorId === 'auto' ? 'selected' : ''}" data-advisor="auto" style="cursor:pointer; text-align:center; padding:var(--sp-4); background:var(--color-bg-alt); border:2px solid ${selectedAdvisorId === 'auto' ? 'var(--color-accent)' : 'var(--color-border)'}; border-radius:var(--radius-lg); transition:all .2s;">
                <div style="font-size:2rem; margin-bottom:var(--sp-2);">🤖</div>
                <div style="font-weight:700; color:var(--color-heading);">Automático</div>
                <div style="font-size:var(--fs-xs); color:var(--color-text-dim);">Asignar al asesor con menos carga</div>
            </div>`;

            advisors.forEach(a => {
                const initial = (a.nombre || '?').charAt(0).toUpperCase();
                const avatar = a.foto_url
                    ? `<img src="${a.foto_url}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">`
                    : `<div style="width:50px;height:50px;border-radius:50%;background:var(--color-accent);display:flex;align-items:center;justify-content:center;font-weight:800;color:#111;font-size:1.2rem;margin:0 auto;">${initial}</div>`;
                const isSelected = selectedAdvisorId === a.id;
                html += `<div class="advisor-card ${isSelected ? 'selected' : ''}" data-advisor="${a.id}" style="cursor:pointer; text-align:center; padding:var(--sp-4); background:var(--color-bg-alt); border:2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}; border-radius:var(--radius-lg); transition:all .2s;">
                    ${avatar}
                    <div style="font-weight:700; color:var(--color-heading); margin-top:var(--sp-2);">${a.nombre}</div>
                    <div style="font-size:var(--fs-xs); color:var(--color-text-dim);">${a.especialidad || 'Asesor comercial'}</div>
                    <div style="font-size:var(--fs-xs); color:var(--color-accent); margin-top:var(--sp-1);">${a.activeOrders} pedidos activos</div>
                </div>`;
            });

            listEl.innerHTML = html;

            // Click handlers
            listEl.querySelectorAll('.advisor-card').forEach(card => {
                card.addEventListener('click', () => {
                    listEl.querySelectorAll('.advisor-card').forEach(c => {
                        c.classList.remove('selected');
                        c.style.borderColor = 'var(--color-border)';
                    });
                    card.classList.add('selected');
                    card.style.borderColor = 'var(--color-accent)';
                    selectedAdvisorId = card.dataset.advisor;
                    document.getElementById('selectedAdvisor').value = selectedAdvisorId;
                });
            });
        } catch (err) {
            console.error('Error loading advisors:', err);
            listEl.innerHTML = '';
        }
    }

    // --- Get assigned advisor (auto-balance or selected) ---
    function getAssignedAdvisor() {
        if (selectedAdvisorId !== 'auto' && selectedAdvisorId) {
            return advisors.find(a => a.id === selectedAdvisorId) || null;
        }
        // Auto: pick the one with fewest active orders
        if (advisors.length === 0) return null;
        return advisors.reduce((min, a) => a.activeOrders < min.activeOrders ? a : min, advisors[0]);
    }

    // --- STEP 3: Order summary ---
    function renderOrderSummary() {
        const summary = document.getElementById('orderSummary');
        const total = Carrito.getTotal();
        summary.innerHTML = items.map(item =>
            `<div class="kpi"><span class="kpi-label">${item.nombre} ×${item.cantidad}</span><span class="kpi-val">$${(item.precio * item.cantidad).toFixed(2)}</span></div>`
        ).join('');
        updateTotalDisplay(total);
    }

    let appliedDiscount = null;

    function updateTotalDisplay(subtotal) {
        let discountValue = 0;
        if (appliedDiscount) {
            if (appliedDiscount.tipo === 'porcentaje') {
                discountValue = subtotal * (appliedDiscount.valor / 100);
            } else {
                discountValue = Math.min(appliedDiscount.valor, subtotal);
            }
        }
        const finalTotal = Math.max(0, subtotal - discountValue);

        const discLine = document.getElementById('discountLine');
        const discAmount = document.getElementById('discountAmount');
        if (discountValue > 0 && discLine && discAmount) {
            discLine.style.display = '';
            discAmount.textContent = `-$${discountValue.toFixed(2)}`;
        } else if (discLine) {
            discLine.style.display = 'none';
        }
        document.getElementById('orderTotal').textContent = `$${finalTotal.toFixed(2)}`;
    }

    function getFinalTotal() {
        const subtotal = Carrito.getTotal();
        if (!appliedDiscount) return subtotal;
        let disc = appliedDiscount.tipo === 'porcentaje'
            ? subtotal * (appliedDiscount.valor / 100)
            : Math.min(appliedDiscount.valor, subtotal);
        return Math.max(0, subtotal - disc);
    }

    // --- Discount code handler ---
    function setupDiscountCode() {
        const btn = document.getElementById('btnApplyDiscount');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            const code = document.getElementById('discountCode').value.trim().toUpperCase();
            const msg = document.getElementById('discountMsg');
            if (!code) return;

            btn.disabled = true;
            btn.textContent = 'Verificando...';

            try {
                const { data, error } = await supabaseClient
                    .from('descuentos')
                    .select('*')
                    .eq('codigo', code)
                    .eq('activo', true)
                    .single();

                if (error || !data) {
                    msg.innerHTML = '<span style="color:#ef4444;">❌ Código no válido o expirado.</span>';
                    msg.style.display = 'block';
                    appliedDiscount = null;
                    updateTotalDisplay(Carrito.getTotal());
                    return;
                }

                // Check expiration
                if (data.fecha_fin && new Date(data.fecha_fin) < new Date()) {
                    msg.innerHTML = '<span style="color:#ef4444;">❌ Este código ha expirado.</span>';
                    msg.style.display = 'block';
                    return;
                }

                // Check max uses
                if (data.usos_maximos && data.usos_actuales >= data.usos_maximos) {
                    msg.innerHTML = '<span style="color:#ef4444;">❌ Este código ha alcanzado su límite de usos.</span>';
                    msg.style.display = 'block';
                    return;
                }

                appliedDiscount = data;
                const desc = data.tipo === 'porcentaje' ? `${data.valor}% de descuento` : `$${Number(data.valor).toFixed(2)} de descuento`;
                msg.innerHTML = `<span style="color:#22c55e;">✅ Código aplicado: ${desc}</span>`;
                msg.style.display = 'block';
                updateTotalDisplay(Carrito.getTotal());
            } catch (err) {
                msg.innerHTML = '<span style="color:#ef4444;">❌ Error al verificar el código.</span>';
                msg.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Aplicar';
            }
        });
    }

    // --- Payment method selection ---
    function setupPaymentMethods() {
        document.querySelectorAll('.payment-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedMethod = card.dataset.method;
                document.getElementById('btnSubmitOrder').disabled = false;
                showPaymentDetails(selectedMethod);
            });
        });
    }

    function showPaymentDetails(method) {
        const div = document.getElementById('paymentDetails');
        div.style.display = '';

        const details = {
            whatsapp: `<div class="auth-success">
                <i class="fa-brands fa-whatsapp"></i> Se enviará un resumen completo de tu pedido a nuestro asesor por WhatsApp. Recibirás confirmación inmediata.
            </div>`,
            paypal: `<div class="calculator fade-in" style="max-width:none;">
                <p style="color:var(--color-text-muted); margin-bottom:var(--sp-4);">Al confirmar, se abrirá una ventana segura de PayPal donde puedes pagar con tarjeta o cuenta PayPal.</p>
                <div class="auth-success">🔒 Tus datos de pago son procesados directamente por PayPal. VisualCorp nunca accede a tu información financiera.</div>
            </div>`,
            transferencia: `<div class="calculator fade-in" style="max-width:none;">
                <h4 style="color:var(--color-heading); margin-bottom:var(--sp-3);">Datos Bancarios</h4>
                <div class="kpi"><span class="kpi-label">Banco</span><span class="kpi-val">Banco del Pacífico</span></div>
                <div class="kpi"><span class="kpi-label">Cuenta</span><span class="kpi-val">Ahorros: 1234567890</span></div>
                <div class="kpi"><span class="kpi-label">Nombre</span><span class="kpi-val">Visual Corp EC</span></div>
                <div class="kpi"><span class="kpi-label">Cédula/RUC</span><span class="kpi-val">0912345678001</span></div>
                <div class="form-group" style="margin-top:var(--sp-4);">
                    <label><i class="fa-solid fa-receipt"></i> Subir comprobante</label>
                    <input type="file" id="receiptFile" accept="image/*,.pdf" style="width:100%; background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:var(--sp-3); color:var(--color-text); font-family:inherit;">
                </div>
            </div>`,
            deuna: `<div class="calculator fade-in" style="max-width:none; text-align:center;">
                <h4 style="color:var(--color-heading); margin-bottom:var(--sp-3);">Escanea con "De Una"</h4>
                <div style="background:#fff; display:inline-block; padding:var(--sp-4); border-radius:var(--radius-lg); margin-bottom:var(--sp-4);">
                    <i class="fa-solid fa-qrcode" style="font-size:8rem; color:#111;"></i>
                </div>
                <p style="color:var(--color-text-dim); font-size:var(--fs-sm);">El QR se actualizará pronto. Por ahora, usa WhatsApp o transferencia.</p>
            </div>`
        };

        div.innerHTML = details[method] || '';
    }

    // --- Submit order ---
    async function submitOrder() {
        const btn = document.getElementById('btnSubmitOrder');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

        collectCustomizations();

        const nombre = document.getElementById('checkName').value.trim();
        const telefono = document.getElementById('checkPhone').value.trim();
        const email = document.getElementById('checkEmail').value.trim();
        const notas = document.getElementById('checkNotes').value.trim();
        const direccion = document.getElementById('checkAddress')?.value.trim() || '';
        const total = getFinalTotal();

        // 1. Upload files to Supabase Storage
        const uploadPromises = [];
        const uploadedFiles = []; // Array of { index, key, url }

        for (const [idx, custom] of Object.entries(customizations)) {
            for (const [key, val] of Object.entries(custom)) {
                if (val instanceof File) {
                    const ext = val.name.split('.').pop();
                    const fileName = `pedido_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                    const filePath = `clientes/${fileName}`;

                    const uploadPromise = supabaseClient.storage
                        .from('pedidos')
                        .upload(filePath, val)
                        .then(({ data, error }) => {
                            if (error) {
                                console.error('Error uploading file:', key, error);
                                throw error;
                            }
                            const { data: urlData } = supabaseClient.storage
                                .from('pedidos')
                                .getPublicUrl(filePath);
                            uploadedFiles.push({ index: parseInt(idx), key, url: urlData.publicUrl, fileName: val.name });
                        });

                    uploadPromises.push(uploadPromise);
                }
            }
        }

        try {
            if (uploadPromises.length > 0) {
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo archivos...';
                await Promise.all(uploadPromises);
            }
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando Orden...';
        } catch (err) {
            alert('Hubo un error al subir tus archivos. Por favor, intenta enviarlos por WhatsApp.');
            console.error(err);
        }

        // Apply uploaded URLs back into customizations
        uploadedFiles.forEach(uf => {
            if (!customizations[uf.index]) customizations[uf.index] = {};
            customizations[uf.index][uf.key] = uf.url; // Replace File object with URL string
        });

        // Build WhatsApp message
        const waText = buildFullWhatsAppText(nombre, telefono, email, notas, total);

        let savedOrder = null;

        // Try to save to database ALWAYs
        try {
            const isLoggedIn = typeof Auth !== 'undefined' && Auth.isLoggedIn();

            const orderData = {
                cliente_nombre: nombre,
                cliente_telefono: telefono,
                cliente_email: email,
                estado: 'pendiente',
                metodo_pago: selectedMethod,
                subtotal: total,
                iva: 0,
                total: total,
                notas: notas,
                direccion: direccion || null
            };

            if (isLoggedIn) orderData.cliente_id = Auth.getUser().id;

            // Assign advisor
            const advisor = getAssignedAdvisor();
            if (advisor) orderData.asesor_id = advisor.id;

            const { data: order, error: orderErr } = await supabaseClient
                .from('ordenes')
                .insert(orderData)
                .select()
                .single();

            if (orderErr) throw orderErr;

            // Insert items
            const orderItems = items.map((item, i) => {
                const customFiles = Object.values(customizations[i] || {}).filter(v => typeof v === 'string' && v.startsWith('http'));
                return {
                    orden_id: order.id,
                    producto_id: item.id || null,
                    nombre_producto: item.nombre,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio,
                    subtotal: item.precio * item.cantidad,
                    personalizacion: customizations[i] || {},
                    archivos: customFiles,
                    notas: customizations[i]?.notas || ''
                };
            });

            await supabaseClient.from('orden_items').insert(orderItems);

            // Deduct Stock
            const stockUpdates = items
                .filter(item => item.control_stock && item.id)
                .map(item => {
                    const newStock = Math.max(0, item.stock - item.cantidad);
                    return supabaseClient
                        .from('productos')
                        .update({ stock: newStock })
                        .eq('id', item.id);
                });

            if (stockUpdates.length > 0) {
                await Promise.allSettled(stockUpdates);
            }

            savedOrder = order;

        } catch (err) {
            console.error('Error saving order or deducting stock:', err);
        }

        // Redirect / Confirmation Logic
        if (selectedMethod === 'whatsapp') {
            const advisor = getAssignedAdvisor();
            const waNumber = advisor?.whatsapp || '593997078212';
            window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`, '_blank');
            showConfirmation(`Tu pedido fue enviado por WhatsApp a ${advisor?.nombre || 'un asesor'}. Te responderá pronto.`);
        } else {
            // Default success for transfer/paypal (or fallback)
            if (savedOrder) {
                // Notificar por whatsapp tmbn
                window.open(`https://wa.me/593997078212?text=${encodeURIComponent(waText)}`, '_blank');
                showConfirmation(`Orden #${savedOrder.id.substring(0, 8)} registrada. Se envió el resumen a WhatsApp.`);
            } else {
                window.open(`https://wa.me/593997078212?text=${encodeURIComponent(waText)}`, '_blank');
                showConfirmation('Tu pedido fue enviado por WhatsApp (no se pudo guardar en la base de datos).');
            }
        }
    }

    function buildFullWhatsAppText(nombre, telefono, email, notas, total) {
        let text = `🛒 *NUEVO PEDIDO — VisualCorp*\n\n`;
        text += `👤 *Cliente:* ${nombre}\n`;
        text += `📱 *Tel:* ${telefono}\n`;
        if (email) text += `📧 *Email:* ${email}\n`;
        text += `💳 *Pago:* ${selectedMethod.toUpperCase()}\n`;
        text += `💰 *Total:* $${total.toFixed(2)}\n\n`;
        text += `📦 *Productos:*\n`;

        items.forEach((item, i) => {
            text += `${i + 1}. *${item.nombre}* ×${item.cantidad} — $${(item.precio * item.cantidad).toFixed(2)}\n`;
            const custom = customizations[i];
            if (custom) {
                Object.entries(custom).forEach(([key, val]) => {
                    if (val && !(val instanceof File)) {
                        text += `   📎 ${key}: ${val}\n`;
                    } else if (val instanceof File) {
                        text += `   📎 ${key}: [Archivo adjunto: ${val.name}]\n`;
                    }
                });
            }
        });

        if (notas) text += `\n📝 *Notas:* ${notas}\n`;
        text += `\n⏰ ${new Date().toLocaleString('es-EC')}`;
        return text;
    }

    function showConfirmation(msg) {
        document.getElementById('step3').style.display = 'none';
        document.getElementById('step4').style.display = '';
        document.getElementById('confirmMsg').textContent = msg;
        updateSteps(4);
        Carrito.clear();
        Carrito.updateBadge();
    }

    // --- Step navigation ---
    function updateSteps(activeStep) {
        document.querySelectorAll('.checkout-steps .step').forEach(s => {
            const n = parseInt(s.dataset.step);
            s.classList.toggle('active', n <= activeStep);
            s.classList.toggle('done', n < activeStep);
        });
    }

    // --- Configuration Logic ---
    let locationValidated = false;
    let installationBlocked = false;

    // --- Wire up buttons ---
    document.getElementById('btnToStep2')?.addEventListener('click', () => {
        collectCustomizations();
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = '';
        updateSteps(2);
        fillUserData();

        // Asynchronously check Geolocation
        if (typeof GeoLoc !== 'undefined' && !locationValidated) {
            GeoLoc.getLocation(false).then(loc => {
                locationValidated = true;
                const alertDiv = document.getElementById('geoCoverageAlert');
                if (!alertDiv) return;

                if (loc && loc.state && loc.country) {
                    const hasCoverage = GeoLoc.hasCoverage(loc.state, loc.country);

                    if (hasCoverage) {
                        alertDiv.innerHTML = `<div class="auth-success" style="padding:var(--sp-2) var(--sp-3); font-size:var(--fs-xs);">
                            📍 Ubicación detectada (${loc.city}, ${loc.state}). <strong>Sí contamos con cobertura para instalación en tu zona.</strong>
                        </div>`;
                        alertDiv.style.display = 'block';
                    } else {
                        // Check if any product needs installation inherently
                        const requiresInstall = items.some(i => ['lona', 'vinil', 'letrero', 'gigantografía'].some(k => i.nombre.toLowerCase().includes(k)));

                        if (requiresInstall) {
                            installationBlocked = true;
                            alertDiv.innerHTML = `<div class="auth-error" style="padding:var(--sp-2) var(--sp-3); font-size:var(--fs-xs);">
                                ⚠️ Ubicación detectada: ${loc.country === 'Ecuador' ? loc.state : loc.country}. 
                                <strong>Actualmente solo ofrecemos instalación en Costa y Sierra de Ecuador.</strong> Puedes comprar el producto sin instalación.
                            </div>`;
                            alertDiv.style.display = 'block';
                        }
                    }
                }
            }).catch(e => console.log('Location not available.'));
        }
    });

    document.getElementById('btnBackTo1')?.addEventListener('click', () => {
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step1').style.display = '';
        updateSteps(1);
    });

    document.getElementById('btnToStep3')?.addEventListener('click', () => {
        const name = document.getElementById('checkName').value.trim();
        const phone = document.getElementById('checkPhone').value.trim();
        if (!name || !phone) {
            alert('Por favor ingresa tu nombre y teléfono.');
            return;
        }

        if (installationBlocked) {
            const accept = confirm("Tu ubicación no cuenta con cobertura de instalación, por lo que enviaremos solo el producto terminado por correspondencia. ¿Deseas continuar?");
            if (!accept) return;
        }

        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = '';
        updateSteps(3);
        renderOrderSummary();
        setupPaymentMethods();
        setupDiscountCode();
    });

    document.getElementById('btnBackTo2')?.addEventListener('click', () => {
        document.getElementById('step3').style.display = 'none';
        document.getElementById('step2').style.display = '';
        updateSteps(2);
    });

    document.getElementById('btnSubmitOrder')?.addEventListener('click', submitOrder);

    // --- Init ---
    renderCustomize();
})();
