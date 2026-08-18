/* ============================================================
   LICORERÍA DON DAVID — admin/productos.js
   ============================================================
   Gestión real de productos dentro del panel: listar, crear,
   editar, y mover/sacar de la papelera. Vive aparte de admin.js
   (que solo maneja sesión) para que cada pantalla del panel
   tenga su propio archivo, igual que partials.js está separado
   de script.js en el sitio público.
   ============================================================ */

const CATEGORIAS_PANEL = ["cerveza","whisky","ron","vodka","pisco","tequila","vino","espumante","energizante","gaseosa","agua"];

let filtroPanelActual = "todos"; // todos | mas_vendido | oferta | nuevo | papelera
let productosPanelCache = [];

// ------------------------------------------------------------
// CARGA Y FILTRO
// ------------------------------------------------------------
async function cargarProductosPanel() {
  const cliente = clienteSupabase();
  const cargando = document.getElementById("productosPanelCargando");
  if (cargando) cargando.style.display = "block";

  const { data, error } = await cliente.from("productos").select("*").order("creado_en", { ascending: false });

  if (cargando) cargando.style.display = "none";

  if (error) {
    console.error("Error cargando productos del panel:", error);
    return;
  }

  productosPanelCache = data || [];
  renderizarGrillaProductosPanel();
}

function productosFiltrados() {
  const buscador = document.getElementById("buscadorProductosPanel");
  const texto = buscador ? buscador.value.trim().toLowerCase() : "";

  return productosPanelCache.filter(function (p) {
    if (texto && p.nombre.toLowerCase().indexOf(texto) === -1) return false;
    if (filtroPanelActual === "papelera") return p.activo === false;
    if (p.activo === false) return false;
    if (filtroPanelActual === "todos") return true;
    if (filtroPanelActual === "oferta") return !!p.precio_oferta;
    return p.etiqueta === filtroPanelActual;
  });
}

function renderizarPildorasPanel() {
  const contenedor = document.getElementById("pildorasProductosPanel");
  if (!contenedor) return;

  const pildoras = [
    { valor: "todos", etiqueta: "Todos" },
    { valor: "mas_vendido", etiqueta: "Más vendidos" },
    { valor: "oferta", etiqueta: "En oferta" },
    { valor: "nuevo", etiqueta: "Nuevos" },
    { valor: "papelera", etiqueta: "🗑️ Papelera" }
  ];

  contenedor.innerHTML = pildoras.map(function (p) {
    const activa = p.valor === filtroPanelActual ? " activo" : "";
    return '<span class="admin-pill' + activa + '" style="cursor:pointer;" onclick="cambiarFiltroPanel(\'' + p.valor + '\')">' + p.etiqueta + '</span>';
  }).join("");
}

function cambiarFiltroPanel(valor) {
  filtroPanelActual = valor;
  renderizarPildorasPanel();
  renderizarGrillaProductosPanel();
}

