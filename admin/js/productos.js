// ============================================
// productos.js — Admin CRUD for Products
// ============================================

(function () {
    const productsBody = document.getElementById('productsBody');
    const btnAdd = document.getElementById('btnAddProduct');
    const modal = document.getElementById('productModal');
    const closeModal = document.getElementById('closeProductModal');
    const form = document.getElementById('productForm');
    const modalTitle = document.getElementById('productModalTitle');
    const submitBtn = document.getElementById('prodSubmitBtn');

    if (!productsBody || !form) return;

    // --- Load products ---
    async function loadProducts() {
        productsBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando...</td></tr>';

        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .order('categoria_principal', { ascending: true })
            .order('nombre', { ascending: true });

        if (error || !data) {
            productsBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Error cargando productos</td></tr>';
            return;
        }

        if (data.length === 0) {
            productsBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--color-text-dim);">No hay productos registrados. ¡Añade uno!</td></tr>';
            return;
        }

        productsBody.innerHTML = data.map(p => {
            const img = p.imagen_url
                ? `<img src="${p.imagen_url}" alt="${p.nombre}" style="width:50px;height:50px;object-fit:cover;border-radius:var(--radius-sm);">`
                : '<span style="color:var(--color-text-dim);font-size:.75rem;">Sin imagen</span>';

            const activoBadge = p.activo !== false
                ? '<span class="status-badge status-badge--done">Activo</span>'
                : '<span class="status-badge status-badge--pending">Inactivo</span>';

            const precio = p.precio_pvp ? `$${Number(p.precio_pvp).toFixed(2)}` : '—';

            return `<tr>
                <td>${img}</td>
                <td style="font-weight:700; color:var(--color-heading);">${p.nombre}</td>
                <td>${p.categoria_principal}<br><small style="color:var(--color-text-dim);">${p.subcategoria || ''}</small></td>
                <td>${p.codigo || '—'}</td>
                <td>${precio}</td>
                <td>${activoBadge}</td>
                <td>
                    <div style="display:flex; gap:var(--sp-2); flex-wrap:wrap;">
                        <button class="btn btn--secondary" style="font-size:.7rem;padding:4px 10px;" onclick="AdminProductos.edit('${p.id}')">
                            <i class="fa-solid fa-pen"></i> Editar
                        </button>
                        <button class="btn btn--secondary" style="font-size:.7rem;padding:4px 10px; color:${p.activo !== false ? '#ef4444' : '#22c55e'};" onclick="AdminProductos.toggle('${p.id}', ${p.activo !== false})">
                            <i class="fa-solid fa-${p.activo !== false ? 'eye-slash' : 'eye'}"></i> ${p.activo !== false ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn--secondary" style="font-size:.7rem;padding:4px 10px; color:#ef4444;" onclick="AdminProductos.remove('${p.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // --- Open modal for new product ---
    btnAdd.addEventListener('click', () => {
        form.reset();
        document.getElementById('prodId').value = '';
        document.getElementById('prodImagenPreview').innerHTML = '';
        document.getElementById('prodError').style.display = 'none';
        document.getElementById('prodSuccess').style.display = 'none';
        modalTitle.textContent = 'Nuevo Producto';
        submitBtn.textContent = 'Guardar Producto';
        modal.style.display = '';
    });

    // --- Close modal ---
    closeModal.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    // --- Image preview ---
    document.getElementById('prodImagen').addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById('prodImagenPreview');
        if (file) {
            const url = URL.createObjectURL(file);
            preview.innerHTML = `<img src="${url}" style="max-width:200px; border-radius:var(--radius-sm); margin-top:var(--sp-2);">`;
        } else {
            preview.innerHTML = '';
        }
    });

    // --- Submit form (create or update) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('prodError');
        const sucEl = document.getElementById('prodSuccess');
        errEl.style.display = 'none';
        sucEl.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
            const id = document.getElementById('prodId').value;
            const nombre = document.getElementById('prodNombre').value.trim();
            const categoria = document.getElementById('prodCategoria').value;
            const subcategoria = document.getElementById('prodSubcategoria').value.trim();
            const codigo = document.getElementById('prodCodigo').value.trim();
            const precio = document.getElementById('prodPrecio').value ? parseFloat(document.getElementById('prodPrecio').value) : null;
            const descripcion = document.getElementById('prodDescripcion').value.trim();
            const fileInput = document.getElementById('prodImagen');

            let imagen_url = null;

            // Upload image if selected
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const ext = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}.${ext}`;

                const { data: uploadData, error: uploadError } = await supabaseClient
                    .storage
                    .from('productos')
                    .upload(fileName, file, { contentType: file.type, upsert: true });

                if (uploadError) throw new Error('Error subiendo imagen: ' + uploadError.message);

                const { data: urlData } = supabaseClient
                    .storage
                    .from('productos')
                    .getPublicUrl(fileName);

                imagen_url = urlData.publicUrl;
            }

            const productData = {
                nombre,
                categoria_principal: categoria,
                subcategoria,
                codigo,
                precio_pvp: precio,
                descripcion
            };

            if (imagen_url) productData.imagen_url = imagen_url;

            if (id) {
                // Update
                const { error } = await supabaseClient
                    .from('productos')
                    .update(productData)
                    .eq('id', id);
                if (error) throw error;
                sucEl.textContent = '✅ Producto actualizado exitosamente.';
            } else {
                // Create
                productData.activo = true;
                const { error } = await supabaseClient
                    .from('productos')
                    .insert(productData);
                if (error) throw error;
                sucEl.textContent = '✅ Producto creado exitosamente.';
            }

            sucEl.style.display = 'block';
            loadProducts();

            // Close modal after 1.5s
            setTimeout(() => { modal.style.display = 'none'; }, 1500);

        } catch (err) {
            errEl.textContent = err.message || 'Error al guardar el producto.';
            errEl.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Producto';
        }
    });

    // --- Edit product ---
    async function editProduct(id) {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) { alert('Error al cargar producto.'); return; }

        form.reset();
        document.getElementById('prodId').value = data.id;
        document.getElementById('prodNombre').value = data.nombre || '';
        document.getElementById('prodCategoria').value = data.categoria_principal || 'Souvenirs';
        document.getElementById('prodSubcategoria').value = data.subcategoria || '';
        document.getElementById('prodCodigo').value = data.codigo || '';
        document.getElementById('prodPrecio').value = data.precio_pvp || '';
        document.getElementById('prodDescripcion').value = data.descripcion || '';
        document.getElementById('prodError').style.display = 'none';
        document.getElementById('prodSuccess').style.display = 'none';

        const preview = document.getElementById('prodImagenPreview');
        if (data.imagen_url) {
            preview.innerHTML = `<img src="${data.imagen_url}" style="max-width:200px; border-radius:var(--radius-sm); margin-top:var(--sp-2);">`;
        } else {
            preview.innerHTML = '';
        }

        modalTitle.textContent = 'Editar Producto';
        submitBtn.textContent = 'Actualizar Producto';
        modal.style.display = '';
    }

    // --- Toggle active status ---
    async function toggleProduct(id, currentlyActive) {
        const action = currentlyActive ? 'desactivar' : 'activar';
        if (!confirm(`¿Deseas ${action} este producto?`)) return;

        const { error } = await supabaseClient
            .from('productos')
            .update({ activo: !currentlyActive })
            .eq('id', id);

        if (error) { alert('Error: ' + error.message); return; }
        loadProducts();
    }

    // --- Delete product ---
    async function deleteProduct(id) {
        if (!confirm('¿Estás seguro de ELIMINAR este producto? Esta acción no se puede deshacer.')) return;

        const { error } = await supabaseClient
            .from('productos')
            .delete()
            .eq('id', id);

        if (error) { alert('Error: ' + error.message); return; }
        loadProducts();
    }

    // Expose globally for onclick handlers
    window.AdminProductos = {
        edit: editProduct,
        toggle: toggleProduct,
        remove: deleteProduct,
        load: loadProducts
    };

    // Auto-load when tab is first shown
    const tabProducts = document.getElementById('tabProducts');
    if (tabProducts) {
        let loaded = false;
        tabProducts.addEventListener('click', () => {
            if (!loaded) { loadProducts(); loaded = true; }
        });
    }
})();
