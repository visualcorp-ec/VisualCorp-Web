// ============================================
// mis_pedidos.js — Client order tracking view
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ensure user is logged in
    const user = await Auth.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html?redirect=mis_pedidos.html';
        return;
    }

    const ordersList = document.getElementById('ordersList');

    // 2. Fetch orders for this customer
    const { data: orders, error } = await supabaseClient
        .from('ordenes')
        .select(`
            id,
            created_at,
            estado,
            total,
            tiempo_estimado,
            orden_items (
                nombre_producto,
                cantidad
            )
        `)
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        ordersList.innerHTML = `<div class="error-msg">❌ Error al cargar los pedidos. Intenta nuevamente más tarde.</div>`;
        return;
    }

    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div style="text-align:center; padding:var(--sp-8); color:var(--color-text-dim);">
                <i class="fa-solid fa-box-open fa-4x" style="margin-bottom:var(--sp-4); opacity:0.5;"></i>
                <p>Aún no has realizado ningún pedido.</p>
                <a href="tienda.html" class="btn btn--primary" style="margin-top:var(--sp-4);">Ir a la Tienda</a>
            </div>
        `;
        return;
    }

    // 3. Render Orders
    let html = '';
    orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('es-EC', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Mapping states to timeline steps
        const states = [
            'pendiente', // 0
            'asesoria', // 1
            'aceptado', // 2
            'diseno', // 3
            'confirmacion_diseno', // 4
            'produccion', // 5
            'envio', // 6
            'entregado' // 7
        ];

        const stateLabels = [
            'Pendiente',
            'En Asesoría',
            'Aceptado',
            'En Diseño',
            'Conf. Diseño',
            'Producción',
            'Envío',
            'Entregado'
        ];

        let currentStateIdx = states.indexOf(order.estado);
        if (currentStateIdx === -1) currentStateIdx = 0; // fallback

        // Build items summary
        const itemsSummary = order.orden_items.map(item => `${item.cantidad}x ${item.nombre_producto}`).join(', ');

        const eta = order.tiempo_estimado ? `<span style="color:var(--color-accent); font-weight:bold;">⏱️ Tiempo aprox: ${order.tiempo_estimado} días hábiles</span>` : '<span style="color:var(--color-text-dim);">⏱️ Calculando tiempo de entrega...</span>';

        html += `
            <div class="order-card" style="background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:var(--sp-6); margin-bottom:var(--sp-6);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--sp-4); flex-wrap:wrap; gap:var(--sp-4);">
                    <div>
                        <h3 style="margin:0 0 var(--sp-1) 0; font-size:var(--fs-lg);">Pedido #${order.id.split('-')[0].toUpperCase()}</h3>
                        <p style="margin:0; color:var(--color-text-dim); font-size:var(--fs-xs);">${date}</p>
                        <p style="margin:var(--sp-2) 0 0 0; font-size:var(--fs-sm);">${itemsSummary}</p>
                    </div>
                    <div style="text-align:right;">
                        <h3 style="margin:0 0 var(--sp-1) 0; color:var(--color-accent);">$${order.total.toFixed(2)}</h3>
                        ${eta}
                    </div>
                </div>

                <!-- Timeline -->
                <div class="tracking-timeline">
                    ${states.map((st, i) => {
            const isCompleted = i <= currentStateIdx;
            const isCurrent = i === currentStateIdx;
            return `
                            <div class="tracking-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}">
                                <div class="step-icon">
                                    ${isCompleted ? '<i class="fa-solid fa-check"></i>' : (i + 1)}
                                </div>
                                <div class="step-label">${stateLabels[i]}</div>
                                ${i < states.length - 1 ? '<div class="step-line"></div>' : ''}
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    });

    ordersList.innerHTML = html;
});
