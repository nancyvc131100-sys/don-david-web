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