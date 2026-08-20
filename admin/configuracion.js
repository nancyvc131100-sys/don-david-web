/* ============================================================
   LICORERÍA DON DAVID — admin/configuracion.js
   ============================================================
   Carga y guarda los datos de configuracion_negocio: dirección,
   teléfono, horario, descripción ("quiénes somos") y el logo.
   Exclusivo del administrador (ver el guard en configuracion.html).
   ============================================================ */

async function cargarConfiguracion() {
  const cliente = clienteSupabase();
  const { data, error } = await cliente.from("configuracion_negocio").select("*").eq("id", 1).single();

  if (error) {
    console.error("Error cargando configuración:", error);
    return;
  }

  document.getElementById("cfDireccion").value = data.direccion || "";
  document.getElementById("cfTelefono").value = data.telefono || "";
  document.getElementById("cfHorario").value = data.horario || "";
  document.getElementById("cfDescripcion").value = data.descripcion || "";
  document.getElementById("cfLogoActual").value = data.logo_url || "";

  if (data.logo_url) {
    const preview = document.getElementById("cfLogoPreview");
    preview.src = data.logo_url;
    preview.style.display = "inline-block";
  }
}

// Igual que aplicarFormatoDescripcion() en productos.js, pero
// apuntando al textarea de esta pantalla — se duplica porque
// configuracion.html no carga productos.js (son pantallas
// separadas, cada una con solo lo que necesita).
function aplicarFormatoConfig(tipo) {
  const textarea = document.getElementById("cfDescripcion");

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

async function subirLogo(archivo) {
  const cliente = clienteSupabase();
  const extension = archivo.name.split(".").pop();
  const nombreArchivo = "logo-" + Date.now() + "." + extension;

  const { error } = await cliente.storage.from("logo-negocio").upload(nombreArchivo, archivo, { upsert: true });
  if (error) throw error;

  const { data } = cliente.storage.from("logo-negocio").getPublicUrl(nombreArchivo);
  return data.publicUrl;
}

async function guardarConfiguracion(event) {
  event.preventDefault();

  const errorEl = document.getElementById("cfError");
  const exitoEl = document.getElementById("cfExito");
  const boton = document.getElementById("btnGuardarConfig");

  errorEl.style.display = "none";
  exitoEl.style.display = "none";
  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    let logoUrl = document.getElementById("cfLogoActual").value || null;
    const archivo = document.getElementById("cfLogo").files[0];
    if (archivo) {
      logoUrl = await subirLogo(archivo);
    }

    const cliente = clienteSupabase();
    const { error } = await cliente.from("configuracion_negocio").update({
      direccion: document.getElementById("cfDireccion").value.trim(),
      telefono: document.getElementById("cfTelefono").value.trim(),
      horario: document.getElementById("cfHorario").value.trim(),
      descripcion: document.getElementById("cfDescripcion").value.trim(),
      logo_url: logoUrl
    }).eq("id", 1);

    if (error) throw error;

    document.getElementById("cfLogoActual").value = logoUrl || "";
    exitoEl.style.display = "block";
  } catch (e) {
    console.error("Error guardando configuración:", e);
    errorEl.textContent = "No se pudo guardar. Intenta de nuevo.";
    errorEl.style.display = "block";
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar cambios";
  }
}

function inicializarConfiguracionPanel() {
  if (!document.getElementById("formConfiguracion")) return;
  cargarConfiguracion();
  document.getElementById("formConfiguracion").addEventListener("submit", guardarConfiguracion);
}

// ------------------------------------------------------------
// PESTAÑAS — General ya existía; las demás son nuevas. Marcas,
// Métodos de pago y Por qué elegirnos comparten la misma
// pantalla (tabTarjetas) — solo cambia qué "seccion" se pide.
// ------------------------------------------------------------
let seccionTarjetaActual = null;
let tarjetasCache = [];
let preguntasCache = [];

const TITULOS_SECCION = {
  marca: "Marcas",
  metodo_pago: "Métodos de pago",
  por_que_elegirnos: "Por qué elegirnos"
};

