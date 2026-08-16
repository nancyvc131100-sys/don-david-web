/* ============================================================
   LICORERÍA DON DAVID — admin/admin.js
   ============================================================
   Lógica compartida por TODAS las páginas del panel: verificar
   sesión, iniciar/cerrar sesión, y saber el rol de quien está
   conectado. Es el equivalente, para el panel, de lo que
   partials.js es para el sitio público.
   ============================================================ */

let _clienteSupabaseInstancia = null;

function clienteSupabase() {
  if (!_clienteSupabaseInstancia) {
    _clienteSupabaseInstancia = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _clienteSupabaseInstancia;
}

// ------------------------------------------------------------
// LOGIN (solo se usa en login.html)
// ------------------------------------------------------------
async function iniciarSesion(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");
  const boton = document.getElementById("btnIniciarSesion");

  errorEl.style.display = "none";
  boton.disabled = true;
  boton.textContent = "Ingresando...";

  // Si la conexión tarda demasiado (o se corta a medias, algo
  // más común en datos móviles que en wifi), esto evita que el
  // botón se quede en "Ingresando..." para siempre sin avisar
  // nada. A los 15 segundos se corta solo y muestra un mensaje.
  const tiempoAgotado = new Promise(function (_, reject) {
    setTimeout(function () { reject(new Error("TIEMPO_AGOTADO")); }, 15000);
  });

  try {
    const cliente = clienteSupabase();
    const { data, error } = await Promise.race([
      cliente.auth.signInWithPassword({ email, password }),
      tiempoAgotado
    ]);

    if (error) {
      console.error("Error de autenticación:", error);
      errorEl.textContent = "Correo o contraseña incorrectos.";
      errorEl.style.display = "block";
      return;
    }

    // Tener una cuenta de acceso no alcanza: además necesita una
    // fila en "perfiles" (ahí vive su rol). Sin eso, no entra.
    const { data: perfil, error: errorPerfil } = await Promise.race([
      cliente.from("perfiles").select("*").eq("id", data.user.id).single(),
      tiempoAgotado
    ]);

    if (errorPerfil || !perfil) {
      console.error("No se encontró perfil para este usuario. UID buscado:", data.user.id, "Error de Supabase:", errorPerfil);
      errorEl.textContent = "Esta cuenta no tiene acceso al panel.";
      errorEl.style.display = "block";
      await cliente.auth.signOut();
      return;
    }

    window.location.href = "panel.html";
  } catch (e) {
    if (e.message === "TIEMPO_AGOTADO") {
      console.error("El login tardó demasiado y se cortó solo.");
      errorEl.textContent = "Esto está tardando más de lo normal. Revisa tu conexión a internet e intenta de nuevo.";
    } else {
      console.error("Error inesperado en el login:", e);
      errorEl.textContent = "Ocurrió un error inesperado. Intenta de nuevo.";
    }
    errorEl.style.display = "block";
  } finally {
    // Pase lo que pase (éxito, error, o tiempo agotado), el botón
    // nunca se queda trabado en "Ingresando..." — esto es lo que
    // faltaba antes.
    boton.disabled = false;
    boton.textContent = "Ingresar";
  }
}

// ------------------------------------------------------------
// GUARDIA DE SESIÓN (se usa en panel.html y en cada pantalla
// nueva que se agregue al panel). Si no hay sesión válida,
// manda de vuelta al login. Si la hay, devuelve el perfil
// (nombre + rol) para que cada pantalla lo use.
// ------------------------------------------------------------
async function exigirSesion() {
  const cliente = clienteSupabase();
  const { data: { session } } = await cliente.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
    return null;
  }

  const { data: perfil, error } = await cliente
    .from("perfiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !perfil) {
    await cliente.auth.signOut();
    window.location.href = "login.html";
    return null;
  }

  return perfil;
}

async function cerrarSesion() {
  const cliente = clienteSupabase();
  await cliente.auth.signOut();
  window.location.href = "login.html";
}
