/* ============================================================
   LICORERÍA DON DAVID — partials.js
   ============================================================
   HTML compartido entre TODAS las páginas: el panel del
   carrito, el botón flotante de WhatsApp, el botón "volver
   arriba", el menú desplegable de contacto (dirección/WhatsApp/
   horario) y, solo en las páginas de producto, una barra
   superior mínima con el logo y el ícono del carrito.

   ¿Por qué juntar esto en un solo archivo? Antes cada página
   tenía su propio HTML pegado a mano para estas piezas. Eso es
   justo lo que causó que "paginas/whisky.html" nunca se creara
   y se quedara como un enlace roto en el resto del sitio: nadie
   se acordó de copiar todo a la página nueva. Ahora, si hay que
   cambiar el número de WhatsApp, la dirección o el horario, se
   cambia UNA sola vez, aquí, y las 5 páginas se actualizan solas.
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  insertarWidgetsCompartidos();
  insertarMiniHeader();
  insertarMenuContacto(); // cubre el dropdown estático de index.html Y el del mini-header recién creado arriba
});

function insertarWidgetsCompartidos() {
  const contenedor = document.getElementById("widgets-compartidos");
  if (!contenedor) return;

  contenedor.innerHTML =
    '<div class="offcanvas offcanvas-end text-bg-dark" tabindex="-1" id="offcanvasCarrito" aria-labelledby="offcanvasCarritoLabel">' +
      '<div class="offcanvas-header">' +
        '<h5 class="offcanvas-title" id="offcanvasCarritoLabel">🛒 Tu carrito</h5>' +
        '<div class="carrito-header-botones">' +
          '<button type="button" class="btn-carrito-header" data-bs-dismiss="offcanvas" title="Minimizar y seguir navegando">' +
            '<i class="bi bi-dash-lg"></i>' +
          '</button>' +
          '<button type="button" class="btn-carrito-header" onclick="confirmarVaciarCarrito()" title="Vaciar carrito (borra todos los productos)">' +
            '<i class="bi bi-x-lg"></i>' +
          '</button>' +
        '</div>' +
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
          '<button type="button" class="btn btn-warning w-100" id="btnEnviarPedido">' +
            '<i class="bi bi-whatsapp"></i> Enviar pedido por WhatsApp' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<a href="/index.html#inicio" class="volver-arriba" onclick="volverArriba(event)"><i class="bi bi-arrow-up"></i></a>' +
    '<a href="https://wa.me/' + WHATSAPP_NUMERO + '" class="whatsapp" target="_blank"><i class="bi bi-whatsapp"></i></a>';

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
      '<div class="dropdown">' +
        '<a href="#" class="logo dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">' +
          '<span class="logo-icon">🍺</span>' +
          '<span>Licorería <strong>Don David</strong></span>' +
        '</a>' +
        '<ul class="dropdown-menu dropdown-menu-contacto"></ul>' +
      '</div>' +
      '<button type="button" class="btn-carrito" data-bs-toggle="offcanvas" data-bs-target="#offcanvasCarrito">' +
        '<i class="bi bi-cart3"></i>' +
        '<span class="carrito-contador" id="carritoContador">0</span>' +
      '</button>' +
    '</div>';

  if (typeof actualizarBadgeCarrito === "function") actualizarBadgeCarrito();
}

// ------------------------------------------------------------
// MENÚ DE CONTACTO — llena CUALQUIER <ul class="dropdown-menu-
// contacto"> que haya en la página (el de index.html, que ya
// viene en el HTML, y/o el del mini-header, recién insertado
// arriba). Dirección → Google Maps. Teléfono → WhatsApp con
// mensaje pre-armado. Horario → solo texto, no es un enlace.
// ------------------------------------------------------------
function insertarMenuContacto() {
  const elementos = document.querySelectorAll(".dropdown-menu-contacto");
  if (elementos.length === 0) return;

  const direccion = CONFIG_NEGOCIO.direccion;
  const mapsUrl = "https://www.google.com/maps?q=" + encodeURIComponent(direccion);
  const mensajeWhatsapp = encodeURIComponent("Hola, estoy interesado en tus productos, ¿me envías tu catálogo por favor?");
  const whatsappUrl = "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + mensajeWhatsapp;

  const html =
    '<li><a class="dropdown-item" href="' + mapsUrl + '" target="_blank" rel="noopener">' +
      '<i class="bi bi-geo-alt-fill"></i> ' + direccion +
    '</a></li>' +
    '<li><a class="dropdown-item" href="' + whatsappUrl + '" target="_blank" rel="noopener">' +
      '<i class="bi bi-whatsapp"></i> ' + CONFIG_NEGOCIO.telefono +
    '</a></li>' +
    '<li><span class="dropdown-item-text text-secondary">' +
      '<i class="bi bi-clock-fill"></i> ' + CONFIG_NEGOCIO.horario +
    '</span></li>';

  elementos.forEach(function (el) {
    el.innerHTML = html;
  });
}
