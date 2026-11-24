// ===== v6.0 — touch interface (020M) =====
// Drawer menu + bottom bar for phones and tablets. The bar buttons don't hold any logic of their own:
// each one forwards the tap to the real button in the panel (startBtn, stopBtn, clearBtn, exportBtn in
// index.html) and copies its enabled/disabled state, so sketch.js keeps working exactly as in v5.0.

(function () {
  const body = document.body;
  const toggle = document.getElementById('menuToggle');
  const closeBtn = document.getElementById('menuClose');
  const backdrop = document.getElementById('menuBackdrop');

  // True when the touch layout from css/mobile.css is active (same condition as its media query).
  const touchLayout = window.matchMedia('(max-width: 1024px), (hover: none) and (pointer: coarse)');

  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  closeBtn.addEventListener('click', () => setMenu(false));
  backdrop.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Bar button -> real panel button. The pairs: [bar id, panel id].
  const pairs = [
    ['mPlay', 'startBtn'],
    ['mPause', 'stopBtn'],
    ['mClear', 'clearBtn'],
    ['mExport', 'exportBtn']
  ];

  for (const [barId, realId] of pairs) {
    const barBtn = document.getElementById(barId);
    const realBtn = document.getElementById(realId);
    if (!barBtn || !realBtn) continue;

    barBtn.addEventListener('click', () => {
      if (!realBtn.disabled) realBtn.click();
    });

    // Mirror the disabled state that sketch.js sets on the real button.
    const sync = () => { barBtn.disabled = realBtn.disabled; };
    sync();
    new MutationObserver(sync).observe(realBtn, { attributes: true, attributeFilter: ['disabled'] });
  }

  // Pressing PLAY inside the drawer closes it, so the growth is visible straight away.
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => { if (touchLayout.matches) setMenu(false); });
  }

  // Leaving the touch layout (e.g. resizing a desktop window) never leaves the drawer stuck open.
  const onLayoutChange = () => { if (!touchLayout.matches) setMenu(false); };
  if (touchLayout.addEventListener) touchLayout.addEventListener('change', onLayoutChange);
})();
