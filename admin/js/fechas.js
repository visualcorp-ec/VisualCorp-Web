// ============================================
// fechas.js — Admin CRUD for Festive Dates
// ============================================

(function () {
    const list = document.getElementById('datesList');
    const btnAdd = document.getElementById('btnAddDate');
    const modal = document.getElementById('dateModal');
    const closeM = document.getElementById('closeDateModal');
    const form = document.getElementById('dateForm');
    const title = document.getElementById('dateModalTitle');

    if (!list || !form) return;

    async function loadDates() {
        list.innerHTML = '<p style="text-align:center; color:var(--color-text-dim);">Cargando fechas...</p>';

        const { data, error } = await supabaseClient
            .from('fechas_festivas')
            .select('*, descuentos(codigo, tipo, valor)')
            .order('fecha_inicio', { ascending: true });

        if (error || !data) { list.innerHTML = '<p style="color:#ef4444;">Error cargando fechas</p>'; return; }

        if (data.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:var(--color-text-dim);">No hay fechas registradas. ¡Agrega una!</p>';
            return;
        }

        const now = new Date();
        list.innerHTML = data.map(d => {
            const start = new Date(d.fecha_inicio);
            const end = new Date(d.fecha_fin);
            const isActive = now >= start && now <= end;
            const isPast = now > end;
            const statusBadge = isActive
                ? '<span class="status-badge status-badge--done">🟢 Activa</span>'
                : isPast
                    ? '<span class="status-badge status-badge--pending">Pasada</span>'
                    : '<span class="status-badge" style="background:var(--color-bg);">📅 Próxima</span>';

            const discount = d.descuentos
                ? `<div style="margin-top:var(--sp-2); font-size:var(--fs-xs); color:var(--color-accent);">🏷️ ${d.descuentos.codigo}: ${d.descuentos.tipo === 'porcentaje' ? d.descuentos.valor + '%' : '$' + d.descuentos.valor}</div>`
                : '';

            return `<div style="background:var(--color-bg-alt); border:2px solid ${d.color}40; border-radius:var(--radius-lg); overflow:hidden;">
                <div style="height:8px; background:${d.color};"></div>
                <div style="padding:var(--sp-4);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-2);">
                        <h4 style="margin:0; color:${d.color};">${d.nombre}</h4>
                        ${statusBadge}
                    </div>
                    <p style="margin:0; font-size:var(--fs-xs); color:var(--color-text-dim);">${start.toLocaleDateString('es-EC')} → ${end.toLocaleDateString('es-EC')}</p>
                    ${discount}
                    <div style="margin-top:var(--sp-3); display:flex; gap:var(--sp-2);">
                        <button class="btn btn--secondary" style="font-size:.7rem; padding:4px 10px;" onclick="AdminDates.edit('${d.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn--secondary" style="font-size:.7rem; padding:4px 10px; color:#ef4444;" onclick="AdminDates.remove('${d.id}')"><i class="fa-solid fa-trash"></i></button>
                        <button class="btn btn--secondary" style="font-size:.7rem; padding:4px 10px; color:${d.activo ? '#ef4444' : '#22c55e'};" onclick="AdminDates.toggle('${d.id}', ${d.activo})" title="${d.activo ? 'Desactivar' : 'Activar'}"><i class="fa-solid fa-${d.activo ? 'eye-slash' : 'eye'}"></i></button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    async function loadDiscountsForSelect() {
        const sel = document.getElementById('dateDescuento');
        if (!sel) return;
        sel.innerHTML = '<option value="">— Ninguno —</option>';
        const { data } = await supabaseClient.from('descuentos').select('id, codigo, tipo, valor').eq('activo', true);
        if (data) {
            data.forEach(d => {
                const label = `${d.codigo} (${d.tipo === 'porcentaje' ? d.valor + '%' : '$' + d.valor})`;
                sel.innerHTML += `<option value="${d.id}">${label}</option>`;
            });
        }
    }

    btnAdd.addEventListener('click', () => {
        form.reset();
        document.getElementById('dateId').value = '';
        document.getElementById('dateColor').value = '#f2b705';
        document.getElementById('dateError').style.display = 'none';
        document.getElementById('dateSuccess').style.display = 'none';
        title.textContent = 'Nueva Fecha Festiva';
        loadDiscountsForSelect();
        modal.style.display = '';
    });

    closeM.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('dateError');
        const suc = document.getElementById('dateSuccess');
        err.style.display = 'none'; suc.style.display = 'none';

        const id = document.getElementById('dateId').value;
        const dateData = {
            nombre: document.getElementById('dateNombre').value.trim(),
            fecha_inicio: document.getElementById('dateFechaInicio').value,
            fecha_fin: document.getElementById('dateFechaFin').value,
            color: document.getElementById('dateColor').value,
            descuento_id: document.getElementById('dateDescuento').value || null
        };

        try {
            if (id) {
                const { error: e2 } = await supabaseClient.from('fechas_festivas').update(dateData).eq('id', id);
                if (e2) throw e2;
                suc.textContent = '✅ Fecha actualizada.';
            } else {
                dateData.activo = true;
                const { error: e2 } = await supabaseClient.from('fechas_festivas').insert(dateData);
                if (e2) throw e2;
                suc.textContent = '✅ Fecha creada.';
            }
            suc.style.display = 'block';
            loadDates();
            setTimeout(() => modal.style.display = 'none', 1500);
        } catch (e2) {
            err.textContent = e2.message || 'Error al guardar.';
            err.style.display = 'block';
        }
    });

    async function editDate(id) {
        const { data } = await supabaseClient.from('fechas_festivas').select('*').eq('id', id).single();
        if (!data) return;
        await loadDiscountsForSelect();
        document.getElementById('dateId').value = data.id;
        document.getElementById('dateNombre').value = data.nombre;
        document.getElementById('dateFechaInicio').value = data.fecha_inicio;
        document.getElementById('dateFechaFin').value = data.fecha_fin;
        document.getElementById('dateColor').value = data.color;
        document.getElementById('dateDescuento').value = data.descuento_id || '';
        document.getElementById('dateError').style.display = 'none';
        document.getElementById('dateSuccess').style.display = 'none';
        title.textContent = 'Editar Fecha Festiva';
        modal.style.display = '';
    }

    async function toggleDate(id, active) {
        if (!confirm(`¿${active ? 'Desactivar' : 'Activar'} esta fecha?`)) return;
        await supabaseClient.from('fechas_festivas').update({ activo: !active }).eq('id', id);
        loadDates();
    }

    async function removeDate(id) {
        if (!confirm('¿Eliminar esta fecha festiva?')) return;
        await supabaseClient.from('fechas_festivas').delete().eq('id', id);
        loadDates();
    }

    window.AdminDates = { edit: editDate, toggle: toggleDate, remove: removeDate, load: loadDates };

    const tab = document.getElementById('tabDates');
    if (tab) { let loaded = false; tab.addEventListener('click', () => { if (!loaded) { loadDates(); loaded = true; } }); }
})();
