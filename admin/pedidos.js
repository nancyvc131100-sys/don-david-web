/* ============================================================
   LICORERÍA DON DAVID — admin/pedidos.js
   ============================================================
   Ver los pedidos que llegan por WhatsApp, marcarlos como venta
   concretada (con método de pago y captura opcional) o como no
   concretada. El resumen de "cuánto se vendió hoy" solo se
   calcula y se muestra si el rol es administrador — el/la
   ayudante puede marcar ventas igual, pero no ve el acumulado.
   ============================================================ */

let filtroPedidosActual = "pendiente";
let pedidosPanelCache = [];
let esAdministrador = false;

// ------------------------------------------------------------
// CARGA Y FILTRO
// ------------------------------------------------------------
async function cargarPedidosPanel() {
  const cliente = clienteSupabase();
  const cargando = document.getElementById("pedidosPanelCargando");
  if (cargando) cargando.style.display = "block";

  const { data, error } = await cliente.from("pedidos").select("*").order("creado_en", { ascending: false });

  if (cargando) cargando.style.display = "none";

  if (error) {
    console.error("Error cargando pedidos:", error);
    return;
  }

  pedidosPanelCache = data || [];
  if (esAdministrador) calcularResumenHoy();
  renderizarListaPedidos();
}

function pedidosFiltrados() {
  return pedidosPanelCache.filter(function (p) { return p.estado === filtroPedidosActual; });
}

function renderizarPildorasPedidos() {
  const contenedor = document.getElementById("pildorasPedidosPanel");
  if (!contenedor) return;

  const pildoras = [
    { valor: "pendiente", etiqueta: "Pendientes" },
    { valor: "concretado", etiqueta: "Concretados" },
    { valor: "no_concretado", etiqueta: "No concretados" }
  ];

  contenedor.innerHTML = pildoras.map(function (p) {
    const activa = p.valor === filtroPedidosActual ? " activo" : "";
    return '<span class="admin-pill' + activa + '" style="cursor:pointer;" onclick="cambiarFiltroPedidos(\'' + p.valor + '\')">' + p.etiqueta + '</span>';
  }).join("");
}

function cambiarFiltroPedidos(valor) {
  filtroPedidosActual = valor;
  renderizarPildorasPedidos();
  renderizarListaPedidos();
}

// ------------------------------------------------------------
// LISTA
// ------------------------------------------------------------
const ETIQUETAS_METODO_PAGO = { efectivo: "Efectivo", yape: "Yape", plin: "Plin" };

