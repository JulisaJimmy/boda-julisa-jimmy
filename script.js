const $ = (id) => document.getElementById(id);

// ======================================
// MOSTRAR RECEPCIÓN DE LA FIESTA
// ======================================

function mostrarRecepcion(datos) {

    $("horaRecepcion").textContent = datos.hora ?
        `Hora: ${datos.hora}` :
        "Hora por confirmar";

    $("lugarRecepcion").textContent =
        datos.lugar || "Lugar por confirmar";

    $("direccionRecepcion").textContent =
        datos.direccion || "";

    const enlace = $("mapaRecepcion");

    const urlMapa = datos.maps ||
        (datos.direccion ?
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(datos.direccion)}` :
            "");

    if (urlMapa) {

        enlace.href = urlMapa;
        enlace.hidden = false;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";

    } else {

        enlace.hidden = true;

    }
}

// ======================================
// CUENTA REGRESIVA
// ======================================

function actualizarCuentaRegresiva() {

    const destino = new Date(CONFIG.fechaBoda).getTime();
    const diferencia = destino - Date.now();

    if (diferencia <= 0) {

        $("cuentaRegresiva").textContent =
            "¡Hoy celebramos nuestro amor!";

        return;
    }

    const dias = Math.floor(diferencia / 86400000);
    const horas = Math.floor(diferencia / 3600000) % 24;
    const minutos = Math.floor(diferencia / 60000) % 60;
    const segundos = Math.floor(diferencia / 1000) % 60;

    $("cuentaRegresiva").textContent =
        `${dias} días · ${horas} horas · ${minutos} minutos · ${segundos} segundos`;
}

// ======================================
// INICIAR INVITACIÓN
// ======================================

function iniciarInvitacion() {

    // Fecha de la boda
    $("fecha").textContent = new Date(CONFIG.fechaBoda)
        .toLocaleDateString("es-EC", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC"
        });

    // Fotografía de Jimmy y Julisa
    const foto = $("fotoPareja");

    foto.src = CONFIG.fotoPareja;

    foto.onerror = () => {

        console.error(
            "No se encontró la fotografía:",
            CONFIG.fotoPareja
        );

    };

    // Mostrar recepción
    mostrarRecepcion(CONFIG.recepcion);

    // Configurar música
    const audio = $("musica");

    audio.src = CONFIG.musica;
    audio.loop = true;
    audio.load();

    // Cuenta regresiva
    actualizarCuentaRegresiva();

    setInterval(actualizarCuentaRegresiva, 1000);
}

// ======================================
// PANTALLA DE BIENVENIDA Y MÚSICA
// ======================================

function configurarBienvenida() {

    const pantalla = $("pantallaBienvenida");
    const boton = $("abrirInvitacion");
    const audio = $("musica");
    const botonMusica = $("botonMusica");

    boton.addEventListener("click", async() => {

        boton.disabled = true;
        boton.textContent = "Abriendo nuestra invitación...";

        try {

            // La reproducción comienza por la acción del invitado
            await audio.play();

            // Mostrar el control de música
            botonMusica.hidden = false;
            botonMusica.textContent = "Ⅱ Pausar música";

            // Ocultar pantalla de bienvenida
            pantalla.classList.add("oculta");

            document.body.style.overflow = "auto";

        } catch (error) {

            console.error("Error al reproducir música:", error);

            boton.disabled = false;
            boton.textContent = "Volver a intentar ♡";

        }

    });

    // Control para pausar y continuar la música
    botonMusica.addEventListener("click", async() => {

        if (audio.paused) {

            try {

                await audio.play();

                botonMusica.textContent = "Ⅱ Pausar música";

            } catch (error) {

                console.error("Error al reproducir música:", error);

            }

        } else {

            audio.pause();

            botonMusica.textContent = "♪ Activar música";

        }

    });

}

// ======================================
// FORMULARIO DE CONFIRMACIÓN
// ======================================

function configurarFormulario() {

    const formulario = $("formularioRSVP");
    const mensaje = $("mensajeRSVP");

    formulario.addEventListener("submit", async(evento) => {

        evento.preventDefault();

        const boton = formulario.querySelector(
            'button[type="submit"]'
        );

        if (!CONFIG.googleSheetsURL) {

            mensaje.textContent =
                "Falta configurar Google Sheets.";

            return;
        }

        const nombre = formulario.elements.nombre.value.trim();

        if (!nombre) {

            mensaje.textContent =
                "Escribe tu nombre completo.";

            return;
        }

        boton.disabled = true;
        boton.textContent = "Enviando...";
        mensaje.textContent = "";

        try {

            const datos = new URLSearchParams(
                new FormData(formulario)
            );

            await fetch(CONFIG.googleSheetsURL, {
                method: "POST",
                mode: "no-cors",
                body: datos
            });

            mensaje.textContent =
                "¡Gracias! Tu confirmación fue enviada.";

            formulario.reset();

        } catch (error) {

            console.error("Error al enviar:", error);

            mensaje.textContent =
                "No se pudo enviar. Inténtalo nuevamente.";

        } finally {

            boton.disabled = false;

            boton.textContent =
                "Enviar confirmación";

        }

    });

}

// ======================================
// EJECUTAR CUANDO CARGUE LA PÁGINA
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    document.body.style.overflow = "hidden";

    iniciarInvitacion();

    configurarFormulario();

    configurarBienvenida();

});