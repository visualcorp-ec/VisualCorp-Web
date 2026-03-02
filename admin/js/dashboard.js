// ============================================
// dashboard.js — Admin Dashboard with CRM Analytics
// ============================================

(function () {
    async function loadDashboard() {
        try {
            // 1. Fetch all orders with advisor info
            const { data: orders } = await supabaseClient
                .from('ordenes')
                .select('id, total, estado, asesor_id, created_at, fecha_entrega_real, tiempo_estimado, orden_items(nombre_producto, cantidad)');

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

            // 4. Fetch advisors
            const { data: advisors } = await supabaseClient
                .from('perfiles')
                .select('id, nombre, whatsapp, foto_url')
                .in('rol', ['empleado', 'admin'])
                .not('whatsapp', 'is', null);

            if (!orders) return;

            // --- Calculate metrics ---
            const totalVentas = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            const totalPedidos = orders.length;
            const pendientes = orders.filter(o => !['entregado', 'cancelado'].includes(o.estado)).length;
            const entregados = orders.filter(o => o.estado === 'entregado').length;

            // Top products
            const productSales = {};
            orders.forEach(o => {
                if (o.orden_items && Array.isArray(o.orden_items)) {
                    o.orden_items.forEach(item => {
                        const name = item.nombre_producto || 'Desconocido';
                        productSales[name] = (productSales[name] || 0) + (item.cantidad || 1);
                    });
                }
            });

            const topProducts = Object.entries(productSales)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            let topProductName = '—';
            let topProductQty = 0;
            if (topProducts.length > 0) {
                topProductName = topProducts[0][0];
                topProductQty = topProducts[0][1];
            }

            // --- Generate Data for Charts ---
            const dailySales = {};
            orders.forEach(o => {
                if (o.estado !== 'cancelado') {
                    const dateStr = new Date(o.created_at).toLocaleDateString('es-EC');
                    dailySales[dateStr] = (dailySales[dateStr] || 0) + (Number(o.total) || 0);
                }
            });

            // Sort dates chronologically
            const sortedDates = Object.keys(dailySales).sort((a, b) => {
                const [d1, m1, y1] = a.split('/');
                const [d2, m2, y2] = b.split('/');
                return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`);
            });

            const salesLabels = sortedDates.slice(-10); // Last 10 days
            const salesData = salesLabels.map(d => dailySales[d]);

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

            // --- Top 5 Products Chart ---
            const topEl = document.getElementById('topProductsList');
            if (topEl) {
                if (topProducts.length === 0) {
                    topEl.innerHTML = '<p style="color:var(--color-text-dim); text-align:center;">Sin datos de ventas aún.</p>';
                } else {
                    const maxQty = topProducts[0][1];
                    topEl.innerHTML = topProducts.map(([name, qty], i) => {
                        const pct = Math.round((qty / maxQty) * 100);
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                        return `<div style="margin-bottom:var(--sp-3);">
                            <div style="display:flex; justify-content:space-between; font-size:var(--fs-sm); margin-bottom:2px;">
                                <span>${medal} ${name}</span><span style="color:var(--color-accent); font-weight:700;">${qty} uds</span>
                            </div>
                            <div style="height:8px; background:var(--color-bg-alt); border-radius:4px; overflow:hidden;">
                                <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, var(--color-accent), #f59e0b); border-radius:4px; transition:width .5s;"></div>
                            </div>
                        </div>`;
                    }).join('');
                }
            }

            // --- Render Charts (Chart.js) ---
            const ctxVentas = document.getElementById('ventasChart');
            if (ctxVentas && window.Chart) {
                new Chart(ctxVentas, {
                    type: 'line',
                    data: {
                        labels: salesLabels.length > 0 ? salesLabels : ['Sin datos'],
                        datasets: [{
                            label: 'Ingresos Diarios ($)',
                            data: salesData.length > 0 ? salesData : [0],
                            borderColor: '#f2b705',
                            backgroundColor: 'rgba(242, 183, 5, 0.2)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                ticks: { color: '#8b9bb4' }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#8b9bb4' }
                            }
                        }
                    }
                });
            }

            const ctxTop = document.getElementById('topProductosChart');
            if (ctxTop && window.Chart) {
                new Chart(ctxTop, {
                    type: 'doughnut',
                    data: {
                        labels: topProducts.length > 0 ? topProducts.map(p => p[0]) : ['Sin datos'],
                        datasets: [{
                            data: topProducts.length > 0 ? topProducts.map(p => p[1]) : [1],
                            backgroundColor: ['#f2b705', '#f59e0b', '#06b6d4', '#ef4444', '#22c55e'],
                            borderWidth: 0,
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { color: '#8b9bb4', font: { size: 12 } }
                            }
                        },
                        cutout: '70%'
                    }
                });
            }

            // --- Export Logic ---
            const btnExport = document.getElementById('btnExportStats');
            if (btnExport) {
                btnExport.addEventListener('click', () => {
                    alert('Imprimiendo Reporte de Ventas. Puedes guardarlo como PDF desde la ventana de impresión.');
                    window.print();
                });
            }

            // --- Advisor Performance ---
            const advisorEl = document.getElementById('advisorPerformance');
            if (advisorEl && advisors && advisors.length > 0) {
                const advisorStats = advisors.map(adv => {
                    const advOrders = orders.filter(o => o.asesor_id === adv.id);
                    const total = advOrders.length;
                    const completed = advOrders.filter(o => o.estado === 'entregado').length;
                    const active = advOrders.filter(o => !['entregado', 'cancelado'].includes(o.estado)).length;
                    const onTime = advOrders.filter(o => o.estado === 'entregado' && o.fecha_entrega_real).length;
                    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return { ...adv, total, completed, active, onTime, completionRate };
                }).sort((a, b) => b.completed - a.completed);

                advisorEl.innerHTML = advisorStats.map((a, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                    const initial = (a.nombre || '?').charAt(0).toUpperCase();
                    const stars = '⭐'.repeat(Math.min(5, Math.ceil(a.completionRate / 20)));

                    return `<div style="background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-lg); padding:var(--sp-4); text-align:center;">
                        <div style="font-size:1.5rem; margin-bottom:var(--sp-1);">${medal}</div>
                        <div style="width:50px;height:50px;border-radius:50%;background:var(--color-accent);display:flex;align-items:center;justify-content:center;font-weight:800;color:#111;font-size:1.2rem;margin:0 auto var(--sp-2);">${initial}</div>
                        <div style="font-weight:700; color:var(--color-heading);">${a.nombre}</div>
                        <div style="font-size:var(--fs-xs); color:var(--color-text-dim); margin-bottom:var(--sp-2);">${stars}</div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-2); font-size:var(--fs-xs);">
                            <div><span style="font-weight:700; color:var(--color-heading);">${a.total}</span><br>Total</div>
                            <div><span style="font-weight:700; color:#22c55e;">${a.completed}</span><br>Entregados</div>
                            <div><span style="font-weight:700; color:#f59e0b;">${a.active}</span><br>Activos</div>
                            <div><span style="font-weight:700; color:var(--color-accent);">${a.completionRate}%</span><br>Cumplimiento</div>
                        </div>
                    </div>`;
                }).join('');
            }

        } catch (err) {
            console.error('Dashboard error:', err);
        }
    }

    // Auto-load dashboard on page load
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(loadDashboard, 500);
    });
})();
