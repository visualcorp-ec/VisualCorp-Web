// ============================================
// contenido.js — Admin CRUD for Carousel Slides
// ============================================

(function () {
    const list = document.getElementById('slidesList');
    const btnAdd = document.getElementById('btnAddSlide');
    const modal = document.getElementById('slideModal');
    const closeM = document.getElementById('closeSlideModal');
    const form = document.getElementById('slideForm');
    const title = document.getElementById('slideModalTitle');

    if (!list || !form) return;

    async function loadSlides() {
        list.innerHTML = '<p style="text-align:center; color:var(--color-text-dim);">Cargando slides...</p>';

        const { data, error } = await supabaseClient
            .from('carousel_slides')
            .select('*')
            .order('orden', { ascending: true });

        if (error || !data) { list.innerHTML = '<p style="color:#ef4444;">Error cargando slides</p>'; return; }

        if (data.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:var(--color-text-dim);">No hay slides. ¡Agrega uno!</p>';
            return;
        }

        list.innerHTML = data.map(s => `
            <div style="background:var(--color-bg-alt); border:1px solid var(--color-border); border-radius:var(--radius-lg); overflow:hidden;">
                <div style="height:150px; background:url('${s.imagen_url}') center/cover no-repeat; background-color:var(--color-surface);"></div>
                <div style="padding:var(--sp-4);">
                    <h4 style="margin:0 0 var(--sp-1) 0; color:var(--color-heading);">${s.titulo || '(Sin título)'}</h4>
                    <p style="margin:0; font-size:var(--fs-xs); color:var(--color-text-dim);">${s.subtitulo || ''}</p>
                    <div style="margin-top:var(--sp-3); display:flex; gap:var(--sp-2);">
                        <button class="btn btn--secondary" style="font-size:.7rem; padding:4px 10px;" onclick="AdminSlides.edit('${s.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn--secondary" style="font-size:.7rem; padding:4px 10px; color:#ef4444;" onclick="AdminSlides.remove('${s.id}')"><i class="fa-solid fa-trash"></i></button>
                        <span style="margin-left:auto; font-size:var(--fs-xs); color:var(--color-text-dim);">Orden: ${s.orden}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    btnAdd.addEventListener('click', () => {
        form.reset();
        document.getElementById('slideId').value = '';
        document.getElementById('slideImagenPreview').innerHTML = '';
        document.getElementById('slideError').style.display = 'none';
        document.getElementById('slideSuccess').style.display = 'none';
        title.textContent = 'Nuevo Slide';
        modal.style.display = '';
    });

    closeM.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('slideError');
        const suc = document.getElementById('slideSuccess');
        err.style.display = 'none'; suc.style.display = 'none';

        const id = document.getElementById('slideId').value;
        const fileInput = document.getElementById('slideImagen');

        let imagen_url = '';

        // Upload file if provided
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const ext = file.name.split('.').pop();
            const fileName = `slide_${Date.now()}.${ext}`;
            const { data: up, error: upErr } = await supabaseClient.storage
                .from('productos')
                .upload(`carousel/${fileName}`, file);
            if (upErr) { err.textContent = 'Error subiendo imagen: ' + upErr.message; err.style.display = 'block'; return; }
            const { data: urlData } = supabaseClient.storage.from('productos').getPublicUrl(`carousel/${fileName}`);
            imagen_url = urlData.publicUrl;
        }

        const slideData = {
            titulo: document.getElementById('slideTitulo').value.trim() || null,
            subtitulo: document.getElementById('slideSubtitulo').value.trim() || null,
            link: document.getElementById('slideLink').value.trim() || null,
            orden: parseInt(document.getElementById('slideOrden').value) || 0
        };
        if (imagen_url) slideData.imagen_url = imagen_url;

        try {
            if (id) {
                const { error: e2 } = await supabaseClient.from('carousel_slides').update(slideData).eq('id', id);
                if (e2) throw e2;
                suc.textContent = '✅ Slide actualizado.';
            } else {
                if (!imagen_url) { err.textContent = 'Debes subir una imagen.'; err.style.display = 'block'; return; }
                slideData.imagen_url = imagen_url;
                const { error: e2 } = await supabaseClient.from('carousel_slides').insert(slideData);
                if (e2) throw e2;
                suc.textContent = '✅ Slide creado.';
            }
            suc.style.display = 'block';
            loadSlides();
            setTimeout(() => modal.style.display = 'none', 1500);
        } catch (e2) {
            err.textContent = e2.message || 'Error al guardar.';
            err.style.display = 'block';
        }
    });

    async function editSlide(id) {
        const { data } = await supabaseClient.from('carousel_slides').select('*').eq('id', id).single();
        if (!data) return;
        document.getElementById('slideId').value = data.id;
        document.getElementById('slideTitulo').value = data.titulo || '';
        document.getElementById('slideSubtitulo').value = data.subtitulo || '';
        document.getElementById('slideLink').value = data.link || '';
        document.getElementById('slideOrden').value = data.orden;
        document.getElementById('slideImagenPreview').innerHTML = data.imagen_url ? `<img src="${data.imagen_url}" style="max-height:80px; border-radius:8px;">` : '';
        document.getElementById('slideError').style.display = 'none';
        document.getElementById('slideSuccess').style.display = 'none';
        title.textContent = 'Editar Slide';
        modal.style.display = '';
    }

    async function removeSlide(id) {
        if (!confirm('¿Eliminar este slide?')) return;
        await supabaseClient.from('carousel_slides').delete().eq('id', id);
        loadSlides();
    }

    window.AdminSlides = { edit: editSlide, remove: removeSlide, load: loadSlides };

    const tab = document.getElementById('tabContent');
    if (tab) { let loaded = false; tab.addEventListener('click', () => { if (!loaded) { loadSlides(); loaded = true; } }); }
})();
