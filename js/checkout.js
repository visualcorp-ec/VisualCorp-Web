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

    // --- Product type config for customization fields ---
    const CUSTOM_FIELDS = {
        'default': [
            { key: 'notas', label: '📝 Notas o descripción', type: 'textarea', placeholder: 'Describe cómo quieres tu producto, texto que deseas, colores, fechas, etc, además de agregar archivos.' }
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
    }

    // --- STEP 3: Order summary ---
    function renderOrderSummary() {
        const summary = document.getElementById('orderSummary');
        const total = Carrito.getTotal();
        summary.innerHTML = items.map(item =>
            `<div class="kpi"><span class="kpi-label">${item.nombre} ×${item.cantidad}</span><span class="kpi-val">$${(item.precio * item.cantidad).toFixed(2)}</span></div>`
        ).join('');
        document.getElementById('orderTotal').textContent = `$${total.toFixed(2)}`;
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
        const total = Carrito.getTotal();

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

        if (selectedMethod === 'whatsapp') {
            // Open WhatsApp directly
            window.open(`https://wa.me/593997078212?text=${encodeURIComponent(waText)}`, '_blank');
            showConfirmation('Tu pedido fue enviado por WhatsApp. Un asesor te responderá pronto.');
            return;
        }

        // Try to save to database
        try {
            const isLoggedIn = typeof Auth !== 'undefined' && Auth.isLoggedIn();

            const orderData = {
                cliente_nombre: nombre,
                cliente_telefono: telefono,
                cliente_email: email,
                estado: selectedMethod === 'paypal' ? 'pendiente' : 'pendiente',
                metodo_pago: selectedMethod,
                subtotal: total,
                iva: 0,
                total: total,
                notas: notas
            };

            if (isLoggedIn) orderData.cliente_id = Auth.getUser().id;

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

            // Also send to WhatsApp for notification
            window.open(`https://wa.me/593997078212?text=${encodeURIComponent(waText)}`, '_blank');

            showConfirmation(`Orden #${order.id.substring(0, 8)} registrada. Se envió el resumen a WhatsApp.`);

        } catch (err) {
            console.error('Error saving order:', err);
            // Fallback: send to WhatsApp
            window.open(`https://wa.me/593997078212?text=${encodeURIComponent(waText)}`, '_blank');
            showConfirmation('Tu pedido fue enviado por WhatsApp (no se pudo guardar en la base de datos).');
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

    // --- Wire up buttons ---
    document.getElementById('btnToStep2')?.addEventListener('click', () => {
        collectCustomizations();
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = '';
        updateSteps(2);
        fillUserData();
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
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = '';
        updateSteps(3);
        renderOrderSummary();
        setupPaymentMethods();
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