function cambiarTabConfig(tab) {
  document.querySelectorAll("#configTabs .nav-link").forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  document.getElementById("tabGeneral").style.display = tab === "general" ? "block" : "none";
  document.getElementById("tabTarjetas").style.display = TITULOS_SECCION[tab] ? "block" : "none";
  document.getElementById("tabPreguntas").style.display = tab === "preguntas" ? "block" : "none";

  if (TITULOS_SECCION[tab]) {
    seccionTarjetaActual = tab;
    document.getElementById("tituloSeccionTarjetas").textContent = TITULOS_SECCION[tab];
    cargarTarjetas(tab);
  } else if (tab === "preguntas") {
    cargarPreguntas();
  }
}

// ------------------------------------------------------------
// TARJETAS (marcas / métodos de pago / por qué elegirnos)
// ------------------------------------------------------------
async function cargarTarjetas(seccion) {
  const cliente = clienteSupabase();
  const { data, error } = await cliente.from("secciones_tarjetas").select("*").eq("seccion", seccion).order("orden");

  if (error) { console.error("Error cargando tarjetas:", error); return; }

  tarjetasCache = data || [];
  renderizarListaTarjetas();
}

function renderizarListaTarjetas() {
  const contenedor = document.getElementById("listaTarjetas");
  if (!contenedor) return;

  const puedeEliminar = tarjetasCache.length > 1;

  contenedor.innerHTML = tarjetasCache.map(function (t) {
    return (
      '<div class="admin-product-card p-3 d-flex justify-content-between align-items-center gap-2">' +
        '<div>' +
          (t.icono ? '<span style="font-size:18px;">' + t.icono + '</span> ' : '') +
          '<strong>' + t.titulo + '</strong>' +
          (t.descripcion ? '<div class="text-secondary" style="font-size:12px;">' + t.descripcion + '</div>' : '') +
        '</div>' +
        '<div class="d-flex gap-2 flex-shrink-0">' +
          '<button type="button" class="btn btn-sm btn-outline-secondary" onclick="abrirModalTarjeta(\'' + t.id + '\')" title="Editar"><i class="bi bi-pencil-fill"></i></button>' +
          (puedeEliminar ? '<button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarTarjeta(\'' + t.id + '\')" title="Eliminar"><i class="bi bi-trash"></i></button>' : '') +
        '</div>' +
      '</div>'
    );
  }).join("");
}

function abrirModalTarjeta(id) {
  const tarjeta = id ? tarjetasCache.find(function (t) { return t.id === id; }) : null;

  document.getElementById("tjError").style.display = "none";
  document.getElementById("modalTarjetaTitulo").textContent = tarjeta ? "Editar" : "Nueva tarjeta";
  document.getElementById("tjId").value = tarjeta ? tarjeta.id : "";
  document.getElementById("tjSeccion").value = seccionTarjetaActual;
  document.getElementById("tjIcono").value = tarjeta ? (tarjeta.icono || "") : "";
  document.getElementById("tjTitulo").value = tarjeta ? tarjeta.titulo : "";
  document.getElementById("tjDescripcion").value = tarjeta ? (tarjeta.descripcion || "") : "";

  bootstrap.Modal.getOrCreateInstance(document.getElementById("modalTarjeta")).show();
}

async function guardarTarjeta(event) {
  event.preventDefault();

  const errorEl = document.getElementById("tjError");
  errorEl.style.display = "none";

  const idExistente = document.getElementById("tjId").value;
  const seccion = document.getElementById("tjSeccion").value;
  const datos = {
    icono: document.getElementById("tjIcono").value.trim() || null,
    titulo: document.getElementById("tjTitulo").value.trim(),
    descripcion: document.getElementById("tjDescripcion").value.trim() || null
  };

  try {
    const cliente = clienteSupabase();
    let resultado;

    if (idExistente) {
      resultado = await cliente.from("secciones_tarjetas").update(datos).eq("id", idExistente);
    } else {
      const maxOrden = tarjetasCache.reduce(function (max, t) { return Math.max(max, t.orden); }, 0);
      resultado = await cliente.from("secciones_tarjetas").insert(Object.assign({ seccion: seccion, orden: maxOrden + 1 }, datos));
    }

    if (resultado.error) throw resultado.error;

    bootstrap.Modal.getInstance(document.getElementById("modalTarjeta")).hide();
    await cargarTarjetas(seccion);
  } catch (e) {
    console.error("Error guardando tarjeta:", e);
    errorEl.textContent = "No se pudo guardar. Intenta de nuevo.";
    errorEl.style.display = "block";
  }
}

