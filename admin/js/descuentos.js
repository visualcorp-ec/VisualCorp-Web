// ============================================
// descuentos.js — Admin CRUD for Discount Codes
// ============================================

(function () {
    const body = document.getElementById('discountsBody');
    const btnAdd = document.getElementById('btnAddDiscount');
    const modal = document.getElementById('discountModal');
    const closeModal = document.getElementById('closeDiscountModal');
    const form = document.getElementById('discountForm');
    const modalTitle = document.getElementById('discountModalTitle');

    if (!body || !form) return;

    async function loadDiscounts() {
        body.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando...</td></tr>';

        const { data, error } = await supabaseClient
            .from('descuentos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !data) {
            body.innerHTML = '<tr><td colspan="7" style="text-align:center;">Error cargando descuentos</td></tr>';
            return;
        }

        if (data.length === 0) {
            body.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--color-text-dim);">No hay descuentos. ¡Crea uno!</td></tr>';
            return;
        }

        body.innerHTML = data.map(d => {
            const val = d.tipo === 'porcentaje' ? `${d.valor}%` : `$${Number(d.valor).toFixed(2)}`;
            const usos = d.usos_maximos ? `${d.usos_actuales || 0}/${d.usos_maximos}` : `${d.usos_actuales || 0}/∞`;
            const vigencia = d.fecha_fin
                ? `${new Date(d.fecha_inicio).toLocaleDateString('es-EC')} → ${new Date(d.fecha_fin).toLocaleDateString('es-EC')}`
                : `Desde ${new Date(d.fecha_inicio).toLocaleDateString('es-EC')}`;
            const badge = d.activo
                ? '<span class="status-badge status-badge--done">Activo</span>'
                : '<span class="status-badge status-badge--pending">Inactivo</span>';

            return `<tr>
                <td style="font-weight:700; font-family:monospace; color:var(--color-accent);">${d.codigo}</td>
                <td>${d.tipo === 'porcentaje' ? '% Porcentaje' : '$ Fijo'}</td>
                <td style="font-weight:700;">${val}</td>
                <td>${usos}</td>
                <td style="font-size:var(--fs-xs);">${vigencia}</td>
                <td>${badge}</td>
                <td>
                    <div style="display:flex; gap:var(--sp-2); flex-wrap:wrap;">
                        <button class="btn btn--secondary" style="font-size:.7rem;padding:4px 10px;" onclick="AdminDescuentos.edit('${d.id}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn--secondary" style="font-size:.7rem;padding:4px 10px; color:${d.activo ? '#ef4444' : '#22c55e'};" onclick="AdminDescuentos.toggle('${d.id}', ${d.activo})">
                            <i class="fa-solid fa-${d.activo ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button class="btn btn--secondary" style="font-size:.7rem;padding:4px 10px; color:#ef4444;" onclick="AdminDescuentos.remove('${d.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    btnAdd.addEventListener('click', () => {
        form.reset();
        document.getElementById('discId').value = '';
        document.getElementById('discError').style.display = 'none';
        document.getElementById('discSuccess').style.display = 'none';
        modalTitle.textContent = 'Nuevo Descuento';
        modal.style.display = '';
    });

    closeModal.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('discError');
        const sucEl = document.getElementById('discSuccess');
        errEl.style.display = 'none';
        sucEl.style.display = 'none';

        const id = document.getElementById('discId').value;
        const discData = {
            codigo: document.getElementById('discCodigo').value.trim().toUpperCase(),
            tipo: document.getElementById('discTipo').value,
            valor: parseFloat(document.getElementById('discValor').value),
            fecha_inicio: document.getElementById('discInicio').value || new Date().toISOString(),
            fecha_fin: document.getElementById('discFin').value || null,
            usos_maximos: document.getElementById('discMaxUsos').value ? parseInt(document.getElementById('discMaxUsos').value) : null
        };

        try {
            if (id) {
                const { error } = await supabaseClient.from('descuentos').update(discData).eq('id', id);
                if (error) throw error;
                sucEl.textContent = '✅ Descuento actualizado.';
            } else {
                discData.activo = true;
                const { error } = await supabaseClient.from('descuentos').insert(discData);
                if (error) throw error;
                sucEl.textContent = '✅ Descuento creado.';
            }
            sucEl.style.display = 'block';
            loadDiscounts();
            setTimeout(() => { modal.style.display = 'none'; }, 1500);
        } catch (err) {
            errEl.textContent = err.message || 'Error al guardar.';
            errEl.style.display = 'block';
        }
    });

    async function editDiscount(id) {
        const { data } = await supabaseClient.from('descuentos').select('*').eq('id', id).single();
        if (!data) return;
        document.getElementById('discId').value = data.id;
        document.getElementById('discCodigo').value = data.codigo;
        document.getElementById('discTipo').value = data.tipo;
        document.getElementById('discValor').value = data.valor;
        document.getElementById('discInicio').value = data.fecha_inicio ? data.fecha_inicio.split('T')[0] : '';
        document.getElementById('discFin').value = data.fecha_fin ? data.fecha_fin.split('T')[0] : '';
        document.getElementById('discMaxUsos').value = data.usos_maximos || '';
        document.getElementById('discError').style.display = 'none';
        document.getElementById('discSuccess').style.display = 'none';
        modalTitle.textContent = 'Editar Descuento';
        modal.style.display = '';
    }

    async function toggleDiscount(id, active) {
        if (!confirm(`¿${active ? 'Desactivar' : 'Activar'} este descuento?`)) return;
        await supabaseClient.from('descuentos').update({ activo: !active }).eq('id', id);
        loadDiscounts();
    }

    async function removeDiscount(id) {
        if (!confirm('¿Eliminar este descuento permanentemente?')) return;
        await supabaseClient.from('descuentos').delete().eq('id', id);
        loadDiscounts();
    }

    window.AdminDescuentos = { edit: editDiscount, toggle: toggleDiscount, remove: removeDiscount, load: loadDiscounts };

    const tab = document.getElementById('tabDiscounts');
    if (tab) {
        let loaded = false;
        tab.addEventListener('click', () => { if (!loaded) { loadDiscounts(); loaded = true; } });
    }
})();
