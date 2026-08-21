const WHATSAPP_NUMERO = "51986708039"; 

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
  window.close();
  window.location.href = "https://www.google.com";
}

window.addEventListener("load", function () {
  const aviso = document.getElementById("avisoEdad");
  if (!aviso) return;

  const yaConfirmado = sessionStorage.getItem("edadConfirmada") === "si";
  if (yaConfirmado && !esRecarga()) {
    aviso.style.display = "none";
  }
});

// ------------------------------------------------------------
// BUSCADOR
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
// CARRUSEL DE INICIO
// ------------------------------------------------------------
function renderizarCarrusel() {
  const indicadores = document.getElementById("carouselIndicadores");
  const contenido = document.getElementById("carouselContenido");
  if (!indicadores || !contenido) return;

  const destacados = PRODUCTOS.filter(function (p) { return p.en_carrusel; });
  if (destacados.length === 0) return;

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
// GRILLA DE PRODUCTOS
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

  conectarBotonesAgregar();
}

// ------------------------------------------------------------
// BOTÓN "VOLVER ARRIBA"
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
// SUPABASE
// ------------------------------------------------------------
function supabaseConfigurado() {
  return SUPABASE_URL.indexOf("http") === 0 && SUPABASE_ANON_KEY.length > 20;
}

let CONFIG_NEGOCIO = {
  direccion: "Jr. Cajamarca 170, Villa María del Triunfo",
  telefono: "+51 986 708 039",
  horario: "Lunes - Domingo | 10:00 AM - 11:00 PM",
  descripcion: "Somos Licorería Don David, una empresa dedicada a ofrecer bebidas de calidad para tus mejores momentos.",
  logo_url: null,
  maps_url: null
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
      descripcion: data.descripcion || CONFIG_NEGOCIO.descripcion,
      logo_url: data.logo_url || null,
      maps_url: data.maps_url || null
    };

    aplicarConfiguracionNegocio();
  } catch (e) {
    console.warn("Error cargando configuración del negocio:", e);
  }
}

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

  const logo = document.getElementById("logoIcono");
  if (logo && CONFIG_NEGOCIO.logo_url) {
    logo.innerHTML = '<img src="' + CONFIG_NEGOCIO.logo_url + '" style="width:32px;height:32px;object-fit:cover;border-radius:6px;" alt="Logo">';
  }

  const mapa = document.getElementById("mapaUbicacion");
  if (mapa) {
    mapa.src = CONFIG_NEGOCIO.maps_url || ("https://www.google.com/maps?q=" + encodeURIComponent(CONFIG_NEGOCIO.direccion) + "&output=embed");
  }

  if (typeof insertarMenuContacto === "function") insertarMenuContacto();
}

// ------------------------------------------------------------
// SECCIONES EDITABLES
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
// ARRANQUE
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