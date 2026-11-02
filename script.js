
// ======================================
// CONFIGURACIÓN GENERAL
// ======================================

const $ = (id) => document.getElementById(id);


// ======================================
// MOSTRAR RECEPCIÓN
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


    // Fotografía de los novios

    const foto = $("fotoPareja");

    foto.src = CONFIG.fotoPareja;

    foto.onerror = () => {

        console.error(
            "No se encontró la fotografía:",
            CONFIG.fotoPareja
        );

    };


    // Información de recepción

    mostrarRecepcion(CONFIG.recepcion);


    // Configurar audio

    const audio = $("musica");

    audio.src = CONFIG.musica;
    audio.loop = true;
    audio.load();


    // Cuenta regresiva

    actualizarCuentaRegresiva();

    setInterval(actualizarCuentaRegresiva, 1000);

}


// ======================================
// BIENVENIDA Y CONTROL DE MÚSICA
// ======================================

function configurarBienvenida() {

    const pantalla = $("pantallaBienvenida");
    const boton = $("abrirInvitacion");
    const audio = $("musica");
    const botonMusica = $("botonMusica");


    // ABRIR INVITACIÓN

    boton.addEventListener("click", () => {

        pantalla.classList.add("oculta");

        document.body.style.overflow = "auto";

        boton.disabled = false;

        botonMusica.hidden = false;


        // Intentar reproducir música

        audio.play()
            .then(() => {

                botonMusica.textContent = "Ⅱ Pausar música";

            })
            .catch((error) => {

                console.warn(
                    "La invitación se abrió, pero el audio no pudo reproducirse:",
                    error
                );

                botonMusica.textContent = "♪ Activar música";

            });

    });


    // CONTROL PARA PAUSAR Y CONTINUAR

    botonMusica.addEventListener("click", async() => {

        if (audio.paused) {

            try {

                await audio.play();

                botonMusica.textContent = "Ⅱ Pausar música";

            } catch (error) {

                console.error(
                    "Error al reproducir música:",
                    error
                );

                botonMusica.textContent = "♪ Activar música";

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


        // COMPROBAR CONEXIÓN

        if (
            typeof CONFIG.googleSheetsURL !== "string" ||
            !CONFIG.googleSheetsURL.trim()
        ) {

            mensaje.textContent =
                "Falta configurar la conexión con Google Sheets.";

            return;

        }


        // OBTENER VALORES

        const obtenerValor = (nombreCampo) => {

            const campo = formulario.elements.namedItem(nombreCampo);

            return campo ? campo.value.trim() : "";

        };


        const nombre = obtenerValor("nombre");
        const asistencia = obtenerValor("asistencia");
        const personas = obtenerValor("personas");


        // VALIDAR DATOS

        if (!nombre || !asistencia) {

            mensaje.textContent =
                "Completa tu nombre y selecciona tu asistencia.";

            return;

        }


        const numeroPersonas = Number(personas);

        if (
            !Number.isInteger(numeroPersonas) ||
            numeroPersonas < 1 ||
            numeroPersonas > 10
        ) {

            mensaje.textContent =
                "Indica un número válido de personas.";

            return;

        }


        // DESHABILITAR BOTÓN

        boton.disabled = true;
        boton.textContent = "Enviando...";
        mensaje.textContent = "";


        try {

            // PREPARAR INFORMACIÓN

            const datos = new URLSearchParams();

            datos.set("nombre", nombre);
            datos.set("asistencia", asistencia);
            datos.set("personas", String(numeroPersonas));


            // DIAGNÓSTICO

            console.log("Datos de confirmación:", {
                nombre,
                asistencia,
                personas: numeroPersonas
            });


            // ENVIAR A GOOGLE SHEETS

            await fetch(CONFIG.googleSheetsURL, {

                method: "POST",

                mode: "no-cors",

                headers: {

                    "Content-Type":
                        "application/x-www-form-urlencoded;charset=UTF-8"

                },

                body: datos.toString()

            });


            // MENSAJE AL INVITADO

            mensaje.textContent =
                "Tu confirmación fue enviada. ¡Gracias!";


            // LIMPIAR FORMULARIO

            formulario.reset();


        } catch (error) {

            console.error(
                "Error al enviar confirmación:",
                error
            );

            mensaje.textContent =
                "No se pudo enviar la solicitud. Inténtalo nuevamente.";

        } finally {

            boton.disabled = false;

            boton.textContent =
                "Enviar confirmación";

        }

    });

}


// ======================================
// INICIAR CUANDO CARGUE LA PÁGINA
// ======================================

document.addEventListener("DOMContentLoaded", () => {

    // Bloquear desplazamiento mientras aparece el sobre

    document.body.style.overflow = "hidden";

    iniciarInvitacion();

    configurarFormulario();

    configurarBienvenida();

});
