/* ============================================================
   LICORERÍA DON DAVID — producto.js
   ============================================================
   Llena la plantilla única de producto.html?id=X según el
   producto que traiga la URL. Separado de script.js por la
   misma razón que los demás: una responsabilidad por archivo.
   ============================================================ */

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
