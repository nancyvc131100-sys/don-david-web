/* ============================================================
   LICORERÍA DON DAVID — script.js
   ============================================================
   Este archivo se carga en TODAS las páginas del sitio
   (index.html y paginas/*.html). Por eso cada función revisa
   primero si el elemento que necesita existe antes de usarlo:
   así el mismo script.js no se rompe en una página que no
   tiene, por ejemplo, la calculadora.
   ============================================================ */

// ------------------------------------------------------------
// CONFIGURACIÓN GENERAL
// ------------------------------------------------------------
const WHATSAPP_NUMERO = "51986708039"; // mismo número que ya usaban los botones de compra directa
const CARRITO_STORAGE_KEY = "donDavidCarrito";

// Catálogo de productos: la fuente única de verdad.
// Hoy está escrito a mano. Cuando termines de configurar
// Supabase más abajo (busca SUPABASE_URL), esta misma variable
// se reemplaza automáticamente con los datos de tu base de
// datos, y el carrito, la calculadora y la grilla de productos
// siguen funcionando exactamente igual, sin tocar nada más.
let PRODUCTOS = [
  { id: "whisky",   nombre: "Whisky Premium",    categoria: "whisky",  precio: 120.00, imagen: "/imagenes/wizky.jpg",   pagina: "/paginas/whisky.html",  etiqueta: "mas_vendido",
    descripcion: "Whisky seleccionado de excelente calidad, perfecto para celebraciones y reuniones." },
  { id: "vino",     nombre: "Vino Reserva",      categoria: "vino",    precio: 60.00,  imagen: "/imagenes/vinoki.jpg",  pagina: "/paginas/vino.html",    etiqueta: "recomendado",
    descripcion: "Vino seleccionado de excelente calidad, perfecto para cenas y momentos especiales." },
  { id: "cerveza",  nombre: "Cerveza Artesanal", categoria: "cerveza", precio: 15.00,  imagen: "/imagenes/cerbeza.jpg", pagina: "/paginas/cerveza.html", etiqueta: null,
    descripcion: "Cerveza artesanal con excelente sabor, ideal para compartir con amigos." },
  { id: "pisco",    nombre: "Pisco Peruano",     categoria: "pisco",   precio: 50.00,  imagen: "/imagenes/piscano.png", pagina: "/paginas/pisco.html",   etiqueta: "nuevo", precio_oferta: 42.00,
    descripcion: "Pisco peruano de calidad, perfecto para preparar cócteles." }
];

// Categorías que ya tienen su propia página de detalle (paginas/*.html).
// El catálogo puede mostrar productos de OTRAS categorías (una vez
// conectado a Supabase) que todavía no tienen una página propia — para
// esos casos no se muestra el botón "Ver", solo "Agregar al carrito".
const CATEGORIAS_CON_PAGINA_PROPIA = ["whisky", "vino", "cerveza", "pisco"];

function formatearPrecio(valor) {
  return "S/ " + valor.toFixed(2);
}

// ------------------------------------------------------------
// AVISO DE EDAD — antes se recordaba entre visitas con
// localStorage (el código original de tu equipo). Ahora, a
// pedido, aparece siempre que se carga o recarga la página, sin
// excepción: por eso ya no queda ningún "recordar" acá, y el
// aviso simplemente se muestra por defecto (así lo define el
// CSS de #avisoEdad) hasta que el visitante elige una opción.
// ------------------------------------------------------------
function aceptarEdad() {
  const aviso = document.getElementById("avisoEdad");
  if (aviso) aviso.style.display = "none";
}

function rechazarEdad() {
  // No hay forma 100% confiable de cerrar una pestaña que el
  // visitante abrió por su cuenta (los navegadores lo bloquean
  // por seguridad, salvo que la haya abierto un script). Por
  // eso primero se intenta cerrar, y si el navegador lo impide,
  // el redirect de abajo se ejecuta igual y saca al visitante
  // del sitio de todas formas.
  window.close();
  window.location.href = "https://www.google.com";
}