function renderizarGrillaProductosPanel() {
  const grilla = document.getElementById("grillaProductosPanel");
  const vacio = document.getElementById("productosPanelVacio");
  if (!grilla) return;

  const lista = productosFiltrados();
  const enPapelera = filtroPanelActual === "papelera";

  if (lista.length === 0) {
    grilla.innerHTML = "";
    if (vacio) vacio.style.display = "block";
    return;
  }
  if (vacio) vacio.style.display = "none";

  const badges = {
    mas_vendido: ["Más vendido", "mas-vendido"],
    recomendado: ["Recomendado", "recomendado"],
    nuevo: ["Nuevo", "nuevo"]
  };

  grilla.innerHTML = lista.map(function (p) {
    const badgeInfo = p.etiqueta && badges[p.etiqueta] ? badges[p.etiqueta] : null;
    const badgeHTML = badgeInfo ? '<span class="admin-badge ' + badgeInfo[1] + '">' + badgeInfo[0] + '</span>' : "";
    const imagenHTML = p.imagen_url
      ? '<img src="' + p.imagen_url + '" style="width:100%;height:100%;object-fit:cover;">'
      : '<i class="bi bi-image"></i>';

    const precioHTML = p.precio_oferta
      ? 'Precio: S/ ' + Number(p.precio).toFixed(2) + '<br><span class="text-secondary" style="font-size:12px;">Oferta: S/ ' + Number(p.precio_oferta).toFixed(2) + '</span>'
      : 'S/ ' + Number(p.precio).toFixed(2);

    const accionesHTML = enPapelera
      ? '<div class="d-flex gap-1 mt-2">' +
          '<button type="button" class="btn btn-sm btn-outline-dark" onclick="restaurarProducto(\'' + p.id + '\')" style="font-size:11px;">Restaurar</button>' +
          '<button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarDefinitivo(\'' + p.id + '\')" style="font-size:11px;">Borrar ya</button>' +
        '</div>'
      : '';

    return (
      '<div class="col-6 col-md-3">' +
        '<div class="admin-product-card" ' + (enPapelera ? '' : 'style="cursor:pointer;" onclick="abrirModalProducto(\'' + p.id + '\')"') + '>' +
          '<div class="admin-product-card-img">' + badgeHTML + imagenHTML + '</div>' +
          '<div class="p-2">' +
            '<p class="mb-1" style="font-size:13px; font-weight:600;">' + p.nombre + '</p>' +
            '<p class="mb-0" style="font-size:13px;">' + precioHTML + '</p>' +
            accionesHTML +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join("");
}

// ------------------------------------------------------------
// MODAL: CREAR / EDITAR
// ------------------------------------------------------------
function abrirModalProducto(id) {
  const producto = id ? productosPanelCache.find(function (p) { return p.id === id; }) : null;

  document.getElementById("formProductoError").style.display = "none";
  document.getElementById("modalProductoTitulo").textContent = producto ? "Editar producto" : "Nuevo producto";
  document.getElementById("fpId").value = producto ? producto.id : "";
  document.getElementById("fpImagenActual").value = producto ? (producto.imagen_url || "") : "";
  document.getElementById("fpNombre").value = producto ? producto.nombre : "";
  document.getElementById("fpCategoria").value = producto ? producto.categoria : CATEGORIAS_PANEL[0];
  document.getElementById("fpPrecio").value = producto ? producto.precio : "";
  document.getElementById("fpDescripcion").value = producto ? (producto.descripcion || "") : "";
  document.getElementById("fpEtiqueta").value = producto ? (producto.etiqueta || "") : "";
  document.getElementById("fpPrecioOferta").value = producto && producto.precio_oferta ? producto.precio_oferta : "";
  document.getElementById("fpCarrusel").checked = !!(producto && producto.en_carrusel);
  document.getElementById("fpImagen").value = "";

  const preview = document.getElementById("fpImagenPreview");
  if (producto && producto.imagen_url) {
    preview.src = producto.imagen_url;
    preview.style.display = "inline-block";
  } else {
    preview.style.display = "none";
  }

  document.getElementById("btnMoverPapelera").style.display = producto ? "inline-block" : "none";

  bootstrap.Modal.getOrCreateInstance(document.getElementById("modalProducto")).show();
}

function generarIdDesdeNombre(nombre) {
  const base = nombre.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base + "-" + Date.now().toString(36).slice(-4);
}

async function subirImagenProducto(archivo, idProducto) {
  const cliente = clienteSupabase();
  const extension = archivo.name.split(".").pop();
  const nombreArchivo = idProducto + "-" + Date.now() + "." + extension;

  const { error } = await cliente.storage.from("productos-imagenes").upload(nombreArchivo, archivo, { upsert: true });
  if (error) throw error;

  const { data } = cliente.storage.from("productos-imagenes").getPublicUrl(nombreArchivo);
  return data.publicUrl;
}

async function guardarProducto(event) {
  event.preventDefault();

  const errorEl = document.getElementById("formProductoError");
  const boton = document.getElementById("btnGuardarProducto");
  errorEl.style.display = "none";
  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    const idExistente = document.getElementById("fpId").value;
    const esNuevo = !idExistente;
    const id = esNuevo ? generarIdDesdeNombre(document.getElementById("fpNombre").value) : idExistente;

    let imagenUrl = document.getElementById("fpImagenActual").value || null;
    const archivo = document.getElementById("fpImagen").files[0];
    if (archivo) {
      imagenUrl = await subirImagenProducto(archivo, id);
    }

    const datos = {
      nombre: document.getElementById("fpNombre").value.trim(),
      categoria: document.getElementById("fpCategoria").value,
      precio: parseFloat(document.getElementById("fpPrecio").value),
      descripcion: document.getElementById("fpDescripcion").value.trim() || null,
      imagen_url: imagenUrl,
      etiqueta: document.getElementById("fpEtiqueta").value || null,
      precio_oferta: document.getElementById("fpPrecioOferta").value ? parseFloat(document.getElementById("fpPrecioOferta").value) : null,
      en_carrusel: document.getElementById("fpCarrusel").checked
    };

    const cliente = clienteSupabase();
    const resultado = esNuevo
      ? await cliente.from("productos").insert({ id: id, activo: true, ...datos })
      : await cliente.from("productos").update(datos).eq("id", id);

    if (resultado.error) throw resultado.error;

    bootstrap.Modal.getInstance(document.getElementById("modalProducto")).hide();
    await cargarProductosPanel();
  } catch (e) {
    console.error("Error guardando producto:", e);
    errorEl.textContent = "No se pudo guardar. Revisa los datos e intenta de nuevo.";
    errorEl.style.display = "block";
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar";
  }
}

// ------------------------------------------------------------
// PAPELERA
// ------------------------------------------------------------
async function moverAPapeleraDesdeModal() {
  const id = document.getElementById("fpId").value;
  if (!id) return;
  if (!confirm("¿Mover este producto a la papelera? Ya no se va a mostrar en la tienda, pero puedes restaurarlo cuando quieras.")) return;

  const { error } = await clienteSupabase().from("productos").update({ activo: false }).eq("id", id);
  if (error) { console.error(error); alert("No se pudo mover a la papelera."); return; }

  bootstrap.Modal.getInstance(document.getElementById("modalProducto")).hide();
  await cargarProductosPanel();
}

async function restaurarProducto(id) {
  const { error } = await clienteSupabase().from("productos").update({ activo: true }).eq("id", id);
  if (error) { console.error(error); alert("No se pudo restaurar."); return; }
  await cargarProductosPanel();
}

async function eliminarDefinitivo(id) {
  if (!confirm("Esto borra el producto para siempre, sin poder deshacerlo. ¿Seguro?")) return;
  const { error } = await clienteSupabase().from("productos").delete().eq("id", id);
  if (error) { console.error(error); alert("No se pudo eliminar."); return; }
  await cargarProductosPanel();
}

// ------------------------------------------------------------
// FORMATO DE DESCRIPCIÓN — negrita y listas simples, sin un
// editor de texto completo. Envuelve la selección con **texto**
// (negrita) o antepone "- " a la línea actual (viñeta). Esas
// marcas se guardan tal cual en la base de datos, y
// formatearDescripcionHTML() (en script.js) las convierte a
// negrita/viñetas de verdad al mostrarlas en producto.html.
// ------------------------------------------------------------
function aplicarFormatoDescripcion(tipo) {
  const textarea = document.getElementById("fpDescripcion");

  if (tipo === "negrita") {
    const inicio = textarea.selectionStart;
    const fin = textarea.selectionEnd;
    const seleccionado = textarea.value.slice(inicio, fin);
    const contenido = seleccionado || "texto";
    textarea.value = textarea.value.slice(0, inicio) + "**" + contenido + "**" + textarea.value.slice(fin);
    textarea.focus();
    textarea.setSelectionRange(inicio + 2, inicio + 2 + contenido.length);
  } else if (tipo === "lista") {
    const necesitaSalto = textarea.value.length > 0 && !textarea.value.endsWith("\n");
    textarea.value += (necesitaSalto ? "\n" : "") + "- ";
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}

// ------------------------------------------------------------
// ARRANQUE
// ------------------------------------------------------------
function inicializarProductosPanel() {
  if (!document.getElementById("grillaProductosPanel")) return;
  renderizarPildorasPanel();
  cargarProductosPanel();

  const buscador = document.getElementById("buscadorProductosPanel");
  if (buscador) buscador.addEventListener("keyup", renderizarGrillaProductosPanel);

  document.getElementById("fpImagen").addEventListener("change", function () {
    const archivo = this.files[0];
    if (!archivo) return;
    const preview = document.getElementById("fpImagenPreview");
    preview.src = URL.createObjectURL(archivo);
    preview.style.display = "inline-block";
  });
}