// Arranque («enlace establecido») que comparten la home, la promo y la guía: el marcado y el script que lo muestra o lo quita.
// Se ve solo al entrar al sitio desde fuera o al recargar (lo decide el referente, sin guardar nada); sin JavaScript queda oculto.
// index.html lleva este mismo bloque (una prueba exige que coincidan); promo y guía lo reciben de aquí al generarse.
export const BOOT_HTML = `    <div class="c-boot" aria-hidden="true" hidden><span class="c-boot__text">enlace establecido</span><span class="c-boot__track"><i class="c-boot__fill"></i></span></div>
    <script>
      // Arranque solo al entrar al sitio desde fuera o al recargar (sin guardar nada); cualquier otro caso lo quita. Tope de 4 s por si main.js no llega.
      (function () {
        var b = document.querySelector('.c-boot');
        if (!b) return;
        var same = false;
        try { same = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {}
        var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
        if (same || (nav && nav.type === 'back_forward') || matchMedia('(prefers-reduced-motion: reduce)').matches) { b.remove(); return; }
        b.hidden = false;
        setTimeout(function () { b.remove(); }, 4000);
      })();
    </script>
`;
