/* ============================================================
   LICORERÍA DON DAVID — partials.js
   ============================================================
   HTML compartido entre TODAS las páginas: el panel del
   carrito, el botón flotante de WhatsApp, el botón "volver
   arriba" y, solo en las páginas de producto, una barra
   superior mínima con el logo y el ícono del carrito.

   ¿Por qué juntar esto en un solo archivo? Antes cada página
   tenía su propio HTML pegado a mano para estas piezas. Eso es
   justo lo que causó que "paginas/whisky.html" nunca se creara
   y se quedara como un enlace roto en el resto del sitio: nadie
   se acordó de copiar todo a la página nueva. Ahora, si hay que
   cambiar el número de WhatsApp o el texto del carrito vacío,
   se cambia UNA sola vez, aquí, y las 5 páginas se actualizan
   solas.
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  insertarWidgetsCompartidos();
  insertarMiniHeader();
});

function insertarWidgetsCompartidos() {
  const contenedor = document.getElementById("widgets-compartidos");
  if (!contenedor) return;

  contenedor.innerHTML =
    '<div class="offcanvas offcanvas-end text-bg-dark" tabindex="-1" id="offcanvasCarrito" aria-labelledby="offcanvasCarritoLabel">' +
      '<div class="offcanvas-header">' +
        '<h5 class="offcanvas-title" id="offcanvasCarritoLabel">🛒 Tu carrito</h5>' +
        '<button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>' +
      '</div>' +
      '<div class="offcanvas-body d-flex flex-column">' +
        '<div id="carritoVacio" class="text-center text-secondary py-5">' +
          '<i class="bi bi-cart-x" style="font-size:2.5rem;"></i>' +
          '<p class="mt-2">Tu carrito está vacío.<br>Descubre nuestros productos 🍷</p>' +
        '</div>' +
        '<div id="carritoItems"></div>' +
        '<div class="mt-auto pt-3">' +
          '<hr class="border-secondary">' +
          '<div class="d-flex justify-content-between fs-5 fw-bold mb-3">' +
            '<span>Total:</span>' +
            '<span id="carritoTotal">S/ 0.00</span>' +
          '</div>' +
          '<button type="button" class="btn btn-warning w-100 mb-2" id="btnEnviarPedido">' +
            '<i class="bi bi-whatsapp"></i> Enviar pedido por WhatsApp' +
          '</button>' +
          '<button type="button" class="btn btn-outline-light w-100" id="btnVaciarCarrito">Vaciar carrito</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<a href="/index.html#inicio" class="volver-arriba" onclick="volverArriba(event)"><i class="bi bi-arrow-up"></i></a>' +
    '<a href="https://wa.me/' + WHATSAPP_NUMERO + '" class="whatsapp" target="_blank">💬</a>';

  // El carrito puede haber cambiado (localStorage) desde la
  // última vez que se pintó este panel en esta página.
  if (typeof actualizarBadgeCarrito === "function") actualizarBadgeCarrito();
  if (typeof renderizarCarrito === "function") renderizarCarrito();
}

function insertarMiniHeader() {
  const contenedor = document.getElementById("mini-header");
  if (!contenedor) return;

  contenedor.innerHTML =
    '<div class="mini-header d-flex justify-content-between align-items-center">' +
      '<a href="/index.html" class="logo">' +
        '<span class="logo-icon">🍺</span>' +
        '<span>Licorería <strong>Don David</strong></span>' +
      '</a>' +
      '<button type="button" class="btn-carrito" data-bs-toggle="offcanvas" data-bs-target="#offcanvasCarrito">' +
        '<i class="bi bi-cart3"></i>' +
        '<span class="carrito-contador" id="carritoContador">0</span>' +
      '</button>' +
    '</div>';

  if (typeof actualizarBadgeCarrito === "function") actualizarBadgeCarrito();
}
