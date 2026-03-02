/**
 * VisualCorp CRM Logic
 * Handles the Kanban board for orders, Drag & Drop mechanics, and data sync with Supabase.
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (!supabaseClient) {
        console.error('Supabase client not initialized.');
        return;
    }

    // Elements
    const cols = {
        asesoria: document.getElementById('col-asesoria'),
        diseno: document.getElementById('col-diseno'),
        produccion: document.getElementById('col-produccion'),
        entregado: document.getElementById('col-entregado')
    };

    const counts = {
        asesoria: document.getElementById('count-asesoria'),
        diseno: document.getElementById('count-diseno'),
        produccion: document.getElementById('count-produccion'),
        entregado: document.getElementById('count-entregado')
    };

    let allOrders = [];

    // Initialize Kanban Setup
    async function loadBoard() {
        showLoading();

        // Fetch valid active orders and join with their profiles (clients)
        const { data: orders, error } = await supabaseClient
            .from('ordenes')
            .select(`
                id, total, estado, created_at, etapa, prioridad, fecha_entrega,
                perfiles (nombre, whatsapp)
            `)
            .neq('estado', 'cancelado')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching CRM orders:', error);
            alert('Error al cargar datos del CRM.');
            return;
        }

        allOrders = orders;
        renderBoard(allOrders);
        initDragula();
    }

    function renderBoard(ordersList) {
        // Clear all columns
        Object.values(cols).forEach(col => col.innerHTML = '');
        let stageCounts = { asesoria: 0, diseno: 0, produccion: 0, entregado: 0 };

        ordersList.forEach(order => {
            // Default stage logic to bridge old orders
            let stage = order.etapa || 'asesoria';
            // Fallbacks for older data without etapa column yet
            if (!order.etapa) {
                if (['asesoria', 'pendiente', 'aceptado'].includes(order.estado)) stage = 'asesoria';
                else if (['diseno', 'confirmacion_diseno'].includes(order.estado)) stage = 'diseno';
                else if (order.estado === 'produccion' || order.estado === 'envio') stage = 'produccion';
                else if (order.estado === 'entregado') stage = 'entregado';
            }

            if (!cols[stage]) stage = 'asesoria'; // sanity check

            stageCounts[stage]++;

            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.dataset.orderId = order.id;

            // Format Priority Tag
            let priorityBadge = '';
            if (order.prioridad === 'alta') priorityBadge = '<span class="tag tag--alta">Urgent</span>';
            else if (order.prioridad === 'media') priorityBadge = '<span class="tag tag--media">Normal</span>';
            else if (order.prioridad === 'baja') priorityBadge = '<span class="tag tag--baja">Baja</span>';
            else priorityBadge = '<span class="tag tag--media">Normal</span>';

            const clientName = order.perfiles ? order.perfiles.nombre : 'Cliente Desconocido';
            const totalFmt = order.total ? `$${Number(order.total).toFixed(2)}` : '$0.00';
            const dateStr = new Date(order.created_at).toLocaleDateString();

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">Pedido #${order.id.slice(0, 5)}</h3>
                    <div class="card-price">${totalFmt}</div>
                </div>
                <div class="card-client">
                    <i class="fa-solid fa-user" style="opacity:0.7"></i> ${clientName}
                </div>
                <div class="card-footer">
                    <div>${priorityBadge}</div>
                    <div style="color:var(--color-text-dim);"><i class="fa-regular fa-clock"></i> ${dateStr}</div>
                </div>
            `;

            card.addEventListener('click', () => {
                // Future expansion: Edit priority, see items, send invoice PDF...
                console.log('Clicked Order: ', order.id);
            });

            cols[stage].appendChild(card);
        });

        // Update counts
        Object.keys(counts).forEach(key => {
            counts[key].textContent = stageCounts[key] || 0;
        });
    }

    function initDragula() {
        const drake = dragula([cols.asesoria, cols.diseno, cols.produccion, cols.entregado]);

        drake.on('drop', async (el, target, source) => {
            if (target === source) return; // Didn't actually move columns

            const orderId = el.dataset.orderId;
            const newStage = target.parentElement.dataset.stage; // Get the parent .kanban-col dataset

            console.log(`Moved order ${orderId} to ${newStage}`);

            // Attempt update to Supabase
            const { error } = await supabaseClient
                .from('ordenes')
                .update({ etapa: newStage })
                .eq('id', orderId);

            if (error) {
                console.error("Error updating stage:", error);
                drake.cancel(true); // Revert to original slot if fail
                alert("No se pudo actualizar la etapa de la orden en la base de datos.");
            } else {
                // Update specific counts locally
                const oldStage = source.parentElement.dataset.stage;
                counts[oldStage].textContent = parseInt(counts[oldStage].textContent) - 1;
                counts[newStage].textContent = parseInt(counts[newStage].textContent) + 1;
            }
        });
    }

    function showLoading() {
        cols.asesoria.innerHTML = '<div style="color:#fff; text-align:center; padding: 20px;">Cargando CRM...</div>';
    }

    // Basic local filter setup
    document.getElementById('crmSearch')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allOrders.filter(o => {
            const clientMatch = o.perfiles && o.perfiles.nombre && o.perfiles.nombre.toLowerCase().includes(term);
            const idMatch = o.id.toLowerCase().includes(term);
            return clientMatch || idMatch;
        });
        renderBoard(filtered);
    });

    document.getElementById('btnNewOrder')?.addEventListener('click', () => {
        window.location.href = 'pos.html'; // Lead to POS
    });

    loadBoard();
});
