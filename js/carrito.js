/* ============================================================
   LICORERÍA DON DAVID — carrito.js
   ============================================================
   Todo lo del carrito de compras: guardar, mostrar, cambiar
   cantidades, vaciar y armar el mensaje de WhatsApp. Antes vivía
   mezclado dentro de script.js; se separó para que cada archivo
   tenga una sola responsabilidad y sea más fácil de encontrar
   algo puntual sin desplazarte por 700 líneas.
   ============================================================ */

const CARRITO_STORAGE_KEY = "donDavidCarrito";

function obtenerCarrito() {
  try {
    return JSON.parse(localStorage.getItem(CARRITO_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function guardarCarrito(carrito) {
  localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(carrito));
  actualizarBadgeCarrito();
  renderizarCarrito();
}

function agregarAlCarrito(item, cantidad) {
  cantidad = cantidad || 1;
  const carrito = obtenerCarrito();
  const existente = carrito.find(function (p) { return p.id === item.id; });

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carrito.push({
      id: item.id,
      nombre: item.nombre,
      precio: item.precio,
      imagen: item.imagen,
      cantidad: cantidad
    });
  }

  guardarCarrito(carrito);
  abrirCarrito();
}

function cambiarCantidad(id, delta) {
  let carrito = obtenerCarrito();
  const item = carrito.find(function (p) { return p.id === id; });
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter(function (p) { return p.id !== id; });
  }
  guardarCarrito(carrito);
}

function quitarDelCarrito(id) {
  const carrito = obtenerCarrito().filter(function (p) { return p.id !== id; });
  guardarCarrito(carrito);
}

function vaciarCarrito() {
  guardarCarrito([]);
}

// Se llama desde el botón "X" del carrito. A diferencia del
// botón de minimizar (que solo cierra el panel y no toca los
// datos), este SÍ borra todos los productos — por eso pide
// confirmación antes, para que un clic accidental no borre un
// pedido que el cliente ya armó.
function confirmarVaciarCarrito() {
  const carrito = obtenerCarrito();
  if (carrito.length === 0) return;
  if (window.confirm("¿Vaciar tu carrito? Se eliminarán todos los productos.")) {
    vaciarCarrito();
  }
}

function calcularTotalCarrito(carrito) {
  return carrito.reduce(function (acc, item) { return acc + item.precio * item.cantidad; }, 0);
}

function actualizarBadgeCarrito() {
  const cantidad = obtenerCarrito().reduce(function (acc, item) { return acc + item.cantidad; }, 0);
  document.querySelectorAll(".carrito-contador").forEach(function (el) {
    el.textContent = cantidad;
    el.style.display = cantidad > 0 ? "flex" : "none";
  });
}

function abrirCarrito() {
  const offcanvasEl = document.getElementById("offcanvasCarrito");
  if (!offcanvasEl || typeof bootstrap === "undefined") return;
  bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl).show();
}

function renderizarCarrito() {
  const contenedor = document.getElementById("carritoItems");
  const vacio = document.getElementById("carritoVacio");
  const totalEl = document.getElementById("carritoTotal");
  if (!contenedor) return; // el panel del carrito aún no se insertó en esta página

  const carrito = obtenerCarrito();

  if (carrito.length === 0) {
    contenedor.innerHTML = "";
    if (vacio) vacio.style.display = "block";
  } else {
    if (vacio) vacio.style.display = "none";
    contenedor.innerHTML = carrito.map(function (item) {
      return (
        '<div class="carrito-item d-flex align-items-center gap-3 py-3 border-bottom border-secondary">' +
          '<img src="' + item.imagen + '" class="carrito-item-img" alt="' + item.nombre + '">' +
          '<div class="flex-grow-1">' +
            '<div class="fw-bold">' + item.nombre + '</div>' +
            '<div class="text-warning">' + formatearPrecio(item.precio) + ' c/u</div>' +
            '<div class="d-flex align-items-center gap-2 mt-1">' +
              '<button type="button" class="btn-qty" onclick="cambiarCantidad(\'' + item.id + '\', -1)">−</button>' +
              '<span>' + item.cantidad + '</span>' +
              '<button type="button" class="btn-qty" onclick="cambiarCantidad(\'' + item.id + '\', 1)">+</button>' +
              '<button type="button" class="btn-quitar ms-2" onclick="quitarDelCarrito(\'' + item.id + '\')" title="Quitar">' +
                '<i class="bi bi-trash"></i>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="fw-bold">' + formatearPrecio(item.precio * item.cantidad) + '</div>' +
        '</div>'
      );
    }).join("");
  }

  if (totalEl) totalEl.textContent = formatearPrecio(calcularTotalCarrito(carrito));
}

function construirMensajePedido(carrito) {
  let mensaje = "¡Hola Licorería Don David! 👋 Quiero hacer este pedido:\n\n";
  carrito.forEach(function (item) {
    mensaje += "• " + item.nombre + " x" + item.cantidad + " — " + formatearPrecio(item.precio * item.cantidad) + "\n";
  });
  mensaje += "\n💰 Total: " + formatearPrecio(calcularTotalCarrito(carrito));
  mensaje += "\n\nQuedo atento para coordinar el pago y la entrega. ¡Gracias!";
  return mensaje;
}

function enviarPedidoWhatsApp() {
  const carrito = obtenerCarrito();
  if (carrito.length === 0) return;

  // Si Supabase ya está configurado, esto además deja un
  // registro del pedido en la tabla "pedidos". Si falla o no
  // está configurado todavía, el pedido por WhatsApp se envía
  // igual: nunca depende de que la base de datos funcione.
  registrarPedidoEnSupabase(carrito);

  const mensaje = construirMensajePedido(carrito);
  const url = "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(mensaje);
  window.open(url, "_blank");
}

// Conecta cada botón con la clase .btn-agregar-carrito, sin
// importar en qué página o en qué momento se creó (funciona
// tanto para los botones que ya estaban en el HTML como para
// los que la grilla de productos genera por JavaScript).
function conectarBotonesAgregar() {
  document.querySelectorAll(".btn-agregar-carrito").forEach(function (boton) {
    if (boton.dataset.conectado === "si") return; // evita conectar el mismo botón dos veces
    boton.dataset.conectado = "si";

    boton.addEventListener("click", function () {
      const contenedorAcciones = boton.closest(".producto-acciones");
      const inputCantidad = contenedorAcciones ? contenedorAcciones.querySelector(".input-cantidad") : null;
      const cantidad = inputCantidad ? Math.max(1, parseInt(inputCantidad.value, 10) || 1) : 1;

      agregarAlCarrito({
        id: boton.dataset.id,
        nombre: boton.dataset.nombre,
        precio: parseFloat(boton.dataset.precio),
        imagen: boton.dataset.imagen
      }, cantidad);

      const textoOriginal = boton.innerHTML;
      boton.innerHTML = "✓ Agregado";
      boton.disabled = true;
      setTimeout(function () {
        boton.innerHTML = textoOriginal;
        boton.disabled = false;
      }, 1200);
    });
  });
}

function ajustarInputCantidad(boton, delta) {
  const input = boton.parentElement.querySelector(".input-cantidad");
  if (!input) return;
  input.value = Math.max(1, (parseInt(input.value, 10) || 1) + delta);
}

function inicializarCarrito() {
  actualizarBadgeCarrito();
  renderizarCarrito();
  conectarBotonesAgregar();

  const btnEnviar = document.getElementById("btnEnviarPedido");
  if (btnEnviar) btnEnviar.addEventListener("click", enviarPedidoWhatsApp);
}
