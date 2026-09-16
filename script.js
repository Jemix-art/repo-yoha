"use strict";

(() => {
  const body = document.body;
  const opening = document.getElementById("apertura");
  const seal = document.getElementById("abrir-invitacion");
  const letter = document.getElementById("carta");
  const letterInside = document.getElementById("carta-interior");
  const paper = letter?.querySelector(".paper");
  const heading = document.getElementById("nombres");
  const status = document.getElementById("estado-apertura");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const FLAP_MS = 700;
  const LETTER_MS = 900;
  let phaseTimer = null;


  // Ecuador: UTC-5 fijo. El instante no depende de la zona horaria del visitante.
  const weddingTime = new Date("2026-10-10T17:00:00-05:00").getTime();
  const days = document.getElementById("countdown-days");
  const hours = document.getElementById("countdown-hours");
  const minutes = document.getElementById("countdown-minutes");
  function updateCountdown() {
    const remaining = Math.max(0, weddingTime - Date.now());
    if (days) days.textContent = String(Math.floor(remaining / 86400000)).padStart(2, "0");
    if (hours) hours.textContent = String(Math.floor(remaining / 3600000) % 24).padStart(2, "0");
    if (minutes) minutes.textContent = String(Math.floor(remaining / 60000) % 60).padStart(2, "0");
  }
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
  document.addEventListener("visibilitychange", updateCountdown);

  const audio = document.getElementById("musica");
  const musicButton = document.getElementById("musica-toggle");
  const musicStatus = document.getElementById("estado-musica");
  const MUSIC_KEY = "wedding-music-muted";
  const LISTENING_VOLUME = 0.7;
  let visitorMuted = false;
  let fadeFrame = 0;
  let playbackVersion = 0;
  try { visitorMuted = localStorage.getItem(MUSIC_KEY) === "true"; }
  catch { /* La música funciona también si el almacenamiento está bloqueado. */ }

  function updateMusicButton() {
    if (!audio || !musicButton) return;
    const active = !audio.paused && !audio.muted && !visitorMuted;
    musicButton.dataset.active = String(active);
    musicButton.setAttribute("aria-pressed", String(active));
    const label = active ? "Silenciar música" : "Activar música";
    musicButton.setAttribute("aria-label", label);
    musicButton.querySelector(".music-label").textContent = label;
  }
  function saveMusicChoice(muted) {
    visitorMuted = muted;
    try { localStorage.setItem(MUSIC_KEY, String(muted)); }
    catch { /* Preferencia conservada en memoria durante esta visita. */ }
  }
  function preparePlayback() {
    playbackVersion += 1;
    window.cancelAnimationFrame(fadeFrame);
    audio.muted = false;
    audio.volume = 0;
    if (musicStatus) musicStatus.textContent = "";
  }
  function playbackFailed(version) {
    if (version !== playbackVersion) return;
    window.cancelAnimationFrame(fadeFrame);
    audio.pause();
    audio.muted = true;
    updateMusicButton();
    if (musicStatus) musicStatus.textContent = "La música no pudo iniciarse. Puedes intentarlo con el botón Activar música.";
  }
  function handlePlayback(playResult, version) {
    Promise.resolve(playResult).then(() => {
      if (version !== playbackVersion || visitorMuted || audio.paused) return;
      updateMusicButton();
      const start = performance.now();
      function fadeIn(now) {
        if (version !== playbackVersion || visitorMuted || audio.paused) return;
        const progress = Math.min(1, (now - start) / 2400);
        audio.volume = LISTENING_VOLUME * progress;
        if (progress < 1) fadeFrame = window.requestAnimationFrame(fadeIn);
      }
      fadeFrame = window.requestAnimationFrame(fadeIn);
    }).catch(() => playbackFailed(version));
  }
  if (audio && musicButton) {
    audio.loop = true;
    audio.muted = visitorMuted;
    audio.volume = 0;
    musicButton.hidden = false;
    updateMusicButton();
    audio.addEventListener("playing", updateMusicButton);
    audio.addEventListener("pause", updateMusicButton);
    audio.addEventListener("error", () => playbackFailed(playbackVersion));
    musicButton.addEventListener("click", () => {
      if (!audio.paused && !audio.muted && !visitorMuted) {
        saveMusicChoice(true);
        playbackVersion += 1;
        window.cancelAnimationFrame(fadeFrame);
        audio.muted = true;
        audio.pause();
        updateMusicButton();
      } else {
        saveMusicChoice(false);
        preparePlayback();
        try { handlePlayback(audio.play(), playbackVersion); }
        catch { playbackFailed(playbackVersion); }
      }
    });
  }

  // Si falta un elemento esencial, se conserva la carta HTML ya visible.
  if (!opening || !seal || !letter || !letterInside || !paper || !heading || !status) return;

  function showLetter(moveFocus = false) {
    window.clearTimeout(phaseTimer);
    phaseTimer = null;
    body.dataset.state = "open";
    letter.inert = false;
    letter.removeAttribute("aria-hidden");
    seal.setAttribute("aria-expanded", "true");
    opening.hidden = true;
    status.textContent = "Invitación abierta. Puedes desplazarte para leerla.";
    if (moveFocus) heading.focus({ preventScroll: true });
  }

  function measureLetter() {
    const rect = letterInside.getBoundingClientRect();
    const scale = rect.width / paper.offsetWidth;
    const left = rect.left - paper.offsetLeft * scale;
    const top = rect.top - paper.offsetTop * scale;
    const style = letter.style;
    style.setProperty("--letter-x", `${left}px`);
    style.setProperty("--letter-y", `${top}px`);
    style.setProperty("--letter-lift-y", `${top - rect.height * 0.95}px`);
    style.setProperty("--letter-scale", String(scale));
    style.setProperty("--letter-start-height", `${paper.offsetTop + rect.height / scale}px`);
  }

  function openInvitation() {
    if (body.dataset.state !== "closed") return;
    // play() se llama en la misma pila del clic, antes de temporizadores o promesas.
    if (audio && !visitorMuted) {
      preparePlayback();
      try { handlePlayback(audio.play(), playbackVersion); }
      catch { playbackFailed(playbackVersion); }
    }
    if (reducedMotion.matches) {
      showLetter(true);
      return;
    }

    body.dataset.state = "opening";
    seal.disabled = true;
    status.textContent = "Abriendo la invitación…";

    // La solapa termina sus 700 ms antes de iniciar los 900 ms de ascenso.
    phaseTimer = window.setTimeout(() => {
      measureLetter();
      body.dataset.state = "lifting";
      phaseTimer = window.setTimeout(() => showLetter(true), LETTER_MS);
    }, FLAP_MS);
  }

  // --- Invitado y confirmacion ---------------------------------------------
  // El enlace lleva ?i=codigo; de ahi salen el nombre y los pases.
  const ENDPOINT_RSVP = ""; // <- pega aqui la URL del Apps Script

  const parametros = new URLSearchParams(window.location.search);
  const codigo = (parametros.get("i") || "").trim().toLowerCase();
  const lista = window.INVITADOS || {};
  const invitado = lista[codigo] || null;

  function enPases(n) {
    return n === 1 ? "1 pase" : n + " pases";
  }

  if (invitado) {
    document.querySelectorAll('[data-invitado="nombre"]').forEach((el) => {
      el.textContent = invitado.n;
    });
    document.querySelectorAll('[data-invitado="pases"]').forEach((el) => {
      el.textContent = enPases(invitado.p);
    });
    document.title = invitado.n + " · Yohana & José Luis";
  } else {
    // Sin codigo valido la carta sigue siendo legible: se ocultan los huecos
    // personales en vez de mostrar un marcador de relleno.
    document.querySelectorAll(".dedication, .rsvp-guest").forEach((el) => {
      el.hidden = true;
    });
  }

  const formRsvp = document.getElementById("rsvp-form");
  const estadoRsvp = document.getElementById("rsvp-estado");
  const cuantos = document.getElementById("rsvp-cuantos");
  const selectPersonas = document.getElementById("rsvp-personas");

  if (formRsvp && invitado) {
    // Cuando hay un solo pase no hay nada que elegir.
    if (invitado.p > 1 && selectPersonas) {
      for (let i = invitado.p; i >= 1; i -= 1) {
        const op = document.createElement("option");
        op.value = String(i);
        op.textContent = i === 1 ? "1 persona" : i + " personas";
        selectPersonas.appendChild(op);
      }
    }

    formRsvp.addEventListener("change", (e) => {
      if (e.target.name !== "asiste") return;
      if (cuantos) cuantos.hidden = !(e.target.value === "si" && invitado.p > 1);
    });

    const CLAVE_RSVP = "rsvp-" + codigo;
    try {
      const previo = localStorage.getItem(CLAVE_RSVP);
      if (previo && estadoRsvp) {
        estadoRsvp.textContent = "Ya nos respondiste el " + previo + ". Si te equivocaste, vuelve a enviarlo.";
      }
    } catch { /* El almacenamiento puede estar bloqueado; no es esencial. */ }

    formRsvp.addEventListener("submit", async (e) => {
      e.preventDefault();
      const elegido = formRsvp.querySelector('input[name="asiste"]:checked');
      if (!elegido) return;
      const boton = document.getElementById("enviar-rsvp");
      const asiste = elegido.value === "si";
      const personas = !asiste ? 0 : (invitado.p > 1 && selectPersonas ? Number(selectPersonas.value) : invitado.p);

      boton.disabled = true;
      if (estadoRsvp) estadoRsvp.textContent = "Enviando…";

      const datos = {
        codigo: codigo,
        nombre: invitado.n,
        pases: invitado.p,
        asiste: asiste ? "SI" : "NO",
        personas: personas,
        enviado: new Date().toISOString()
      };

      try {
        if (!ENDPOINT_RSVP) throw new Error("sin endpoint");
        // Apps Script no devuelve cabeceras CORS: con no-cors la peticion llega
        // pero no podemos leer la respuesta. Ver la nota del README.
        await fetch(ENDPOINT_RSVP, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(datos)
        });
        const fecha = new Date().toLocaleDateString("es-EC", { day: "numeric", month: "long" });
        try { localStorage.setItem(CLAVE_RSVP, fecha); } catch { /* sin almacenamiento */ }
        if (estadoRsvp) {
          estadoRsvp.textContent = asiste
            ? "¡Gracias! Te esperamos el 10 de octubre."
            : "Gracias por avisarnos. Te vamos a extrañar.";
        }
        formRsvp.querySelectorAll("input, select, button").forEach((c) => { c.disabled = true; });
      } catch {
        boton.disabled = false;
        if (estadoRsvp) {
          estadoRsvp.textContent = "No pudimos enviarlo. Escríbenos por WhatsApp y lo anotamos.";
        }
      }
    });
  } else if (formRsvp) {
    // Sin invitado identificado no hay a quien apuntar la respuesta.
    formRsvp.hidden = true;
    if (estadoRsvp) estadoRsvp.textContent = "Abre la invitación desde el enlace que te enviamos para confirmar.";
  }

  // --- Ventana con los datos de transferencia -----------------------------
  const abrirCuenta = document.getElementById("abrir-cuenta");
  const modal = document.getElementById("modal-cuenta");
  const botonCopia = document.getElementById("copiar-cuenta");
  const estadoCopia = document.getElementById("estado-copia");

  if (abrirCuenta && modal) {
    let ultimoFoco = null;

    function focoables() {
      return [...modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
        .filter((el) => el.offsetParent !== null);
    }

    function abrir() {
      // Guardamos quien abrio, pero el retorno se ancla al propio disparador:
      // si la apertura no vino de un clic que enfoque, activeElement es <body>
      // y el foco se perderia al cerrar.
      ultimoFoco = document.activeElement === body ? abrirCuenta : document.activeElement;
      modal.hidden = false;
      body.dataset.modal = "abierto";
      abrirCuenta.setAttribute("aria-expanded", "true");
      // Enfocar la caja, no el boton de cerrar: lo primero que se resalta no
      // debe ser la salida.
      const caja = modal.querySelector(".modal-caja");
      if (caja) caja.focus();
    }

    function cerrar() {
      modal.hidden = true;
      delete body.dataset.modal;
      abrirCuenta.setAttribute("aria-expanded", "false");
      // Devolver el foco donde estaba: quien navega con teclado no se pierde.
      const destino = (ultimoFoco && typeof ultimoFoco.focus === "function") ? ultimoFoco : abrirCuenta;
      destino.focus();
    }

    abrirCuenta.setAttribute("aria-expanded", "false");
    abrirCuenta.addEventListener("click", abrir);
    modal.querySelectorAll("[data-cerrar-modal]").forEach((el) => el.addEventListener("click", cerrar));

    document.addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") { cerrar(); return; }
      if (e.key !== "Tab") return;
      // Atrapar el tabulador dentro de la ventana mientras este abierta.
      const f = focoables();
      if (!f.length) return;
      const primero = f[0], ultimo = f[f.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    });
  }

  // Copiar la cuenta evita que nadie transcriba diez digitos a mano.
  if (botonCopia) {
    const etiqueta = botonCopia.querySelector(".copiar-texto");
    const original = etiqueta.textContent;
    let vuelta = null;
    botonCopia.addEventListener("click", async () => {
      const numero = botonCopia.dataset.cuenta;
      let bien = false;
      try {
        await navigator.clipboard.writeText(numero);
        bien = true;
      } catch {
        // Sin portapapeles (o sin contexto seguro): seleccionamos el numero.
        const nodo = document.getElementById("numero-cuenta");
        if (nodo) {
          const rango = document.createRange();
          rango.selectNodeContents(nodo);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(rango);
        }
      }
      etiqueta.textContent = bien ? "Copiado" : "Selecciónalo y cópialo";
      botonCopia.dataset.copiado = String(bien);
      if (estadoCopia) estadoCopia.textContent = bien ? "Número de cuenta copiado." : "Número seleccionado; cópialo manualmente.";
      window.clearTimeout(vuelta);
      vuelta = window.setTimeout(() => {
        etiqueta.textContent = original;
        botonCopia.removeAttribute("data-copiado");
      }, 2600);
    });
  }

  seal.addEventListener("click", openInvitation);

  function onMotionPreferenceChange(event) {
    if (event.matches && ["opening", "lifting"].includes(body.dataset.state)) showLetter(true);
  }
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", onMotionPreferenceChange);
  } else {
    reducedMotion.addListener(onMotionPreferenceChange);
  }

  // Si el móvil cambia de orientación durante la apertura, se entrega la carta
  // directamente para evitar mantener medidas antiguas que puedan recortarla.
  window.addEventListener("resize", () => {
    if (body.dataset.state === "opening" || body.dataset.state === "lifting") {
      showLetter(true);
    }
  });

  if (window.location.hash) {
    showLetter();
  } else {
    body.dataset.state = "closed";
    letter.inert = true;
    letter.setAttribute("aria-hidden", "true");
    opening.hidden = false;
  }
})();
