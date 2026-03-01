// ============================================
// menu.js  —  Navegación reutilizable VisualCorp
// ============================================

(function () {
  const pages = [
    { label: 'Inicio', href: 'index.html', icon: '' },
    { label: 'Calculadora', href: 'calculadora.html', icon: '' },
    { label: 'Tienda', href: 'tienda.html', icon: '' },
    { label: 'Servicios', href: 'servicios.html', icon: '' },
    { label: 'Contacto', href: 'contacto.html', icon: '' }
  ];

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isSubdir = window.location.pathname.includes('/admin/');
  const prefix = isSubdir ? '../' : '';

  const navHTML = `
  <header class="site-header">
    <div class="container">
      <nav class="nav" aria-label="Menú principal">
        <a href="${prefix}index.html" class="nav__logo">
          <img src="https://d1so26dimrz1o2.cloudfront.net/uploads/avatars/g32HrUdRExn93slL9Joo4T2nYbEXrN7Pog52QeH8.jpg"
               alt="VisualCorp" class="nav__logo-img">
          <span>Visual</span>Corp
        </a>

        <ul class="nav__links" id="navLinks">
          ${pages.map(p =>
    `<li><a href="${prefix}${p.href}" class="nav__link${currentPage === p.href && !isSubdir ? ' active' : ''}">${p.label}</a></li>`
  ).join('')}
          <li style="display:flex; align-items:center; gap:var(--sp-2);">
            <a href="${prefix}carrito.html" class="nav__link nav__cart-link${currentPage === 'carrito.html' && !isSubdir ? ' active' : ''}">
              <i class="fa-solid fa-cart-shopping"></i>
              <span id="cart-badge" class="cart-badge" style="display:none;">0</span>
            </a>
            <button id="themeToggleDesktop" class="nav__link" style="background:none; border:none; color:inherit; font-size:1.1rem; cursor:pointer; padding:0;" aria-label="Cambiar tema" title="Modo Claro / Oscuro">
                <i class="fa-solid fa-sun"></i>
            </button>
          </li>
        </ul>

        <div class="nav__right-mobile">
          <button id="themeToggleMobile" style="background:none; border:none; color:inherit; font-size:1.1rem; cursor:pointer;" aria-label="Cambiar tema">
            <i class="fa-solid fa-sun"></i>
          </button>
          <a href="${prefix}carrito.html" class="nav__cart-mobile">
            <i class="fa-solid fa-cart-shopping"></i>
            <span id="cart-badge-mobile" class="cart-badge" style="display:none;">0</span>
          </a>
          <button class="nav__hamburger" id="navHamburger" aria-label="Abrir menú" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>
    </div>
  </header>`;

  const container = document.getElementById('nav-container');
  if (container) container.innerHTML = navHTML;

  // Hamburger toggle
  const hamburger = document.getElementById('navHamburger');
  const links = document.getElementById('navLinks');
  if (hamburger && links) {
    hamburger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });
    links.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav__link')) {
        links.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Sync both badges  
  const origUpdate = window.Carrito && Carrito.updateBadge;
  if (origUpdate) {
    const _orig = Carrito.updateBadge.bind(Carrito);
    // Override to sync mobile badge too
    Carrito.updateBadge = function () {
      const count = Carrito.getCount();
      ['cart-badge', 'cart-badge-mobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = count;
          el.style.display = count > 0 ? 'flex' : 'none';
        }
      });
    };
    Carrito.updateBadge();
  }

  // --- Inject floating social button ---
  const floatScript = document.createElement('script');
  floatScript.src = prefix + 'js/float-social.js';
  document.body.appendChild(floatScript);

  // --- Theme Toggle Global ---
  const savedTheme = localStorage.getItem('visualcorp_theme');
  const bodyClass = document.body.classList;

  if (savedTheme === 'light') {
    bodyClass.add('light-mode');
  }

  function toggleTheme() {
    if (bodyClass.contains('light-mode')) {
      bodyClass.remove('light-mode');
      localStorage.setItem('visualcorp_theme', 'dark');
    } else {
      bodyClass.add('light-mode');
      localStorage.setItem('visualcorp_theme', 'light');
    }
    updateThemeIcons();
  }

  function updateThemeIcons() {
    const isLight = bodyClass.contains('light-mode');
    const iconHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    const btnDesktop = document.getElementById('themeToggleDesktop');
    const btnMobile = document.getElementById('themeToggleMobile');

    if (btnDesktop) btnDesktop.innerHTML = iconHTML;
    if (btnMobile) btnMobile.innerHTML = iconHTML;
  }

  const toggleBtnD = document.getElementById('themeToggleDesktop');
  const toggleBtnM = document.getElementById('themeToggleMobile');

  if (toggleBtnD) toggleBtnD.addEventListener('click', toggleTheme);
  if (toggleBtnM) toggleBtnM.addEventListener('click', toggleTheme);

  // Set initial icon state
  updateThemeIcons();
})();