// ------------------------------------------------------------
// BUSCADOR (ya existía; ahora solo filtra las tarjetas de
// productos, no cualquier tarjeta de la página)
// ------------------------------------------------------------
function inicializarBuscador() {
  const buscador = document.getElementById("buscador");
  if (!buscador) return;

  buscador.addEventListener("keyup", function () {
    const texto = buscador.value.toLowerCase();
    const productos = document.querySelectorAll("#productos .producto-card");
    productos.forEach(function (tarjeta) {
      const nombre = tarjeta.textContent.toLowerCase();
      const columna = tarjeta.closest(".col-md-3") || tarjeta;
      columna.style.display = nombre.includes(texto) ? "" : "none";
    });
  });
}

// ------------------------------------------------------------
// GRILLA DE PRODUCTOS — pinta las tarjetas de "Productos
// destacados" a partir del arreglo PRODUCTOS (solo existe en
// index.html; en las demás páginas grillaProductos es null y
// la función no hace nada).
// ------------------------------------------------------------
function renderizarGrillaProductos() {
  const grilla = document.getElementById("grillaProductos");
  if (!grilla) return;

  grilla.innerHTML = PRODUCTOS.map(function (p) {
    return (
      '<div class="col-md-3">' +
        '<div class="card producto-card">' +
          '<img src="' + p.imagen + '" class="card-img-top">' +
          '<div class="card-body text-center">' +
            '<h5 class="card-title">' + p.nombre + '</h5>' +
            '<p>' + formatearPrecio(p.precio) + '</p>' +
            '<div class="d-flex gap-2 justify-content-center flex-wrap">' +
              '<a href="' + p.pagina + '" class="btn btn-producto">Ver producto</a>' +
              '<button type="button" class="btn btn-producto btn-agregar-carrito" ' +
                'data-id="' + p.id + '" data-nombre="' + p.nombre + '" ' +
                'data-precio="' + p.precio + '" data-imagen="' + p.imagen + '">' +
                '🛒 Agregar' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join("");

  // Los botones "Agregar" recién creados necesitan que el
  // carrito los vuelva a conectar.
  conectarBotonesAgregar();
}

// ------------------------------------------------------------
// CARRITO
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// CALCULADORA: ¿CUÁNTO DEBO COMPRAR?
// ------------------------------------------------------------
// Regla usada (la misma que manejan la mayoría de guías de
// eventos): cada invitado toma en promedio 1 trago durante la
// primera hora, y luego el ritmo baja a ~0.5 tragos por cada
// hora adicional. Esos tragos totales se dividen entre cuántas
// porciones rinde una botella de 750ml de cada bebida. Es una
// referencia para orientar la compra, no una cifra exacta.
const TRAGOS_POR_BOTELLA = {
  vino: 5,      // copa de ~150ml
  whisky: 12,   // trago mixto de ~60ml
  pisco: 12,    // pisco sour o trago simple
  cerveza: 1    // cada botella ya es una porción individual
};

function calcularBotellasNecesarias(invitados, horas, tipo) {
  const horasExtra = Math.max(0, horas - 1);
  const tragosPorPersona = 1 + horasExtra * 0.5;
  const tragosTotales = invitados * tragosPorPersona;
  return Math.ceil(tragosTotales / TRAGOS_POR_BOTELLA[tipo]);
}

function inicializarCalculadora() {
  const btnCalcular = document.getElementById("btnCalcular");
  if (!btnCalcular) return;

  btnCalcular.addEventListener("click", function () {
    const invitados = Math.max(1, parseInt(document.getElementById("calcInvitados").value, 10) || 1);
    const horas = Math.max(1, parseInt(document.getElementById("calcHoras").value, 10) || 1);
    const tipo = document.getElementById("calcTipo").value;

    const producto = PRODUCTOS.find(function (p) { return p.categoria === tipo; });
    const botellas = calcularBotellasNecesarias(invitados, horas, tipo);
    const costoAprox = producto ? botellas * producto.precio : null;

    const resultado = document.getElementById("resultadoCalculadora");
    resultado.style.display = "block";
    resultado.innerHTML =
      '<p class="mb-2">Para <strong>' + invitados + ' invitados</strong> durante <strong>' + horas + ' horas</strong>, ' +
      'te recomendamos <strong>' + botellas + ' botella' + (botellas === 1 ? "" : "s") + '</strong>' +
      (producto ? ' de ' + producto.nombre : '') +
      (costoAprox !== null ? ' (aprox. ' + formatearPrecio(costoAprox) + ')' : '') + '.</p>' +
      '<p class="text-secondary mb-3" style="font-size:14px;">Es una referencia — ajusta según cuánto suelan tomar tus invitados. Bebe con responsabilidad 🍷</p>' +
      (producto
        ? '<button type="button" class="btn btn-warning" id="btnAgregarCalculadora">🛒 Agregar ' + botellas + ' al carrito</button>'
        : '');

    const btnAgregar = document.getElementById("btnAgregarCalculadora");
    if (btnAgregar && producto) {
      btnAgregar.addEventListener("click", function () {
        agregarAlCarrito({ id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen }, botellas);
      });
    }
  });
}

// ------------------------------------------------------------
// CATÁLOGO COMPLETO — filtro por categoría + búsqueda, en
// catalogo.html. Reutiliza el mismo arreglo PRODUCTOS que usan
// el carrito y la calculadora, así que en cuanto Supabase esté
// activo, el catálogo automáticamente muestra todo lo que David
// cargue desde el panel, sin cambiar nada de este código.
// ------------------------------------------------------------
const CATEGORIAS_CATALOGO = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "cerveza", etiqueta: "🍺 Cerveza" },
  { valor: "whisky", etiqueta: "🥃 Whisky" },
  { valor: "ron", etiqueta: "🍶 Ron" },
  { valor: "vodka", etiqueta: "🍸 Vodka" },
  { valor: "pisco", etiqueta: "🍾 Pisco" },
  { valor: "tequila", etiqueta: "🌵 Tequila" },
  { valor: "vino", etiqueta: "🍷 Vino" },
  { valor: "espumante", etiqueta: "🥂 Espumante" },
  { valor: "energizante", etiqueta: "⚡ Energizante" },
  { valor: "gaseosa", etiqueta: "🥤 Gaseosa" },
  { valor: "agua", etiqueta: "💧 Agua" }
];

const ETIQUETAS_BADGE = {
  mas_vendido: { texto: "Más vendido", clase: "bg-danger" },
  recomendado: { texto: "Recomendado", clase: "bg-warning text-dark" },
  nuevo: { texto: "Nuevo", clase: "bg-success" }
};

let filtroCategoriaActual = "todos";

function renderizarFiltrosCategoria() {
  const contenedor = document.getElementById("filtrosCategoria");
  if (!contenedor) return;

  contenedor.innerHTML = CATEGORIAS_CATALOGO.map(function (cat) {
    const activa = cat.valor === filtroCategoriaActual ? " activa" : "";
    return '<button type="button" class="pildora-categoria' + activa + '" data-categoria="' + cat.valor + '">' + cat.etiqueta + '</button>';
  }).join("");

  contenedor.querySelectorAll(".pildora-categoria").forEach(function (boton) {
    boton.addEventListener("click", function () {
      filtroCategoriaActual = boton.dataset.categoria;
      renderizarFiltrosCategoria();
      renderizarCatalogo();
    });
  });
}

function renderizarCatalogo() {
  const grilla = document.getElementById("grillaCatalogo");
  if (!grilla) return; // esta página no es catalogo.html

  const buscador = document.getElementById("buscadorCatalogo");
  const texto = buscador ? buscador.value.toLowerCase() : "";

  const filtrados = PRODUCTOS.filter(function (p) {
    const coincideCategoria = filtroCategoriaActual === "todos" || p.categoria === filtroCategoriaActual;
    const coincideTexto = p.nombre.toLowerCase().indexOf(texto) !== -1;
    return coincideCategoria && coincideTexto;
  });

  const sinResultados = document.getElementById("catalogoSinResultados");

  if (filtrados.length === 0) {
    grilla.innerHTML = "";
    if (sinResultados) sinResultados.style.display = "block";
    return;
  }
  if (sinResultados) sinResultados.style.display = "none";

  grilla.innerHTML = filtrados.map(function (p) {
    const badgeInfo = p.etiqueta ? ETIQUETAS_BADGE[p.etiqueta] : null;
    const badgeHTML = badgeInfo
      ? '<span class="badge ' + badgeInfo.clase + ' badge-catalogo">' + badgeInfo.texto + '</span>'
      : '';

    const precioHTML = p.precio_oferta
      ? '<span class="text-decoration-line-through text-secondary me-2" style="font-size:14px;">' + formatearPrecio(p.precio) + '</span><span class="text-danger fw-bold">' + formatearPrecio(p.precio_oferta) + '</span>'
      : '<span>' + formatearPrecio(p.precio) + '</span>';

    const tieneDetalle = CATEGORIAS_CON_PAGINA_PROPIA.indexOf(p.categoria) !== -1;
    const botonVer = tieneDetalle ? '<a href="' + p.pagina + '" class="btn btn-sm btn-producto">Ver</a>' : '';

    return (
      '<div class="col-6 col-md-4 col-lg-3">' +
        '<div class="card producto-card h-100 position-relative">' +
          badgeHTML +
          '<img src="' + p.imagen + '" class="card-img-top">' +
          '<div class="card-body text-center">' +
            '<h6 class="card-title">' + p.nombre + '</h6>' +
            '<p class="mb-2">' + precioHTML + '</p>' +
            '<div class="d-flex gap-2 justify-content-center flex-wrap">' +
              botonVer +
              '<button type="button" class="btn btn-sm btn-producto btn-agregar-carrito" ' +
                'data-id="' + p.id + '" data-nombre="' + p.nombre + '" ' +
                'data-precio="' + (p.precio_oferta || p.precio) + '" data-imagen="' + p.imagen + '">🛒</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join("");

  conectarBotonesAgregar();
}

function inicializarCatalogo() {
  if (!document.getElementById("grillaCatalogo")) return;
  renderizarFiltrosCategoria();
  renderizarCatalogo();

  const buscador = document.getElementById("buscadorCatalogo");
  if (buscador) buscador.addEventListener("keyup", renderizarCatalogo);
}

// ------------------------------------------------------------
// PÁGINA DE PRODUCTO (plantilla única) — producto.html?id=X
// Reemplaza tener un archivo .html distinto por cada producto
// (whisky.html, vino.html...). Lee el id de la URL, busca ese
// producto en PRODUCTOS, y llena la plantilla. Si más adelante
// agregan un producto nuevo desde Supabase, ya tiene página de
// detalle automáticamente — no hay que crear ningún archivo.
// ------------------------------------------------------------
function renderizarPaginaProducto() {
  const contenedor = document.getElementById("pp-contenido");
  if (!contenedor) return; // esta página no es producto.html

  const parametros = new URLSearchParams(window.location.search);
  const id = parametros.get("id");
  const producto = PRODUCTOS.find(function (p) { return p.id === id; });

  const noEncontrado = document.getElementById("pp-no-encontrado");

  if (!producto) {
    contenedor.style.display = "none";
    if (noEncontrado) noEncontrado.style.display = "block";
    return;
  }

  contenedor.style.display = "";
  if (noEncontrado) noEncontrado.style.display = "none";

  document.title = producto.nombre + " - Licorería Don David";

  const imagenEl = document.getElementById("pp-imagen");
  imagenEl.src = producto.imagen;
  imagenEl.alt = producto.nombre;

  document.getElementById("pp-nombre").textContent = producto.nombre;
  document.getElementById("pp-descripcion").textContent = producto.descripcion || "";

  const precioEl = document.getElementById("pp-precio");
  const precioFinal = producto.precio_oferta || producto.precio;
  precioEl.innerHTML = producto.precio_oferta
    ? '<span class="text-decoration-line-through text-secondary me-2" style="font-size:20px;">' + formatearPrecio(producto.precio) + '</span><span class="text-danger">' + formatearPrecio(producto.precio_oferta) + '</span>'
    : formatearPrecio(producto.precio);

  const btnAgregar = document.getElementById("pp-btn-agregar");
  btnAgregar.dataset.id = producto.id;
  btnAgregar.dataset.nombre = producto.nombre;
  btnAgregar.dataset.precio = precioFinal;
  btnAgregar.dataset.imagen = producto.imagen;
  conectarBotonesAgregar();

  const mensaje = encodeURIComponent("Hola Licorería Don David, quiero comprar " + producto.nombre + " de " + formatearPrecio(precioFinal));
  document.getElementById("pp-whatsapp").href = "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + mensaje;
}

// ------------------------------------------------------------
// SUPABASE (opcional) — el sitio funciona perfectamente sin
// esto, usando el arreglo PRODUCTOS de arriba. SUPABASE_URL y
// SUPABASE_ANON_KEY ya NO viven en este archivo: están en
// config.js (que se carga antes que este script.js en el
// HTML), para que tus credenciales reales no se pisen cada vez
// que actualizo el resto del código.
// ------------------------------------------------------------
function supabaseConfigurado() {
  return SUPABASE_URL.indexOf("http") === 0 && SUPABASE_ANON_KEY.length > 20;
}

async function cargarProductosDesdeSupabase() {
  if (!supabaseConfigurado() || typeof window.supabase === "undefined") return;

  try {
    const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const resultado = await cliente.from("productos").select("*").eq("activo", true);

    if (resultado.error) {
      console.warn("Supabase respondió con un error (revisa URL/clave/políticas RLS):", resultado.error);
      return;
    }
    if (!resultado.data || resultado.data.length === 0) {
      console.warn("Supabase conectó bien pero no devolvió productos activos. ¿Corriste supabase/schema.sql?");
      return;
    }

    PRODUCTOS = resultado.data.map(function (p) {
      return {
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        precio: parseFloat(p.precio),
        precio_oferta: p.precio_oferta ? parseFloat(p.precio_oferta) : null,
        etiqueta: p.etiqueta || null,
        imagen: p.imagen_url || "/imagenes/banner.jpg",
        pagina: "/paginas/" + p.categoria + ".html"
      };
    });

    renderizarGrillaProductos();
    renderizarCatalogo();
    renderizarPaginaProducto();
    console.log("✅ Catálogo cargado desde Supabase:", PRODUCTOS.length, "producto(s)");
  } catch (e) {
    console.warn("No se pudo cargar el catálogo desde Supabase; se usa el catálogo local.", e);
  }
}

async function registrarPedidoEnSupabase(carrito) {
  if (!supabaseConfigurado() || typeof window.supabase === "undefined") return;

  try {
    const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await cliente.from("pedidos").insert({
      items: carrito,
      total: calcularTotalCarrito(carrito)
    });
  } catch (e) {
    console.warn("No se pudo registrar el pedido en Supabase (el pedido por WhatsApp se envía igual).", e);
  }
}

// ------------------------------------------------------------
// BOTÓN "VOLVER ARRIBA" — en index.html hace scroll suave (como
// antes); en las páginas de producto navega a index.html#inicio,
// porque ahí #inicio no existe.
// ------------------------------------------------------------
function volverArriba(event) {
  const enInicio = window.location.pathname === "/" || window.location.pathname.endsWith("/index.html");
  const destino = document.getElementById("inicio");
  if (enInicio && destino) {
    event.preventDefault();
    destino.scrollIntoView({ behavior: "smooth" });
  }
}

// ------------------------------------------------------------
// ARRANQUE
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  inicializarBuscador();
  renderizarGrillaProductos();
  inicializarCarrito();
  inicializarCalculadora();
  inicializarCatalogo();
  renderizarPaginaProducto();
  cargarProductosDesdeSupabase();
});

console.log("SCRIPT CARGADO");