function renderizarListaPedidos() {
  const lista = document.getElementById("listaPedidosPanel");
  const vacio = document.getElementById("pedidosPanelVacio");
  if (!lista) return;

  const filtrados = pedidosFiltrados();

  if (filtrados.length === 0) {
    lista.innerHTML = "";
    if (vacio) vacio.style.display = "block";
    return;
  }
  if (vacio) vacio.style.display = "none";

  lista.innerHTML = filtrados.map(function (p) {
    const fecha = new Date(p.creado_en).toLocaleString("es-PE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const resumenItems = (p.items || []).map(function (i) { return i.nombre + " x" + i.cantidad; }).join(", ");

    let badge, accion;
    if (p.estado === "pendiente") {
      badge = '<span class="admin-badge nuevo">Pendiente</span>';
      accion = '<button type="button" class="btn btn-sm btn-dark" onclick="abrirModalPedido(\'' + p.id + '\')">Marcar</button>';
    } else if (p.estado === "concretado") {
      badge = '<span class="admin-badge mas-vendido">Venta confirmada</span>';
      accion = '<span class="text-secondary" style="font-size:12px;">' + (ETIQUETAS_METODO_PAGO[p.metodo_pago] || "") + '</span>';
    } else {
      badge = '<span class="badge bg-secondary">No se concretó</span>';
      accion = "";
    }

    return (
      '<div class="admin-product-card p-3">' +
        '<div class="d-flex justify-content-between align-items-start gap-2">' +
          '<div>' +
            badge +
            '<p class="fw-bold mb-1 mt-1">S/ ' + Number(p.total).toFixed(2) + '</p>' +
            '<p class="text-secondary mb-1" style="font-size:12px;">' + fecha + '</p>' +
            '<p class="mb-0" style="font-size:13px;">' + resumenItems + '</p>' +
          '</div>' +
          '<div class="text-end">' + accion + '</div>' +
        '</div>' +
      '</div>'
    );
  }).join("");
}

// ------------------------------------------------------------
// MODAL: marcar un pedido pendiente
// ------------------------------------------------------------
function abrirModalPedido(id) {
  const pedido = pedidosPanelCache.find(function (p) { return p.id === id; });
  if (!pedido) return;

  document.getElementById("mpId").value = pedido.id;
  document.getElementById("mpItems").innerHTML = (pedido.items || []).map(function (i) {
    return '<div>' + i.nombre + ' x' + i.cantidad + ' — S/ ' + (i.precio * i.cantidad).toFixed(2) + '</div>';
  }).join("");
  document.getElementById("mpTotal").textContent = "Total: S/ " + Number(pedido.total).toFixed(2);
  document.getElementById("mpMetodoPago").value = "efectivo";
  document.getElementById("mpCaptura").value = "";
  document.getElementById("mpError").style.display = "none";

  bootstrap.Modal.getOrCreateInstance(document.getElementById("modalPedido")).show();
}

async function subirCapturaPago(archivo, idPedido) {
  const cliente = clienteSupabase();
  const extension = archivo.name.split(".").pop();
  const rutaArchivo = idPedido + "-" + Date.now() + "." + extension;

  const { error } = await cliente.storage.from("capturas-pago").upload(rutaArchivo, archivo);
  if (error) throw error;

  // El bucket es privado a propósito — esta ruta se guarda tal
  // cual, y para VERLA más adelante se hace desde el dashboard
  // de Supabase (Storage → capturas-pago), no desde el panel.
  return rutaArchivo;
}

async function marcarConcretadoConfirmar() {
  const errorEl = document.getElementById("mpError");
  errorEl.style.display = "none";

  const id = document.getElementById("mpId").value;
  const metodoPago = document.getElementById("mpMetodoPago").value;
  const archivo = document.getElementById("mpCaptura").files[0];
  const boton = document.getElementById("btnConfirmarVenta");

  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    let capturaRuta = null;
    if (archivo) {
      capturaRuta = await subirCapturaPago(archivo, id);
    }

    const cliente = clienteSupabase();
    const { data: { session } } = await cliente.auth.getSession();

    const { error } = await cliente.from("pedidos").update({
      estado: "concretado",
      metodo_pago: metodoPago,
      captura_pago_url: capturaRuta,
      registrado_por: session.user.id
    }).eq("id", id);

    if (error) throw error;

    bootstrap.Modal.getInstance(document.getElementById("modalPedido")).hide();
    await cargarPedidosPanel();
  } catch (e) {
    console.error("Error confirmando venta:", e);
    errorEl.textContent = "No se pudo guardar. Intenta de nuevo.";
    errorEl.style.display = "block";
  } finally {
    boton.disabled = false;
    boton.textContent = "Confirmar venta";
  }
}

async function marcarNoConcretadoConfirmar() {
  const id = document.getElementById("mpId").value;

  try {
    const cliente = clienteSupabase();
    const { data: { session } } = await cliente.auth.getSession();

    const { error } = await cliente.from("pedidos").update({
      estado: "no_concretado",
      registrado_por: session.user.id
    }).eq("id", id);

    if (error) throw error;

    bootstrap.Modal.getInstance(document.getElementById("modalPedido")).hide();
    await cargarPedidosPanel();
  } catch (e) {
    console.error("Error marcando como no concretado:", e);
    alert("No se pudo guardar. Intenta de nuevo.");
  }
}

// ------------------------------------------------------------
// RESUMEN DE HOY — solo se calcula si es administrador; el
// ayudante nunca ejecuta esta función (ver inicializarPedidosPanel).
// ------------------------------------------------------------
function calcularResumenHoy() {
  const hoy = new Date();
  const esHoy = function (fechaStr) {
    const f = new Date(fechaStr);
    return f.getFullYear() === hoy.getFullYear() && f.getMonth() === hoy.getMonth() && f.getDate() === hoy.getDate();
  };

  const pedidosHoy = pedidosPanelCache.filter(function (p) { return esHoy(p.creado_en); });
  const ventasHoy = pedidosHoy.filter(function (p) { return p.estado === "concretado"; });
  const totalVentasHoy = ventasHoy.reduce(function (acc, p) { return acc + Number(p.total); }, 0);

  document.getElementById("resumenPedidosHoy").textContent = pedidosHoy.length;
  document.getElementById("resumenVentasHoy").textContent = "S/ " + totalVentasHoy.toFixed(2);
}

// ------------------------------------------------------------
// ARRANQUE
// ------------------------------------------------------------
function inicializarPedidosPanel(perfil) {
  if (!document.getElementById("listaPedidosPanel")) return;

  esAdministrador = perfil.rol === "administrador";
  if (esAdministrador) {
    document.getElementById("resumenVentasAdmin").style.display = "block";
  }

  renderizarPildorasPedidos();
  cargarPedidosPanel();

  document.getElementById("btnConfirmarVenta").addEventListener("click", marcarConcretadoConfirmar);
  document.getElementById("btnNoConcretado").addEventListener("click", marcarNoConcretadoConfirmar);
}
