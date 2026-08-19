/* ============================================================
   LICORERÍA DON DAVID — catalogo.js
   ============================================================
   Filtro por categoría + búsqueda de catalogo.html. Reutiliza
   el mismo arreglo PRODUCTOS que usan el carrito y la
   calculadora, así que en cuanto Supabase esté activo, el
   catálogo automáticamente muestra todo lo que David cargue
   desde el panel, sin cambiar nada de este código.
   ============================================================ */

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

    const botonVer = '<a href="' + p.pagina + '" class="btn btn-sm btn-producto">Ver</a>';

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
