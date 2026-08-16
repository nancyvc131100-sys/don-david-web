/* ============================================================
   LICORERÍA DON DAVID — script.js
   ============================================================
   Este archivo ya NO tiene todo el código del sitio — se dividió
   en piezas más chicas, cada una con una sola responsabilidad:

     carrito.js      → carrito de compras
     calculadora.js  → "¿Cuánto debo comprar?"
     catalogo.js     → filtro/búsqueda de catalogo.html
     producto.js     → plantilla de producto.html?id=X

   Este script.js se queda con lo que TODOS los demás
   necesitan: el catálogo de datos (PRODUCTOS), el formato de
   precio, el aviso de edad, el buscador del inicio, el
   carrusel, la grilla de "Productos destacados", la conexión
   con Supabase, y el arranque que llama a cada módulo. Por eso
   sus <script> deben cargarse ANTES que este archivo en el
   HTML — así, cuando el navegador llega hasta acá y arranca
   todo, las funciones de los demás módulos ya existen.
   ============================================================ */

// ------------------------------------------------------------
// CONFIGURACIÓN GENERAL
// ------------------------------------------------------------
const WHATSAPP_NUMERO = "51986708039"; // mismo número que ya usaban los botones de compra directa

// Catálogo de productos: la fuente única de verdad.
// Hoy está escrito a mano. Cuando termines de configurar
// Supabase más abajo (busca SUPABASE_URL), esta misma variable
// se reemplaza automáticamente con los datos de tu base de
// datos, y el carrito, la calculadora y la grilla de productos
// siguen funcionando exactamente igual, sin tocar nada más.
let PRODUCTOS = [
  { id: "whisky",   nombre: "Whisky Premium",    categoria: "whisky",  precio: 120.00, imagen: "/imagenes/wizky.jpg",   imagen_banner_url: "/imagenes/banner.jpg",       pagina: "/producto.html?id=whisky",  etiqueta: "mas_vendido", en_carrusel: true,
    descripcion: "Whisky seleccionado de excelente calidad, perfecto para celebraciones y reuniones." },
  { id: "vino",     nombre: "Vino Reserva",      categoria: "vino",    precio: 60.00,  imagen: "/imagenes/vinoki.jpg",  imagen_banner_url: "/imagenes/vinoobanner.jpg",  pagina: "/producto.html?id=vino",    etiqueta: "recomendado", en_carrusel: true,
    descripcion: "Vino seleccionado de excelente calidad, perfecto para cenas y momentos especiales." },
  { id: "cerveza",  nombre: "Cerveza Artesanal", categoria: "cerveza", precio: 15.00,  imagen: "/imagenes/cerbeza.jpg", imagen_banner_url: "/imagenes/cervezabanner.jpg", pagina: "/producto.html?id=cerveza", etiqueta: null, en_carrusel: true,
    descripcion: "Cerveza artesanal con excelente sabor, ideal para compartir con amigos." },
  { id: "pisco",    nombre: "Pisco Peruano",     categoria: "pisco",   precio: 50.00,  imagen: "/imagenes/piscano.png", imagen_banner_url: "/imagenes/piscobanner.jpg",  pagina: "/producto.html?id=pisco",   etiqueta: "nuevo", precio_oferta: 42.00, en_carrusel: true,
    descripcion: "Pisco peruano de calidad, perfecto para preparar cócteles." }
];

function formatearPrecio(valor) {
  return "S/ " + valor.toFixed(2);
}

// ------------------------------------------------------------
// AVISO DE EDAD — aparece siempre que se RECARGA la página
// (F5 / botón de recargar), pero ya NO cuando se llega
// navegando desde otra página del sitio (por ejemplo, "Volver
// al inicio" desde el catálogo) durante la misma sesión del
// navegador. Usa sessionStorage (se borra al cerrar la
// pestaña) en vez de localStorage (que no se borraba nunca) —
// eso es lo que permite la distinción.
// ------------------------------------------------------------
function esRecarga() {
  try {
    const entradas = performance.getEntriesByType("navigation");
    if (entradas.length > 0) return entradas[0].type === "reload";
  } catch (e) {}
  return !!(performance.navigation && performance.navigation.type === 1); // respaldo para navegadores muy viejos
}

