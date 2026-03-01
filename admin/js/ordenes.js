// ============================================
// ordenes.js — Admin Panel Order Management
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const ordersBody = document.getElementById('ordersBody');
    const filterOrderStatus = document.getElementById('filterOrderStatus');
    const orderModal = document.getElementById('orderModal');
    const closeOrderModal = document.getElementById('closeOrderModal');
    const modalOrderTitle = document.getElementById('modalOrderTitle');
    const modalOrderDetails = document.getElementById('modalOrderDetails');
    const updateOrderForm = document.getElementById('updateOrderForm');

    // Auth guard is handled by admin/index.html script.
    // We can just listen to the tab change to load orders if needed.
    const tabOrders = document.getElementById('tabOrders');
    if (tabOrders) {
        tabOrders.addEventListener('click', () => {
            loadOrders();
        });
    }

    // Filter change
    if (filterOrderStatus) {
        filterOrderStatus.addEventListener('change', () => {
            loadOrders(filterOrderStatus.value);
        });
    }

    // Modal Close
    if (closeOrderModal) {
        closeOrderModal.addEventListener('click', () => {
            orderModal.style.display = 'none';
        });
    }

    // Load Orders
    async function loadOrders(statusFilter = 'all') {
        if (!ordersBody) return;

        ordersBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando pedidos... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>';

        let query = supabaseClient
            .from('ordenes')
            .select(`
                id,
                created_at,
                cliente_nombre,
                cliente_email,
                cliente_telefono,
                total,
                estado,
                metodo_pago,
                tiempo_estimado,
                orden_items (
                    nombre_producto,
                    cantidad,
                    precio_unitario,
                    subtotal,
                    personalizacion,
                    archivos,
                    notas
                )
            `)
            .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
            query = query.eq('estado', statusFilter);
        }

        const { data: orders, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error.message);
            ordersBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">❌ Error al cargar pedidos.</td></tr>';
            return;
        }

        if (!orders || orders.length === 0) {
            ordersBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay pedidos registrados.</td></tr>';
            return;
        }

        const stateColors = {
            'pendiente': 'var(--color-text-dim)',
            'asesoria': '#3b82f6',
            'aceptado': '#06b6d4',
            'diseno': '#8b5cf6',
            'confirmacion_diseno': '#d946ef',
            'produccion': '#f59e0b',
            'envio': '#f97316',
            'entregado': '#22c55e'
        };

        const stateLabels = {
            'pendiente': 'Pendiente',
            'asesoria': 'En Asesoría',
            'aceptado': 'Aceptado',
            'diseno': 'En Diseño',
            'confirmacion_diseno': 'Conf. Diseño',
            'produccion': 'Producción',
            'envio': 'Envío',
            'entregado': 'Entregado'
        };

        ordersBody.innerHTML = orders.map(order => {
            const date = new Date(order.created_at).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const shortId = order.id.split('-')[0].toUpperCase();
            const color = stateColors[order.estado] || '#000';
            const label = stateLabels[order.estado] || order.estado;

            return `
                <tr>
                    <td style="font-weight:bold;">#${shortId}</td>
                    <td>
                        <div style="font-weight:600;">${order.cliente_nombre || 'Sin nombre'}</div>
                        <div style="font-size:0.8rem; color:var(--color-text-dim);">${order.cliente_telefono}</div>
                    </td>
                    <td>${date}</td>
                    <td style="font-weight:bold; color:var(--color-accent);">$${order.total.toFixed(2)}</td>
                    <td><span class="status-badge" style="background:${color}22; color:${color}; border:1px solid ${color}44;">${label}</span></td>
                    <td>
                        <button class="btn btn--secondary" style="font-size:0.8rem; padding:var(--sp-1) var(--sp-2);" onclick="adminOpenOrder('${order.id}')">
                            <i class="fa-solid fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Store globally for quick modal access
        window.adminCurrentOrders = orders;
    }

    // Expose open order function
    window.adminOpenOrder = function (orderId) {
        const order = window.adminCurrentOrders.find(o => o.id === orderId);
        if (!order) return;

        const shortId = order.id.split('-')[0].toUpperCase();
        modalOrderTitle.textContent = `Pedido #${shortId}`;

        // Populate Details
        let detailsHtml = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-4); margin-bottom:var(--sp-4);">
                <div style="background:var(--color-surface); padding:var(--sp-4); border-radius:var(--radius-md); border:1px solid var(--color-border);">
                    <h4 style="margin-top:0; color:var(--color-text-muted); font-size:var(--fs-xs); text-transform:uppercase;">Cliente</h4>
                    <p style="margin:0 0 4px 0;"><strong>${order.cliente_nombre || 'N/A'}</strong></p>
                    <p style="margin:0 0 4px 0;"><i class="fa-solid fa-envelope"></i> ${order.cliente_email || 'N/A'}</p>
                    <p style="margin:0;"><i class="fa-solid fa-phone"></i> ${order.cliente_telefono || 'N/A'}</p>
                </div>
                <div style="background:var(--color-surface); padding:var(--sp-4); border-radius:var(--radius-md); border:1px solid var(--color-border);">
                    <h4 style="margin-top:0; color:var(--color-text-muted); font-size:var(--fs-xs); text-transform:uppercase;">Pago</h4>
                    <p style="margin:0 0 4px 0;">Método: <strong>${order.metodo_pago.toUpperCase()}</strong></p>
                    <p style="margin:0 0 4px 0;">Total: <strong style="color:var(--color-accent);">$${order.total.toFixed(2)}</strong></p>
                </div>
            </div>
            
            <h4 style="margin-bottom:var(--sp-2);">Artículos (${order.orden_items.length})</h4>
            <div style="display:flex; flex-direction:column; gap:var(--sp-3);">
        `;

        order.orden_items.forEach(item => {
            let pData = '';
            if (item.personalizacion && Object.keys(item.personalizacion).length > 0) {
                pData = '<ul style="margin:var(--sp-1) 0 0 0; padding-left:1.5rem; font-size:var(--fs-sm); color:var(--color-text-dim);">';
                for (const [key, val] of Object.entries(item.personalizacion)) {
                    pData += `<li><strong>${key}:</strong> ${val}</li>`;
                }
                pData += '</ul>';
            }

            let archivosHtml = '';
            if (item.archivos && item.archivos.length > 0) {
                archivosHtml = `<div style="margin-top:var(--sp-2); display:flex; gap:var(--sp-2); flex-wrap:wrap;">`;
                item.archivos.forEach((url, i) => {
                    archivosHtml += `<a href="${url}" target="_blank" class="btn btn--secondary" style="font-size:0.7rem; padding:4px 8px;"><i class="fa-solid fa-paperclip"></i> Archivo ${i + 1}</a>`;
                });
                archivosHtml += `</div>`;
            }

            detailsHtml += `
                <div style="background:var(--color-surface); border:1px solid var(--color-border); padding:var(--sp-3); border-radius:var(--radius-md);">
                    <div style="display:flex; justify-content:space-between; font-weight:bold;">
                        <span>${item.cantidad}x ${item.nombre_producto}</span>
                        <span>$${item.subtotal.toFixed(2)}</span>
                    </div>
                    ${pData}
                    ${archivosHtml}
                </div>
            `;
        });

        detailsHtml += `</div>`;
        modalOrderDetails.innerHTML = detailsHtml;

        // Populate Form
        document.getElementById('updateOrderId').value = order.id;
        document.getElementById('updateOrderStatus').value = order.estado;
        document.getElementById('updateOrderEta').value = order.tiempo_estimado || '';

        document.getElementById('updateOrderSuccess').style.display = 'none';
        document.getElementById('updateOrderError').style.display = 'none';

        orderModal.style.display = 'flex';
    };

    // Update Form Submit
    if (updateOrderForm) {
        updateOrderForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = updateOrderForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = 'Guardando... <i class="fa-solid fa-spinner fa-spin"></i>';

            const errBox = document.getElementById('updateOrderError');
            const sucBox = document.getElementById('updateOrderSuccess');
            errBox.style.display = 'none';
            sucBox.style.display = 'none';

            const id = document.getElementById('updateOrderId').value;
            const estado = document.getElementById('updateOrderStatus').value;
            let tiempo = document.getElementById('updateOrderEta').value.trim();
            if (tiempo === '') tiempo = null; // Send null to DB if empty

            try {
                const { error } = await supabaseClient
                    .from('ordenes')
                    .update({
                        estado: estado,
                        tiempo_estimado: tiempo
                    })
                    .eq('id', id);

                if (error) throw error;

                sucBox.style.display = 'block';
                loadOrders(filterOrderStatus.value); // refresh table in bg

                // Hide success message after 3 seconds
                setTimeout(() => {
                    sucBox.style.display = 'none';
                }, 3000);

            } catch (e) {
                console.error(e);
                errBox.textContent = `Error: ${e.message}`;
                errBox.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Guardar Cambios';
            }
        });
    }
});
