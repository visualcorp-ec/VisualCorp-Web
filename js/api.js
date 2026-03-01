// ============================================
// api.js — Funciones de obtención de datos
// ============================================
// Todas las funciones dependen del cliente `supabaseClient`
// definido globalmente en supabase.js

/**
 * Obtiene todos los productos de tipo "Impresiones".
 * @returns {Promise<Array>} Lista de productos de impresión.
 */
async function getImpresiones() {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('categoria_principal', 'Impresiones')
        .order('subcategoria', { ascending: true });

    if (error) {
        console.error('Error al obtener impresiones:', error.message);
        return [];
    }
    return data;
}

/**
 * Obtiene todos los productos de tipo "Souvenirs".
 * @returns {Promise<Array>} Lista de souvenirs.
 */
async function getSouvenirs() {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('categoria_principal', 'Souvenirs')
        .order('nombre', { ascending: true });

    if (error) {
        console.error('Error al obtener souvenirs:', error.message);
        return [];
    }
    return data;
}

/**
 * Obtiene todos los productos de tipo "Productos Personalizados".
 * @returns {Promise<Array>} Lista de productos personalizados.
 */
async function getPersonalizados() {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('categoria_principal', 'Productos Personalizados')
        .order('nombre', { ascending: true });

    if (error) {
        console.error('Error al obtener productos personalizados:', error.message);
        return [];
    }
    return data;
}

/**
 * Obtiene un producto por su ID.
 * @param {string} id — UUID del producto.
 * @returns {Promise<Object|null>}
 */
async function getProductoById(id) {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error al obtener producto:', error.message);
        return null;
    }
    return data;
}
