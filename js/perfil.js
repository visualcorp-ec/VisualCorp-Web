// ============================================
// perfil.js — Client Profile Management
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await Auth.getSession();
    const user = Auth.getUser();

    if (!user) {
        window.location.href = 'login.html?redirect=perfil.html';
        return;
    }

    const profile = Auth.getProfile();

    // --- Populate fields ---
    const avatar = document.getElementById('profileAvatar');
    const nombre = document.getElementById('profNombre');
    const telefono = document.getElementById('profTelefono');
    const email = document.getElementById('profEmail');

    if (profile) {
        nombre.value = profile.nombre || '';
        telefono.value = profile.telefono || '';
        avatar.textContent = (profile.nombre || user.email || '?').charAt(0).toUpperCase();
    }
    email.value = user.email || '';

    // --- Profile update form ---
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const sucEl = document.getElementById('profSuccess');
        const errEl = document.getElementById('profError');
        sucEl.style.display = 'none';
        errEl.style.display = 'none';

        try {
            const { error } = await supabaseClient
                .from('perfiles')
                .update({
                    nombre: nombre.value.trim(),
                    telefono: telefono.value.trim()
                })
                .eq('id', user.id);

            if (error) throw error;

            sucEl.textContent = '✅ Perfil actualizado correctamente.';
            sucEl.style.display = 'block';

            // Update avatar
            avatar.textContent = nombre.value.trim().charAt(0).toUpperCase();

            // Refresh Auth profile
            await Auth.fetchProfile();
            Auth.updateNavUI();
        } catch (err) {
            errEl.textContent = err.message || 'Error al guardar.';
            errEl.style.display = 'block';
        }
    });

    // --- Password change form ---
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const sucEl = document.getElementById('passSuccess');
        const errEl = document.getElementById('passError');
        sucEl.style.display = 'none';
        errEl.style.display = 'none';

        const newPass = document.getElementById('profNewPassword').value;
        const confirmPass = document.getElementById('profConfirmPassword').value;

        if (newPass !== confirmPass) {
            errEl.textContent = 'Las contraseñas no coinciden.';
            errEl.style.display = 'block';
            return;
        }

        try {
            const { error } = await supabaseClient.auth.updateUser({ password: newPass });
            if (error) throw error;

            sucEl.textContent = '✅ Contraseña actualizada correctamente.';
            sucEl.style.display = 'block';
            document.getElementById('profNewPassword').value = '';
            document.getElementById('profConfirmPassword').value = '';
        } catch (err) {
            errEl.textContent = err.message || 'Error al cambiar la contraseña.';
            errEl.style.display = 'block';
        }
    });
});
