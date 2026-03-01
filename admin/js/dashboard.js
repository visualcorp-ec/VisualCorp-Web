// ============================================
// dashboard.js — Admin Dashboard Statistics
// ============================================

(function () {
    async function loadDashboard() {
        try {
            // 1. Fetch all orders
            const { data: orders } = await supabaseClient
                .from('ordenes')
                .select('id, total, estado, orden_items(nombre_producto, cantidad)');

            // 2. Fetch profiles count
            const { count: clientCount } = await supabaseClient
                .from('perfiles')
                .select('id', { count: 'exact', head: true })
                .eq('rol', 'cliente');

            // 3. Fetch active products count
            const { count: productCount } = await supabaseClient
                .from('productos')
                .select('id', { count: 'exact', head: true })
                .eq('activo', true);

            if (!orders) return;

            // --- Calculate metrics ---
            const totalVentas = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            const totalPedidos = orders.length;
            const pendientes = orders.filter(o => !['entregado', 'cancelado'].includes(o.estado)).length;
            const entregados = orders.filter(o => o.estado === 'entregado').length;

            // Top product
            const productSales = {};
            orders.forEach(o => {
                if (o.orden_items && Array.isArray(o.orden_items)) {
                    o.orden_items.forEach(item => {
                        const name = item.nombre_producto || 'Desconocido';
                        productSales[name] = (productSales[name] || 0) + (item.cantidad || 1);
                    });
                }
            });

            let topProductName = '—';
            let topProductQty = 0;
            Object.keys(productSales).forEach(name => {
                if (productSales[name] > topProductQty) {
                    topProductQty = productSales[name];
                    topProductName = name;
                }
            });

            // --- Render metrics ---
            document.getElementById('statVentas').textContent = `$${totalVentas.toFixed(2)}`;
            document.getElementById('statPedidos').textContent = totalPedidos;
            document.getElementById('statPendientes').textContent = pendientes;
            document.getElementById('statEntregados').textContent = entregados;
            document.getElementById('statClientes').textContent = clientCount || 0;
            document.getElementById('statProductos').textContent = productCount || 0;
            document.getElementById('statTopProducto').textContent = topProductQty > 0
                ? `${topProductName} (${topProductQty} uds)`
                : 'Sin datos aún';

        } catch (err) {
            console.error('Dashboard error:', err);
        }
    }

    // Auto-load dashboard on page load
    document.addEventListener('DOMContentLoaded', () => {
        // Delay slightly to ensure auth is ready
        setTimeout(loadDashboard, 500);
    });
})();