async function eliminarTarjeta(id) {
  if (!confirm("¿Eliminar esta tarjeta?")) return;

  const cliente = clienteSupabase();
  const { error } = await cliente.from("secciones_tarjetas").delete().eq("id", id);

  if (error) {
    console.error("Error eliminando tarjeta:", error);
    alert("No se pudo eliminar. Si es la última de esta sección, no se puede dejar vacía.");
    return;
  }

  await cargarTarjetas(seccionTarjetaActual);
}

// ------------------------------------------------------------
// PREGUNTAS FRECUENTES
// ------------------------------------------------------------
async function cargarPreguntas() {
  const cliente = clienteSupabase();
  const { data, error } = await cliente.from("preguntas_frecuentes").select("*").order("orden");

  if (error) { console.error("Error cargando preguntas:", error); return; }

  preguntasCache = data || [];
  renderizarListaPreguntas();
}

function renderizarListaPreguntas() {
  const contenedor = document.getElementById("listaPreguntas");
  if (!contenedor) return;

  const puedeEliminar = preguntasCache.length > 1;

  contenedor.innerHTML = preguntasCache.map(function (p) {
    return (
      '<div class="admin-product-card p-3">' +
        '<div class="d-flex justify-content-between align-items-start gap-2">' +
          '<div>' +
            '<strong>' + p.pregunta + '</strong>' +
            '<div class="text-secondary" style="font-size:13px;">' + p.respuesta + '</div>' +
          '</div>' +
          '<div class="d-flex gap-2 flex-shrink-0">' +
            '<button type="button" class="btn btn-sm btn-outline-secondary" onclick="abrirModalPregunta(\'' + p.id + '\')" title="Editar"><i class="bi bi-pencil-fill"></i></button>' +
            (puedeEliminar ? '<button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarPregunta(\'' + p.id + '\')" title="Eliminar"><i class="bi bi-trash"></i></button>' : '') +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join("");
}

function abrirModalPregunta(id) {
  const pregunta = id ? preguntasCache.find(function (p) { return p.id === id; }) : null;

  document.getElementById("pgError").style.display = "none";
  document.getElementById("modalPreguntaTitulo").textContent = pregunta ? "Editar pregunta" : "Nueva pregunta";
  document.getElementById("pgId").value = pregunta ? pregunta.id : "";
  document.getElementById("pgPregunta").value = pregunta ? pregunta.pregunta : "";
  document.getElementById("pgRespuesta").value = pregunta ? pregunta.respuesta : "";

  bootstrap.Modal.getOrCreateInstance(document.getElementById("modalPregunta")).show();
}

async function guardarPregunta(event) {
  event.preventDefault();

  const errorEl = document.getElementById("pgError");
  errorEl.style.display = "none";

  const idExistente = document.getElementById("pgId").value;
  const datos = {
    pregunta: document.getElementById("pgPregunta").value.trim(),
    respuesta: document.getElementById("pgRespuesta").value.trim()
  };

  try {
    const cliente = clienteSupabase();
    let resultado;

    if (idExistente) {
      resultado = await cliente.from("preguntas_frecuentes").update(datos).eq("id", idExistente);
    } else {
      const maxOrden = preguntasCache.reduce(function (max, p) { return Math.max(max, p.orden); }, 0);
      resultado = await cliente.from("preguntas_frecuentes").insert(Object.assign({ orden: maxOrden + 1 }, datos));
    }

    if (resultado.error) throw resultado.error;

    bootstrap.Modal.getInstance(document.getElementById("modalPregunta")).hide();
    await cargarPreguntas();
  } catch (e) {
    console.error("Error guardando pregunta:", e);
    errorEl.textContent = "No se pudo guardar. Intenta de nuevo.";
    errorEl.style.display = "block";
  }
}

async function eliminarPregunta(id) {
  if (!confirm("¿Eliminar esta pregunta?")) return;

  const cliente = clienteSupabase();
  const { error } = await cliente.from("preguntas_frecuentes").delete().eq("id", id);

  if (error) {
    console.error("Error eliminando pregunta:", error);
    alert("No se pudo eliminar. Si es la última, no se puede dejar vacía.");
    return;
  }

  await cargarPreguntas();
}