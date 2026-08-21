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
// FORMATEAR DESCRIPCIÓN — convierte el formato simple que se
// escribe en el panel (**negrita**, líneas que empiezan con
// "- " para viñetas) en HTML de verdad, para mostrarlo en
// producto.html. Escapa el texto primero, así que aunque
// alguien escriba algo parecido a una etiqueta HTML en la
// descripción, no se interpreta como código.
// ------------------------------------------------------------
function formatearDescripcionHTML(texto) {
  if (!texto) return "";

  const escapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lineas = escapado.split("\n");
  let html = "";
  let dentroDeLista = false;

  lineas.forEach(function (linea) {
    const esItem = linea.trim().indexOf("- ") === 0;
    if (esItem) {
      if (!dentroDeLista) { html += "<ul>"; dentroDeLista = true; }
      html += "<li>" + linea.trim().slice(2) + "</li>";
    } else {
      if (dentroDeLista) { html += "</ul>"; dentroDeLista = false; }
      if (linea.trim() !== "") html += "<p>" + linea + "</p>";
    }
  });
  if (dentroDeLista) html += "</ul>";

  return html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
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
      '<div class="col-6 col-md-3">' +
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

// Datos de contacto del negocio: dirección, teléfono, horario y
// descripción. Empiezan con estos valores por defecto (para que
// el sitio nunca se vea vacío mientras Supabase responde), y se
// reemplazan solos en cuanto cargue lo que se haya guardado
// desde Configuración en el panel.
let CONFIG_NEGOCIO = {
  direccion: "Jr. Cajamarca 170, Villa María del Triunfo",
  telefono: "+51 986 708 039",
  horario: "Lunes - Domingo | 10:00 AM - 11:00 PM",
  descripcion: "Somos Licorería Don David, una empresa dedicada a ofrecer bebidas de calidad para tus mejores momentos."
};

async function cargarConfiguracionNegocio() {
  if (!supabaseConfigurado() || typeof window.supabase === "undefined") return;

  try {
    const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await cliente.from("configuracion_negocio").select("*").eq("id", 1).single();

    if (error || !data) {
      console.warn("No se pudo cargar la configuración del negocio; se usan los valores por defecto.", error);
      return;
    }

    CONFIG_NEGOCIO = {
      direccion: data.direccion || CONFIG_NEGOCIO.direccion,
      telefono: data.telefono || CONFIG_NEGOCIO.telefono,
      horario: data.horario || CONFIG_NEGOCIO.horario,
      descripcion: data.descripcion || CONFIG_NEGOCIO.descripcion
    };

    aplicarConfiguracionNegocio();
  } catch (e) {
    console.warn("Error cargando configuración del negocio:", e);
  }
}

// Escribe CONFIG_NEGOCIO en cada lugar del sitio que lo muestra.
// Si un elemento no existe en la página actual (por ejemplo,
// catalogo.html no tiene "Sobre Nosotros"), simplemente se
// omite — no hace falta que esta función sepa en qué página está.
function aplicarConfiguracionNegocio() {
  const tbTelefono = document.getElementById("topbarTelefono");
  if (tbTelefono) tbTelefono.textContent = CONFIG_NEGOCIO.telefono;
  const tbHorario = document.getElementById("topbarHorario");
  if (tbHorario) tbHorario.textContent = CONFIG_NEGOCIO.horario;

  const nDireccion = document.getElementById("nosotrosDireccion");
  if (nDireccion) nDireccion.textContent = CONFIG_NEGOCIO.direccion;
  const nTelefono = document.getElementById("nosotrosTelefono");
  if (nTelefono) nTelefono.textContent = CONFIG_NEGOCIO.telefono;
  const nHorario = document.getElementById("nosotrosHorario");
  if (nHorario) nHorario.textContent = CONFIG_NEGOCIO.horario;
  const nDescripcion = document.getElementById("quienesSomosTexto");
  if (nDescripcion) nDescripcion.innerHTML = formatearDescripcionHTML(CONFIG_NEGOCIO.descripcion);

  // El menú de contacto lo arma partials.js — se le pide que se
  // vuelva a dibujar ahora que CONFIG_NEGOCIO ya tiene los datos
  // reales, en vez de los valores por defecto.
  if (typeof insertarMenuContacto === "function") insertarMenuContacto();
}

// ------------------------------------------------------------
// SECCIONES EDITABLES — Marcas, Métodos de pago, Por qué
// elegirnos, y Preguntas frecuentes. Las tarjetas de abajo (en
// index.html) empiezan vacías; esta función las llena en cuanto
// Supabase responde. Si algo falla, simplemente no se tocan —
// no hay versión "por defecto" en JS para estas, ya que ya
// están escritas como HTML de respaldo dentro del propio archivo.
// ------------------------------------------------------------
let TARJETAS_SECCIONES = { marca: [], metodo_pago: [], por_que_elegirnos: [] };
let PREGUNTAS_FRECUENTES = [];

function iconoHTML(icono) {
  if (!icono) return "";
  return icono.indexOf("bi-") === 0 ? '<i class="bi ' + icono + '"></i>' : icono;
}

async function cargarSeccionesEditables() {
  if (!supabaseConfigurado() || typeof window.supabase === "undefined") return;

  try {
    const cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const [resTarjetas, resPreguntas] = await Promise.all([
      cliente.from("secciones_tarjetas").select("*").order("orden"),
      cliente.from("preguntas_frecuentes").select("*").order("orden")
    ]);

    if (!resTarjetas.error && resTarjetas.data && resTarjetas.data.length > 0) {
      TARJETAS_SECCIONES = { marca: [], metodo_pago: [], por_que_elegirnos: [] };
      resTarjetas.data.forEach(function (t) {
        if (TARJETAS_SECCIONES[t.seccion]) TARJETAS_SECCIONES[t.seccion].push(t);
      });
      renderizarMarcas();
      renderizarMetodosPago();
      renderizarPorQueElegirnos();
    }

    if (!resPreguntas.error && resPreguntas.data && resPreguntas.data.length > 0) {
      PREGUNTAS_FRECUENTES = resPreguntas.data;
      renderizarPreguntas();
    }
  } catch (e) {
    console.warn("No se pudieron cargar las secciones editables; se usa el contenido escrito en el HTML.", e);
  }
}

function renderizarMarcas() {
  const cont = document.getElementById("grillaMarcas");
  if (!cont || TARJETAS_SECCIONES.marca.length === 0) return;

  cont.innerHTML = TARJETAS_SECCIONES.marca.map(function (m) {
    return (
      '<div class="col-6 col-md-3 mb-4">' +
        '<div class="marca-card">' +
          iconoHTML(m.icono) +
          '<h5>' + m.titulo + '</h5>' +
        '</div>' +
      '</div>'
    );
  }).join("");
}

function renderizarMetodosPago() {
  const cont = document.getElementById("grillaMetodosPago");
  if (!cont || TARJETAS_SECCIONES.metodo_pago.length === 0) return;

  cont.innerHTML = TARJETAS_SECCIONES.metodo_pago.map(function (m) {
    return (
      '<div class="col-6 col-md-3">' +
        '<div class="pago-card">' +
          '<h3>' + iconoHTML(m.icono) + '</h3>' +
          '<h5>' + m.titulo + '</h5>' +
        '</div>' +
      '</div>'
    );
  }).join("");
}

function renderizarPorQueElegirnos() {
  const cont = document.getElementById("grillaPorQueElegirnos");
  if (!cont || TARJETAS_SECCIONES.por_que_elegirnos.length === 0) return;

  cont.innerHTML = TARJETAS_SECCIONES.por_que_elegirnos.map(function (r) {
    return (
      '<div class="col-6 col-md-3 mb-4">' +
        '<div class="card h-100 p-3">' +
          '<h1>' + iconoHTML(r.icono) + '</h1>' +
          '<h5>' + r.titulo + '</h5>' +
          (r.descripcion ? '<p>' + r.descripcion + '</p>' : '') +
        '</div>' +
      '</div>'
    );
  }).join("");
}

function renderizarPreguntas() {
  const cont = document.getElementById("preguntas");
  if (!cont || PREGUNTAS_FRECUENTES.length === 0) return;

  cont.innerHTML = PREGUNTAS_FRECUENTES.map(function (p, i) {
    const idColapso = "pregunta" + i;
    return (
      '<div class="accordion-item">' +
        '<h2 class="accordion-header">' +
          '<button class="accordion-button' + (i === 0 ? '' : ' collapsed') + '" type="button" data-bs-toggle="collapse" data-bs-target="#' + idColapso + '">' +
            p.pregunta +
          '</button>' +
        '</h2>' +
        '<div id="' + idColapso + '" class="accordion-collapse collapse' + (i === 0 ? ' show' : '') + '" data-bs-parent="#preguntas">' +
          '<div class="accordion-body">' + p.respuesta + '</div>' +
        '</div>' +
      '</div>'
    );
  }).join("");
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
  cargarConfiguracionNegocio();
  cargarSeccionesEditables();
});

console.log("SCRIPT CARGADO");