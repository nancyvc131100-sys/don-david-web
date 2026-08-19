/* ============================================================
   LICORERÍA DON DAVID — calculadora.js
   ============================================================
   La calculadora de "¿Cuánto debo comprar?" en index.html.
   Separada de script.js por la misma razón que carrito.js: un
   archivo, una responsabilidad.
   ============================================================ */

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
