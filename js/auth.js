// ============================================
// auth.js — Módulo de autenticación (Supabase Auth)
// ============================================

const Auth = (function () {
    let currentUser = null;
    let currentProfile = null;

    // --- Get session ---
    async function getSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            await fetchProfile();
        }
        return session;
    }

    // --- Fetch profile ---
    async function fetchProfile() {
        if (!currentUser) return null;
        const { data } = await supabaseClient
            .from('perfiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        currentProfile = data;
        return data;
    }

    // --- Register ---
    async function register(email, password, nombre, telefono) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { nombre }
            }
        });
        if (error) throw error;

        // Update profile with phone
        if (data.user && telefono) {
            await supabaseClient
                .from('perfiles')
                .update({ telefono, nombre })
                .eq('id', data.user.id);
        }
        return data;
    }

    // --- Login ---
    async function login(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        currentUser = data.user;
        await fetchProfile();
        return data;
    }

    // --- Logout ---
    async function logout() {
        await supabaseClient.auth.signOut();
        currentUser = null;
        currentProfile = null;
    }

    // --- Getters ---
    function getUser() { return currentUser; }
    function getProfile() { return currentProfile; }
    function isLoggedIn() { return !!currentUser; }
    function isStaff() { return currentProfile && ['empleado', 'admin'].includes(currentProfile.rol); }
    function isAdmin() { return currentProfile && currentProfile.rol === 'admin'; }

    // --- Listen for auth changes ---
    function onAuthChange(callback) {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            currentUser = session?.user || null;
            if (currentUser) {
                fetchProfile().then(() => callback(event, session));
            } else {
                currentProfile = null;
                callback(event, session);
            }
        });
    }

    // --- Update nav UI ---
    function updateNavUI() {
        const navLinks = document.getElementById('navLinks');
        if (!navLinks) return;

        // Remove existing auth link
        const existing = navLinks.querySelector('.nav__auth-item');
        if (existing) existing.remove();

        const li = document.createElement('li');
        li.className = 'nav__auth-item';

        if (isLoggedIn()) {
            const name = currentProfile?.nombre || currentUser?.email?.split('@')[0] || 'Usuario';
            const isSubdir = window.location.pathname.includes('/admin/');
            const prefix = isSubdir ? '../' : '';

            li.innerHTML = `
                <div class="nav__user-menu">
                    <button class="nav__user-btn" id="userMenuBtn">
                        <span class="nav__user-avatar">${name.charAt(0).toUpperCase()}</span>
                        <span class="nav__user-name">${name}</span>
                    </button>
                    <div class="nav__user-dropdown" id="userDropdown">
                        ${isStaff() ? `<a href="${prefix}admin/index.html" class="nav__dropdown-item">🛠️ Panel Admin</a>` : ''}
                        <a href="${prefix}mis_pedidos.html" class="nav__dropdown-item">📦 Mis Pedidos</a>
                        <a href="${prefix}carrito.html" class="nav__dropdown-item">🛒 Mi Carrito</a>
                        <button class="nav__dropdown-item nav__logout-btn" id="navLogoutBtn">🚪 Cerrar Sesión</button>
                    </div>
                </div>`;
        } else {
            li.innerHTML = `<a href="login.html" class="nav__link nav__login-btn"><i class="fa-solid fa-user"></i> Iniciar Sesión</a>`;
        }

        // Insert before cart
        const cartItem = navLinks.querySelector('.nav__cart-link')?.closest('li');
        if (cartItem) {
            navLinks.insertBefore(li, cartItem);
        } else {
            navLinks.appendChild(li);
        }

        // Toggle dropdown
        const userBtn = document.getElementById('userMenuBtn');
        const dropdown = document.getElementById('userDropdown');
        if (userBtn && dropdown) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
            document.addEventListener('click', () => dropdown.classList.remove('show'));
        }

        // Logout
        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await logout();
                window.location.href = 'index.html';
            });
        }
    }

    return {
        getSession, register, login, logout,
        getUser, getProfile, isLoggedIn, isStaff, isAdmin,
        onAuthChange, updateNavUI, fetchProfile
    };
})();

// Auto-init auth on pages that load supabase
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient !== 'undefined') {
        await Auth.getSession();
        Auth.updateNavUI();
    }
});
