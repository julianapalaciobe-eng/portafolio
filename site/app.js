// Ink District · el portafolio se arma desde data/content.json
// (ese archivo se edita desde el panel /admin)
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (v = "") => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (v = "") => String(v).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const pad = (n) => String(n).padStart(2, "0");

  /* =========================================================
     PLANTILLAS
     ========================================================= */
  const caption = (p) =>
    `<figcaption><span class="piece__n"></span><h3 class="script">${esc(p.titulo)}</h3>${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ""}</figcaption>`;

  const figure = (p, cls = "", src = (p.imagenes || [])[0], attrs = "") =>
    src ? `<figure class="piece ${cls} reveal" data-piece ${attrs}><div class="piece__media"><img src="${esc(src)}" alt="${esc(p.alt || p.titulo)}" loading="lazy"></div>${caption(p)}</figure>` : "";

  const STYLE = {
    normal: "",
    recorte: "piece--cut",
    recuadro: "piece--box",
    "recuadro-claro": "piece--box piece--box-light",
    "recuadro-carmesi": "piece--box piece--box-crimson",
    lateral: "piece--bleed",
  };
  // pares de columnas que se van alternando para que la galería no se vea en serie
  const PAIRS = [["1 / 6", "6 / 13"], ["1 / 8", "8 / 13"], ["2 / 7", "7 / 12"]];

  const LAYOUTS = {
    galeria(sec) {
      return `<div class="ilus galeria">${(sec.piezas || []).map((p, i) => {
        const side = i % 2, col = PAIRS[Math.floor(i / 2) % PAIRS.length][side];
        let cls = STYLE[p.estilo] ?? "";
        if (p.estilo === "lateral" && side === 0) cls += " piece--bleed-left";
        if (side === 1) cls += " is-right";
        return figure(p, cls, undefined, `style="grid-column:${col}"`);
      }).join("")}</div>`;
    },

    cuadricula(sec) {
      return `<div class="extras">${(sec.piezas || []).map((p) => figure(p)).join("")}</div>`;
    },

    empaques(sec) {
      return (sec.piezas || []).map((p, i) => {
        const imgs = p.imagenes || [];
        const figs = imgs.map((src, k) => {
          const wide = imgs.length === 1 || k === imgs.length - 1;
          return figure({ ...p, titulo: imgs.length > 1 ? `${p.titulo} · ${k + 1}` : p.titulo }, `piece--cut pack__img ${wide ? "pack__img--wide" : ""}`, src);
        }).join("");
        return `<article class="pack ${i % 2 ? "pack--rev" : ""} reveal">
          <div class="pack__info">${p.etiqueta ? `<span class="tag">${esc(p.etiqueta)}</span>` : ""}<h3 class="script pack__name">${esc(p.titulo)}</h3>${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ""}</div>
          ${figs}</article>`;
      }).join("");
    },

    fotos(sec) {
      const all = sec.piezas || [];
      const compares = all.filter((p) => p.estilo === "comparar" && (p.imagenes || []).length >= 2);
      const photos = all.filter((p) => !compares.includes(p) && (p.imagenes || []).length);
      const series = [...new Set(all.map((p) => p.serie).filter(Boolean))];
      const strip = photos.slice(0, 14).map((p) => `<img src="${esc(p.imagenes[0])}" alt="" loading="lazy">`).join("");
      return `
        ${strip ? `<div class="marquee marquee--photos" aria-hidden="true"><div class="marquee__track">${strip}${strip}</div></div>` : ""}
        ${series.length > 1 ? `<div class="filters reveal" role="tablist" aria-label="Filtrar series">
          <button class="filter is-on" data-filter="all" role="tab" aria-selected="true">Todas</button>
          ${series.map((s) => `<button class="filter" data-filter="${slug(s)}" role="tab" aria-selected="false">${esc(s)}</button>`).join("")}
        </div>` : ""}
        ${compares.length ? `<div class="grades reveal">${compares.map((p) => `
          <div class="grade" data-series="${slug(p.serie)}">
            <div class="compare" style="--pos:50%">
              <img src="${esc(p.imagenes[1])}" alt="${esc(p.titulo)}, versión 2">
              <img class="compare__top" src="${esc(p.imagenes[0])}" alt="${esc(p.titulo)}, versión 1">
              <span class="compare__handle" aria-hidden="true"></span>
              <input type="range" min="0" max="100" value="50" aria-label="Comparar versiones de ${esc(p.titulo)}">
              <span class="compare__lbl compare__lbl--l">${esc(p.etiqueta1 || "Versión 1")}</span><span class="compare__lbl compare__lbl--r">${esc(p.etiqueta2 || "Versión 2")}</span>
            </div>
            <p><span class="script">${esc(p.titulo)}</span> ${esc(p.descripcion || "")}</p>
          </div>`).join("")}</div>` : ""}
        <div class="photos">${photos.map((p) => figure(p, "photo", undefined, `data-series="${slug(p.serie)}"`)).join("")}</div>`;
    },

    branding(sec) {
      const logos = sec.logos || [];
      const strip = logos.map((l) => `<img src="${esc(l.imagen)}" alt="" loading="lazy"><span class="marquee__dot">✶</span>`).join("");
      const rebrands = (sec.piezas || []).map((p) => {
        const imgs = p.imagenes || [];
        const figs = imgs.map((src, k) => figure({ ...p, titulo: imgs.length > 1 ? `${p.titulo} · ${k + 1}` : p.titulo }, imgs.length === 1 ? "rebrand__img" : "", src)).join("");
        return `<div class="rebrand reveal">
          <div class="rebrand__head">
            ${p.antes ? `<div class="before"><span>Antes</span><img src="${esc(p.antes)}" alt="Versión anterior de ${esc(p.titulo)}"></div>` : ""}
            <div><h4>${esc(p.titulo)}</h4>${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ""}</div>
          </div>
          ${imgs.length > 1 ? `<div class="rebrand__row ${imgs.length === 2 ? "rebrand__row--2" : ""}">${figs}</div>` : figs}
        </div>`;
      }).join("");
      return `
        ${logos.length ? `<h3 class="script sub reveal">Logofolio</h3>
        <ul class="logos reveal">${logos.map((l) => `<li data-name="${esc(l.nombre)}"><img src="${esc(l.imagen)}" alt="Logo ${esc(l.nombre)}"></li>`).join("")}</ul>
        <div class="marquee marquee--logos marquee--rev" aria-hidden="true"><div class="marquee__track">${strip}${strip}</div></div>` : ""}
        ${rebrands ? `<h3 class="script sub reveal">Rebranding</h3>${rebrands}` : ""}`;
    },

    audiovisual(sec) {
      const videos = (sec.piezas || []).filter((p) => p.video);
      const stills = (sec.piezas || []).filter((p) => !p.video && (p.imagenes || []).length);
      return `
        ${videos.length ? `<div class="player reveal">
          <div class="player__screen"><video id="mainVideo" controls playsinline preload="metadata" src="${esc(videos[0].video)}#t=0.5"></video></div>
          <ol class="player__list" aria-label="Lista de videos">${videos.map((v, i) => `
            <li><button class="vid ${i ? "" : "is-on"}" data-src="${esc(v.video)}"><video muted preload="metadata" src="${esc(v.video)}#t=2"></video><span><b>${pad(i + 1)}</b>${esc(v.titulo)}${v.etiqueta ? `<small>${esc(v.etiqueta)}</small>` : ""}</span></button></li>`).join("")}
          </ol></div>` : ""}
        ${stills.length ? `<div class="dynamo">${stills.map((p) => figure(p)).join("")}</div>` : ""}`;
    },

    ropa(sec) {
      return `${sec.lema ? `<p class="rastro__claim reveal" aria-hidden="true">${esc(sec.lema)}</p>` : ""}
        <div class="rastro__grid">${(sec.piezas || []).map((p, i) => figure(p, `arch ${i % 3 === 1 ? "arch--up" : ""}`)).join("")}</div>`;
    },
  };

  function render(data) {
    const secs = data.secciones || [];
    $("#capitulos").innerHTML = secs.map((sec, i) => `
      <section class="chapter ${sec.tema === "oscuro" ? "dark" : "paper"} ${sec.tipo === "ropa" ? "rastro" : ""}" id="${esc(sec.id)}" data-chapter="${esc(sec.titulo)}">
        <header class="chapter__head reveal">
          <span class="chapter__num">${pad(i + 1)}</span>
          <h2 class="chapter__title">${esc(sec.titulo)}</h2>
          ${sec.intro ? `<p class="chapter__intro">${esc(sec.intro)}</p>` : ""}
        </header>
        ${(LAYOUTS[sec.tipo] || LAYOUTS.galeria)(sec)}
      </section>`).join("");

    $(".topbar__nav").insertAdjacentHTML("beforeend", secs.map((s) => `<a href="#${esc(s.id)}">${esc(s.titulo)}</a>`).join(""));
    $(".hero__index").innerHTML = secs.map((s, i) => `<a href="#${esc(s.id)}"><b>${pad(i + 1)}</b>${esc(s.titulo)}</a>`).join("");
    $("#cards").innerHTML = secs.map((s, i) => `
      <li class="card card--${i % 4} reveal" style="--d:${i * 80}ms"><a href="#${esc(s.id)}">
        <span class="card__n">${pad(i + 1)}</span><span class="card__t">${esc(s.titulo)}</span>
        <span class="card__star" aria-hidden="true">✶</span><span class="card__big" aria-hidden="true">✶</span>
        ${s.resumen ? `<span class="card__d">${esc(s.resumen)} <b aria-hidden="true">→</b></span>` : ""}
      </a></li>`).join("");

    const c = data.contacto || {};
    const wa = String(c.whatsapp || "").replace(/\D/g, "");
    $("#contactList").innerHTML = [
      c.email && `<li><a href="mailto:${esc(c.email)}"><small>Correo</small>${esc(c.email)}</a></li>`,
      c.whatsapp && `<li><a href="https://wa.me/${wa.length === 10 ? "57" + wa : wa}" target="_blank" rel="noopener"><small>WhatsApp</small>${esc(c.whatsapp)}</a></li>`,
      c.instagram && `<li><a href="https://instagram.com/${esc(c.instagram.replace(/^@/, ""))}" target="_blank" rel="noopener"><small>Instagram</small>@${esc(c.instagram.replace(/^@/, ""))}</a></li>`,
    ].filter(Boolean).join("");
  }

  /* =========================================================
     INTERACCIÓN
     ========================================================= */
  function init() {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

    function numberPieces() {
      $$(".chapter").forEach((ch) => {
        const visible = $$("[data-piece]", ch).filter((p) => !p.classList.contains("is-hidden"));
        visible.forEach((p, i) => {
          const n = $(".piece__n", p);
          if (n) n.textContent = `${pad(i + 1)} / ${pad(visible.length)}`;
        });
      });
    }
    numberPieces();

    // barra superior
    const topbar = $("#topbar"), hero = $(".hero"), bar = $(".progress i");
    const darkSections = $$(".dark");
    function onScroll() {
      const y = window.scrollY;
      topbar.classList.toggle("is-visible", y > hero.offsetHeight * 0.6);
      const probe = y + 32;
      topbar.classList.toggle("on-dark", darkSections.some((s) => probe >= s.offsetTop && probe < s.offsetTop + s.offsetHeight));
      bar.style.width = `${(y / (document.documentElement.scrollHeight - innerHeight)) * 100}%`;
    }
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const menuBtn = $(".topbar__menu");
    menuBtn.addEventListener("click", () => menuBtn.setAttribute("aria-expanded", topbar.classList.toggle("menu-open")));
    $$(".topbar__nav a").forEach((a) => a.addEventListener("click", () => { topbar.classList.remove("menu-open"); menuBtn.setAttribute("aria-expanded", false); }));

    const links = new Map($$(".topbar__nav a").map((a) => [a.getAttribute("href").slice(1), a]));
    const sections = $$("section[id]");
    function spy() {
      const line = window.scrollY + innerHeight * 0.4;
      let current = sections[0];
      sections.forEach((s) => { if (s.offsetTop <= line) current = s; });
      links.forEach((a, id) => a.classList.toggle("is-active", id === current.id));
    }
    addEventListener("scroll", spy, { passive: true });
    spy();

    // títulos: cada letra llega desde un lado
    $$(".chapter__title").forEach((t) => {
      const text = t.textContent.trim();
      t.setAttribute("aria-label", text);
      const half = text.length / 2;
      t.innerHTML = [...text].map((c, i) =>
        `<span class="ch" aria-hidden="true" style="--i:${i};--from:${(i < half ? -1 : 1) * Math.round((Math.abs(i - half) + 2) * 18)}px">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
    });

    // máquina de escribir
    function type(el, delay = 0) {
      if (el.dataset.done) return;
      el.dataset.done = 1;
      const text = el.dataset.text;
      if (calm) { el.textContent = text; el.classList.add("is-typed"); return; }
      setTimeout(() => {
        el.classList.add("is-typing");
        let i = 0;
        const tick = () => {
          el.textContent = text.slice(0, ++i);
          if (i < text.length) setTimeout(tick, 28 + Math.random() * 45);
          else { el.classList.remove("is-typing"); el.classList.add("is-typed"); }
        };
        tick();
      }, delay);
    }
    $$("[data-type]").forEach((el) => { el.dataset.text = el.textContent.trim(); el.setAttribute("aria-label", el.dataset.text); el.textContent = ""; });
    $$(".hero [data-type]").forEach((el, i) => type(el, 1500 + i * 450));
    const typer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { type(e.target, 200); typer.unobserve(e.target); } });
    }, { threshold: 0.6 });
    $$("[data-type]").filter((el) => !el.closest(".hero")).forEach((el) => typer.observe(el));

    // entrada al hacer scroll
    const rev = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); rev.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el) => rev.observe(el));

    // filtros de fotografía
    $$(".filter").forEach((btn) => btn.addEventListener("click", () => {
      $$(".filter").forEach((b) => { b.classList.toggle("is-on", b === btn); b.setAttribute("aria-selected", b === btn); });
      const f = btn.dataset.filter;
      $$("#fotografia [data-series], .chapter [data-series]").forEach((el) => {
        el.classList.toggle("is-hidden", f !== "all" && el.dataset.series !== f);
        el.classList.add("is-in");
      });
      numberPieces();
    }));

    // comparador de color
    $$(".compare").forEach((c) => {
      const input = $("input", c);
      input.addEventListener("input", () => c.style.setProperty("--pos", `${input.value}%`));
    });

    // reproductor
    const main = $("#mainVideo");
    if (main) {
      $$(".vid").forEach((btn) => btn.addEventListener("click", () => {
        $$(".vid").forEach((b) => b.classList.toggle("is-on", b === btn));
        main.src = btn.dataset.src;
        main.play().catch(() => {});
      }));
      main.addEventListener("loadedmetadata", () => {
        const vertical = main.videoHeight > main.videoWidth;
        main.parentElement.style.aspectRatio = vertical ? "16 / 10" : `${main.videoWidth} / ${main.videoHeight}`;
      });
    }

    // visor: recorre las piezas en orden
    const lb = $("#lightbox");
    const lbImg = $(".lb__img", lb), lbTitle = $(".lb__title", lb), lbDesc = $(".lb__desc", lb), lbCount = $(".lb__count", lb);
    let list = [], idx = 0, lastFocus = null;
    const visiblePieces = () => $$("[data-piece]").filter((p) => !p.classList.contains("is-hidden"));
    function show(i) {
      idx = (i + list.length) % list.length;
      const p = list[idx], img = $("img", p);
      const ch = p.closest("[data-chapter]")?.dataset.chapter || "";
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbImg.style.animation = "none"; void lbImg.offsetWidth; lbImg.style.animation = "";
      lbTitle.textContent = $("h3", p)?.textContent || "";
      lbDesc.textContent = $("figcaption p", p)?.textContent || "";
      lbCount.textContent = `${ch.toUpperCase()} · ${$(".piece__n", p)?.textContent || ""}   —   pieza ${idx + 1} de ${list.length}`;
    }
    function open(p) {
      list = visiblePieces(); lastFocus = document.activeElement;
      lb.hidden = false; document.body.style.overflow = "hidden";
      show(list.indexOf(p));
      $(".lb__close", lb).focus();
    }
    function close() { lb.hidden = true; document.body.style.overflow = ""; lastFocus?.focus(); }
    $$("[data-piece]").forEach((p) => {
      p.tabIndex = 0;
      p.setAttribute("role", "button");
      p.setAttribute("aria-label", `Ver ${$("h3", p)?.textContent || "pieza"} en grande`);
      p.addEventListener("click", () => open(p));
      p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(p); } });
    });
    $(".lb__close", lb).addEventListener("click", close);
    $(".lb__prev", lb).addEventListener("click", () => show(idx - 1));
    $(".lb__next", lb).addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });
    let x0 = null;
    lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    // si se llegó con un #ancla, ir a esa sección ya armada
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }

  fetch("data/content.json", { cache: "no-store" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => { render(data); init(); })
    .catch((err) => {
      console.error("No se pudo cargar el contenido", err);
      $("#capitulos").innerHTML = `<p style="padding:80px 24px;text-align:center">No se pudo cargar el contenido. Abre la página con <code>node server.mjs site</code>.</p>`;
      init();
    });
})();