function aceptarEdad() {
  sessionStorage.setItem("edadConfirmada", "si");
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

window.addEventListener("load", function () {
  const aviso = document.getElementById("avisoEdad");
  if (!aviso) return;

  const yaConfirmado = sessionStorage.getItem("edadConfirmada") === "si";
  if (yaConfirmado && !esRecarga()) {
    aviso.style.display = "none"; // llegó navegando desde otra página, ya lo había confirmado
  }
  // si es recarga (F5), o si nunca lo confirmó en esta sesión,
  // no se toca nada — el aviso se queda visible por defecto.
});

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
// CARRUSEL DE INICIO — se arma solo con los productos que
// tengan en_carrusel = true (el checkbox "Mostrar en el
// carrusel de inicio" del panel). Usa imagen_banner_url si el
// producto tiene una foto ancha específica para el carrusel;
// si no, usa la misma imagen del catálogo.
// ------------------------------------------------------------
function renderizarCarrusel() {
  const indicadores = document.getElementById("carouselIndicadores");
  const contenido = document.getElementById("carouselContenido");
  if (!indicadores || !contenido) return; // esta página no tiene carrusel

  const destacados = PRODUCTOS.filter(function (p) { return p.en_carrusel; });
  if (destacados.length === 0) return; // no se toca nada: mejor dejar el último carrusel válido que uno vacío

  indicadores.innerHTML = destacados.map(function (p, i) {
    return '<button type="button" data-bs-target="#carouselLicoreria" data-bs-slide-to="' + i + '"' + (i === 0 ? ' class="active"' : '') + '></button>';
  }).join("");

  contenido.innerHTML = destacados.map(function (p, i) {
    const imagenCarrusel = p.imagen_banner_url || p.imagen;
    return (
      '<div class="carousel-item' + (i === 0 ? ' active' : '') + '">' +
        '<img src="' + imagenCarrusel + '" class="d-block w-100 hero-img">' +
        '<div class="carousel-caption">' +
          '<h1>' + p.nombre + '</h1>' +
          '<p>' + (p.descripcion || '') + '</p>' +
          '<a href="' + p.pagina + '" class="btn btn-warning btn-lg">Comprar ahora</a>' +
        '</div>' +
      '</div>'
    );
  }).join("");
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
  // carrito los vuelva a conectar (esa función vive en carrito.js).
  conectarBotonesAgregar();
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
        en_carrusel: !!p.en_carrusel,
        imagen: p.imagen_url || "/imagenes/banner.jpg",
        imagen_banner_url: p.imagen_banner_url || null,
        descripcion: p.descripcion || "",
        pagina: "/producto.html?id=" + p.id
      };
    });

    // Cada una de estas funciones vive en su propio archivo
    // (carrusel/grilla acá mismo, catálogo en catalogo.js,
    // página de producto en producto.js) — todas ya existen
    // para cuando esto se ejecuta, porque sus <script> se
    // cargan antes que este.
    renderizarGrillaProductos();
    renderizarCatalogo();
    renderizarPaginaProducto();
    renderizarCarrusel();
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
// ARRANQUE — llama al init de cada módulo. Si una página no
// tiene el elemento que cierto módulo necesita (por ejemplo,
// catalogo.js en producto.html), esa función simplemente no
// hace nada — no hace falta que este arranque sepa en qué
// página está.
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  inicializarBuscador();
  renderizarCarrusel();
  renderizarGrillaProductos();
  inicializarCarrito();
  inicializarCalculadora();
  inicializarCatalogo();
  renderizarPaginaProducto();
  cargarProductosDesdeSupabase();
});

console.log("SCRIPT CARGADO");
