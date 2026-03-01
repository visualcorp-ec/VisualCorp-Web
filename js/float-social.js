// ============================================
// float-social.js — Floating social media button
// Shows on all pages except contacto.html
// ============================================

(function () {
    // Don't show on contacto page
    if (window.location.pathname.includes('contacto')) return;

    const html = `
    <div id="floatSocial" style="position:fixed; bottom:24px; right:24px; z-index:999; display:flex; flex-direction:column-reverse; align-items:flex-end; gap:12px;">
        <button id="floatToggle" style="width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, #25D366, #128C7E); border:none; color:#fff; font-size:1.5rem; cursor:pointer; box-shadow:0 4px 15px rgba(37,211,102,.4); transition:transform .3s, box-shadow .3s;" aria-label="Contacto rápido">
            <i class="fa-solid fa-message"></i>
        </button>
        <div id="floatMenu" style="display:none; flex-direction:column; gap:10px; align-items:flex-end;">
            <a href="https://wa.me/593997078212" target="_blank" rel="noopener" style="display:flex; align-items:center; gap:8px; padding:8px 16px; background:#25D366; color:#fff; border-radius:25px; text-decoration:none; font-size:.85rem; font-weight:600; box-shadow:0 2px 10px rgba(0,0,0,.2); transition:transform .2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fa-brands fa-whatsapp" style="font-size:1.2rem;"></i> WhatsApp
            </a>
            <a href="https://www.facebook.com/VisualCorpEC" target="_blank" rel="noopener" style="display:flex; align-items:center; gap:8px; padding:8px 16px; background:#1877F2; color:#fff; border-radius:25px; text-decoration:none; font-size:.85rem; font-weight:600; box-shadow:0 2px 10px rgba(0,0,0,.2); transition:transform .2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fa-brands fa-facebook-f" style="font-size:1.2rem;"></i> Facebook
            </a>
            <a href="https://www.instagram.com/visualcorp.ec" target="_blank" rel="noopener" style="display:flex; align-items:center; gap:8px; padding:8px 16px; background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); color:#fff; border-radius:25px; text-decoration:none; font-size:.85rem; font-weight:600; box-shadow:0 2px 10px rgba(0,0,0,.2); transition:transform .2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fa-brands fa-instagram" style="font-size:1.2rem;"></i> Instagram
            </a>
            <a href="https://www.tiktok.com/@visualcorp.ec" target="_blank" rel="noopener" style="display:flex; align-items:center; gap:8px; padding:8px 16px; background:#000; color:#fff; border-radius:25px; text-decoration:none; font-size:.85rem; font-weight:600; box-shadow:0 2px 10px rgba(0,0,0,.2); transition:transform .2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fa-brands fa-tiktok" style="font-size:1.2rem;"></i> TikTok
            </a>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    let isOpen = false;
    const toggle = document.getElementById('floatToggle');
    const menu = document.getElementById('floatMenu');

    toggle.addEventListener('click', () => {
        isOpen = !isOpen;
        menu.style.display = isOpen ? 'flex' : 'none';
        toggle.style.transform = isOpen ? 'rotate(45deg)' : '';
        toggle.innerHTML = isOpen
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-message"></i>';
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (isOpen && !e.target.closest('#floatSocial')) {
            isOpen = false;
            menu.style.display = 'none';
            toggle.style.transform = '';
            toggle.innerHTML = '<i class="fa-solid fa-message"></i>';
        }
    });
})();
