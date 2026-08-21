/* ============================================================
   LICORERÍA DON DAVID — admin/restablecer.js
   ============================================================
   Cuando alguien toca el link de recuperación que le llega por
   correo, Supabase automáticamente reconoce ese link y arma una
   sesión temporal — por eso acá no hace falta pedir la
   contraseña vieja, solo la nueva.
   ============================================================ */

document.getElementById("formRestablecer").addEventListener("submit", async function (event) {
  event.preventDefault();

  const nuevaContrasena = document.getElementById("nuevaContrasena").value;
  const errorEl = document.getElementById("restablecerError");
  const exitoEl = document.getElementById("restablecerExito");
  const boton = document.getElementById("btnRestablecer");

  errorEl.style.display = "none";
  exitoEl.style.display = "none";
  boton.disabled = true;
  boton.textContent = "Guardando...";

  try {
    const cliente = clienteSupabase();
    const { error } = await cliente.auth.updateUser({ password: nuevaContrasena });

    if (error) throw error;

    exitoEl.textContent = "¡Listo! Tu contraseña se actualizó — ya puedes iniciar sesión con la nueva.";
    exitoEl.style.display = "block";
    document.getElementById("formRestablecer").style.display = "none";
  } catch (e) {
    console.error("Error actualizando contraseña:", e);
    errorEl.textContent = "No se pudo actualizar. El link puede haber expirado — pide uno nuevo desde el login.";
    errorEl.style.display = "block";
  } finally {
    boton.disabled = false;
    boton.textContent = "Guardar nueva contraseña";
  }
});