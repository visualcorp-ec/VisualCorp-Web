// ============================================
// carrito.js — Sistema de carrito (localStorage)
// ============================================

const Carrito = (function () {
    const KEY = 'visualcorp_carrito';

    function getItems() {
        try {
            return JSON.parse(localStorage.getItem(KEY)) || [];
        } catch { return []; }
    }

    function saveItems(items) {
        localStorage.setItem(KEY, JSON.stringify(items));
        updateBadge();
    }

    function addItem(producto) {
        const items = getItems();
        const cart_id = producto.id + (producto.variantes && producto.variantes.seleccion ? '-' + producto.variantes.seleccion : '');

        const existing = items.find(i => i.cart_id === cart_id);
        if (existing) {
            existing.cantidad += (producto.cantidad || 1);
            recalculatePrice(existing);
        } else {
            items.push({
                cart_id: cart_id,
                id: producto.id,
                nombre: producto.nombre,
                codigo: producto.codigo || '',
                precio: producto.precio || 0,
                cantidad: producto.cantidad || 1,
                imagen: producto.imagen || '',
                subcategoria: producto.subcategoria || '',
                escalas_precios: producto.escalas_precios || [],
                variantes: producto.variantes || null,
                control_stock: producto.control_stock || false,
                stock: producto.stock || 0
            });
            const newItem = items[items.length - 1];
            recalculatePrice(newItem);
        }
        saveItems(items);
        showToast(`✅ ${producto.nombre} agregado al carrito`);
    }

    function removeItem(cart_id) {
        const items = getItems().filter(i => i.cart_id !== cart_id);
        saveItems(items);
    }

    function updateQuantity(cart_id, qty) {
        const items = getItems();
        const item = items.find(i => i.cart_id === cart_id);
        if (item) {
            if (item.control_stock && qty > item.stock) qty = item.stock;
            item.cantidad = Math.max(1, qty);
            recalculatePrice(item);
            saveItems(items);
        }
    }

    function clear() {
        localStorage.removeItem(KEY);
        updateBadge();
    }

    // Dynamic Pricing Logic Based on Scales
    function recalculatePrice(item) {
        if (!item.escalas_precios || !Array.isArray(item.escalas_precios) || item.escalas_precios.length === 0) return;

        // Ensure sorted by quantity ascending and parse numbers safely
        const prices = [...item.escalas_precios].map(p => ({
            qty: Number(p.qty),
            pvp: Number(p.pvp)
        })).sort((a, b) => a.qty - b.qty);

        let finalPvp = prices[0].pvp;
        const qtyToCompare = Number(item.cantidad);

        for (let i = prices.length - 1; i >= 0; i--) {
            if (qtyToCompare >= prices[i].qty) {
                finalPvp = prices[i].pvp;
                break;
            }
        }
        item.precio = finalPvp;
    }

    function getTotal() {
        return getItems().reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
    }

    function getCount() {
        return getItems().reduce((sum, i) => sum + i.cantidad, 0);
    }

    function updateBadge() {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            const count = getCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    function showToast(message) {
        let toast = document.getElementById('vc-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'vc-toast';
            toast.style.cssText = `
        position:fixed; bottom:24px; right:24px; z-index:9999;
        background:#1a2035; color:#f4f6fb; border:1px solid rgba(242,183,5,.4);
        border-radius:14px; padding:14px 22px; font-family:Inter,system-ui,sans-serif;
        font-size:.9rem; font-weight:600; box-shadow:0 8px 30px rgba(0,0,0,.5);
        transform:translateY(100px); opacity:0;
        transition: transform .3s cubic-bezier(.22,1,.36,1), opacity .3s;
      `;
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });
        setTimeout(() => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
        }, 2500);
    }

    // Init badge on load
    document.addEventListener('DOMContentLoaded', updateBadge);

    return { getItems, addItem, removeItem, updateQuantity, clear, getTotal, getCount, updateBadge };
})();
