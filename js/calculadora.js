// ============================================
// calculadora.js — Calculadora VisualCorp
// ============================================
// Depende de: supabase.js, api.js

(async function () {
  // --- Utilidades ---
  const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
  const toNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

  // --- Elementos globales ---
  const ivaEl = document.getElementById('iva');
  const tierSel = document.getElementById('tier');
  const themeBtn = document.getElementById('themeBtn');

  // --- Tema claro/oscuro ---
  if (themeBtn) {
    themeBtn.addEventListener('click', () => document.body.classList.toggle('light'));
  }

  // ========================
  //  PANEL: POR MEDIDAS
  // ========================
  const catMed = document.getElementById('catMed');
  const itemMed = document.getElementById('itemMed');
  const ancho = document.getElementById('ancho');
  const alto = document.getElementById('alto');
  const precioM2 = document.getElementById('precioM2');
  const areaM2 = document.getElementById('areaM2');
  const pillGroupMed = document.querySelector('.pill-group[data-scope="med"]');
  const designCustomMed = document.getElementById('designCustomMed');
  const tipoOjal = document.getElementById('tipoOjal');
  const cantOjal = document.getElementById('cantOjal');
  const msgMed = document.getElementById('msgMed');

  // Outputs medidas
  const subMaterialMed = document.getElementById('subMaterialMed');
  const costoDisenoMed = document.getElementById('costoDisenoMed');
  const costoOjalesMed = document.getElementById('costoOjalesMed');
  const subtotalBaseMed = document.getElementById('subtotalBaseMed');
  const ivaFinalMed = document.getElementById('ivaFinalMed');
  const granTotalMed = document.getElementById('granTotalMed');

  // ========================
  //  PANEL: POR PRODUCTO
  // ========================
  const catProd = document.getElementById('catProd');
  const itemProd = document.getElementById('itemProd');
  const nombreProd = document.getElementById('nombreProd');
  const precioProd = document.getElementById('precioProd');
  const cantidadProd = document.getElementById('cantidadProd');
  const pillGroupProd = document.querySelector('.pill-group[data-scope="prod"]');
  const designCustomProd = document.getElementById('designCustomProd');
  const msgProd = document.getElementById('msgProd');

  // Outputs producto
  const subMaterialProd = document.getElementById('subMaterialProd');
  const costoDisenoProd = document.getElementById('costoDisenoProd');
  const subtotalBaseProd = document.getElementById('subtotalBaseProd');
  const ivaFinalProd = document.getElementById('ivaFinalProd');
  const granTotalProd = document.getElementById('granTotalProd');

  if (!catMed || !catProd) return;

  // --- Estado ---
  let impresiones = [];
  let productosList = [];    // souvenirs + personalizados
  let designAddMed = 0;
  let designAddProd = 0;

  // --- Cargar datos ---
  async function init() {
    try {
      const [imp, souv, pers] = await Promise.all([
        getImpresiones(),
        getSouvenirs(),
        getPersonalizados()
      ]);

      impresiones = imp;
      productosList = [...souv, ...pers];

      fillCategories();

      // Defaults
      ancho.value = 100;
      alto.value = 100;

      calcMedidas();
      applyProdItem();
    } catch (err) {
      console.error('Error cargando calculadora:', err);
    }
  }

  // --- Llenar categorías ---
  function fillCategories() {
    // Medidas: subcategorías únicas de Impresiones
    const subcatsMed = [...new Set(impresiones.map(p => p.subcategoria))].sort();
    catMed.innerHTML = subcatsMed.map((s, i) => `<option value="${s}">${s}</option>`).join('');
    onCatChange('med');

    // Productos: subcategorías únicas de souvenirs+personalizados
    const subcatsProd = [...new Set(productosList.map(p => p.subcategoria))].sort();
    catProd.innerHTML = subcatsProd.map((s, i) => `<option value="${s}">${s}</option>`).join('');
    onCatChange('prod');
  }

  function onCatChange(scope) {
    if (scope === 'med') {
      const subcat = catMed.value;
      const items = impresiones.filter(p => p.subcategoria === subcat);
      const opts = items.map(p =>
        `<option value="${p.id}">${p.nombre}</option>`
      ).join('');
      itemMed.innerHTML = `<option value="">(opcional) — elegir material</option>${opts}`;
      precioM2.value = '';
      msgMed.textContent = 'Selecciona un material para rellenar el precio automático (editable).';
    } else {
      const subcat = catProd.value;
      const items = productosList.filter(p => p.subcategoria === subcat);
      const opts = items.map(p =>
        `<option value="${p.id}">${p.nombre}</option>`
      ).join('');
      itemProd.innerHTML = `<option value="">(opcional) — elegir producto</option>${opts}`;
    }
  }

  catMed.addEventListener('change', () => onCatChange('med'));
  catProd.addEventListener('change', () => onCatChange('prod'));

  // --- Helpers para buscar items ---
  function findImpresionById(id) {
    return impresiones.find(p => p.id === id) || null;
  }

  function findProductoById(id) {
    return productosList.find(p => p.id === id) || null;
  }

  // --- PANEL MEDIDAS: aplicar item seleccionado ---
  function applyMedItem() {
    const id = itemMed.value;
    if (!id) {
      msgMed.textContent = 'Puedes escribir un precio por m² manualmente.';
      return;
    }
    const it = findImpresionById(id);
    if (!it) return;

    const tier = tierSel.value || 'pvp';
    let val = 0;
    if (tier === 'instalacion') val = it.precio_inst || 0;
    else if (tier === 'corporativo') val = it.precio_corp || 0;
    else val = it.precio_pvp || 0;

    precioM2.value = val;
    msgMed.textContent = `Se aplicó precio ${tier.toUpperCase()} = $${Number(val).toFixed(2)} por m² (editable).`;
    calcMedidas();
  }

  itemMed.addEventListener('change', applyMedItem);
  tierSel.addEventListener('change', () => { applyMedItem(); applyProdItem(); });

  // --- PANEL MEDIDAS: cálculo ---
  function calcMedidas() {
    // 1. Costo material base (cm → m)
    const a_cm = Math.max(0, toNum(ancho.value));
    const h_cm = Math.max(0, toNum(alto.value));
    const pm2 = Math.max(0, toNum(precioM2.value));
    const a_m = a_cm / 100;
    const h_m = h_cm / 100;
    const area = a_m * h_m;
    areaM2.value = area.toFixed(4);
    const subMaterial = area * pm2;

    // 2. Costo diseño
    const customDesign = Math.max(0, toNum(designCustomMed.value));
    const addDesign = customDesign > 0 ? customDesign : designAddMed;

    // 3. Costo ojales
    const tipo = tipoOjal.value;
    const cant = Math.max(0, Math.floor(toNum(cantOjal.value)));
    let costoOjales = 0;
    if (tipo === 'grande') costoOjales = 0.50 * cant;
    else if (tipo === 'pequeno') costoOjales = 0.30 * cant;

    // 4. Totales
    const subtotalBruto = subMaterial + addDesign + costoOjales;
    const iva = subtotalBruto * (Math.max(0, toNum(ivaEl.value)) / 100);
    const totalFinal = subtotalBruto + iva;

    // 5. UI
    subMaterialMed.textContent = fmt(subMaterial);
    costoDisenoMed.textContent = fmt(addDesign);
    costoOjalesMed.textContent = fmt(costoOjales);
    subtotalBaseMed.textContent = fmt(subtotalBruto);
    ivaFinalMed.textContent = fmt(iva);
    granTotalMed.textContent = fmt(totalFinal);
  }

  [ancho, alto, precioM2, ivaEl, designCustomMed, tipoOjal, cantOjal].forEach(el =>
    el.addEventListener('input', calcMedidas)
  );

  pillGroupMed.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
      [...pillGroupMed.querySelectorAll('.pill')].forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      designCustomMed.value = '';
      designAddMed = toNum(e.target.dataset.add);
      calcMedidas();
    }
  });

  // --- PANEL PRODUCTO: aplicar item seleccionado ---
  function applyProdItem() {
    const id = itemProd.value;
    if (!id) {
      nombreProd.value = '';
      precioProd.value = '';
      precioProd.readOnly = false;
      msgProd.textContent = 'Selecciona un producto.';
      calcProducto();
      return;
    }
    const it = findProductoById(id);
    if (!it) return;

    nombreProd.value = it.nombre;

    const escalas = it.escalas_precios;
    if (escalas && Array.isArray(escalas) && escalas.length > 0) {
      precioProd.readOnly = true;
      msgProd.textContent = 'Precio automático por cantidad.';
    } else {
      precioProd.readOnly = false;
      precioProd.value = (it.precio_pvp || 0).toFixed(2);
      msgProd.textContent = 'Precio unitario fijo (editable).';
    }

    calcProducto();
  }

  itemProd.addEventListener('change', applyProdItem);

  // --- PANEL PRODUCTO: cálculo ---
  function calcProducto() {
    let unitPrice = 0;
    const c = Math.max(0, Math.floor(toNum(cantidadProd.value)));
    const id = itemProd.value;
    const it = id ? findProductoById(id) : null;

    if (it && it.escalas_precios && Array.isArray(it.escalas_precios) && it.escalas_precios.length > 0) {
      precioProd.readOnly = true;
      const prices = it.escalas_precios;
      for (let i = prices.length - 1; i >= 0; i--) {
        if (c >= prices[i].qty) {
          unitPrice = prices[i].pvp;
          break;
        }
      }
      if (unitPrice === 0 && c > 0) {
        unitPrice = prices[0].pvp;
      }
      precioProd.value = unitPrice.toFixed(4);
    } else {
      if (it) precioProd.readOnly = false;
      unitPrice = Math.max(0, toNum(precioProd.value));
    }

    const subProductos = unitPrice * c;

    // Diseño
    const customDesign = Math.max(0, toNum(designCustomProd.value));
    const addDesign = customDesign > 0 ? customDesign : designAddProd;

    // Totales
    const subtotalBruto = subProductos + addDesign;
    const iva = subtotalBruto * (Math.max(0, toNum(ivaEl.value)) / 100);
    const totalFinal = subtotalBruto + iva;

    // UI
    subMaterialProd.textContent = fmt(subProductos);
    costoDisenoProd.textContent = fmt(addDesign);
    subtotalBaseProd.textContent = fmt(subtotalBruto);
    ivaFinalProd.textContent = fmt(iva);
    granTotalProd.textContent = fmt(totalFinal);
  }

  [precioProd, cantidadProd, ivaEl, designCustomProd].forEach(el =>
    el.addEventListener('input', calcProducto)
  );

  pillGroupProd.addEventListener('click', (e) => {
    if (e.target.classList.contains('pill')) {
      [...pillGroupProd.querySelectorAll('.pill')].forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      designCustomProd.value = '';
      designAddProd = toNum(e.target.dataset.add);
      calcProducto();
    }
  });

  // --- Iniciar ---
  init();
})();
