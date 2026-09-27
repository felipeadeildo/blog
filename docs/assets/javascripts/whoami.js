// /whoami: a história rola de um lado e o mapa acompanha do outro.
//
// Cada `.chapter` declara, em `data-*`, onde a câmera olha (`view`), onde eu estou (`place`),
// que rotas começam ali (`routes`), que estados acendem (`states`) e se alguma rota fica
// rodando em vaivém (`loop`). A rolagem vira uma posição contínua na história (2.4 = 40% do
// caminho entre o capítulo 2 e o 3); câmera, rotas e hodômetro são funções dessa posição, e a
// posição exibida persegue a da rolagem com amortecimento. Rolar para trás desfaz tudo.

// A transição para um capítulo começa quando a data dele entra na tela (READING_LINE + ZONE ≈ 1)
// e termina quando ela chega à linha de leitura, em alturas de tela a partir do topo.
const READING_LINE = 0.66;
const TRANSITION_ZONE = 0.4;
const MOBILE_READING_LINE = 0.78;
const MOBILE_TRANSITION_ZONE = 0.25;
// Constante de tempo do amortecimento, em ms: maior deixa o mapa mais "pesado", e mais atrasado.
const DAMPING_MS = 110;
const BUS_PERIOD_MS = 2600;
const FIT_PADDING = 0.45;
const MIN_VIEW_WIDTH = 70;
const COUNTRY = { cx: 500, cy: 500, w: 1000 };
const COUNTED_KINDS = new Set(["road", "commute", "flight"]);

const BROWSERS = [
  [/Edg\//, "edge"],
  [/OPR\/|Opera/, "opera"],
  [/Vivaldi/, "vivaldi"],
  [/Firefox\//, "firefox"],
  [/Chrome\//, "chrome"],
  [/Safari\//, "safari"],
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobile = window.matchMedia("(max-width: 59.9375em)");

const NBSP = "\u00a0";

const PLATFORMS = [
  [/Android/, "android"],
  [/iPhone|iPad/, "ios"],
  [/Mac OS X/, "macos"],
  [/Windows/, "windows"],
  [/CrOS/, "chromeos"],
  [/Linux/, "linux"],
];

let teardowns = [];

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function list(value) {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function formatCoords(lat, lon) {
  const ns = lat < 0 ? "S" : "N";
  const ew = lon < 0 ? "W" : "E";
  return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lon).toFixed(2)}°${ew}`;
}

function detect(table, fallback) {
  const match = table.find(([pattern]) => pattern.test(navigator.userAgent));
  return match ? match[1] : fallback;
}

async function browserName() {
  if (navigator.brave && (await navigator.brave.isBrave())) {
    return "brave";
  }
  return detect(BROWSERS, "browser");
}

// O fastfetch diz `adeildo@<navegador de quem lê>`; a régua embaixo acompanha o tamanho.
async function nameHost(body) {
  const host = body.querySelector("[data-fetch='host']");
  const rule = body.querySelector("[data-fetch='rule']");
  if (!host) {
    return;
  }
  const browser = await browserName();
  const platform = detect(PLATFORMS, null);
  host.textContent = browser;
  host.dataset.tip = platform ? `that's you, on ${browser} for ${platform}` : "that's you";
  rule.textContent = "-".repeat(host.parentElement.textContent.trim().length);
}

function unitFor(count, unit) {
  return count === 1 ? unit : `${unit}s`;
}

function plural(count, unit) {
  return `${count} ${unitFor(count, unit)}`;
}

// Uma parte do uptime com largura fixa: número alinhado à direita em `digits` casas e espaço
// reservado para o plural, para a linha não dançar a cada segundo.
function uptimePart(count, unit, digits, separator) {
  const text = `${String(count).padStart(digits, NBSP)} ${unitFor(count, unit)}${separator}`;
  const widest = digits + 1 + unit.length + 1 + separator.length;
  return text.padEnd(widest, NBSP);
}

// Tempo desde `since` no calendário do fuso de `since` (anos cheios, depois dias, horas...),
// no formato do uptime do fastfetch.
function uptime(since, now) {
  const offset = Number(since.slice(-6, -3)) * 3600e3;
  const start = new Date(new Date(since).getTime() + offset);
  const end = new Date(now + offset);

  let years = end.getUTCFullYear() - start.getUTCFullYear();
  const anniversary = new Date(start);
  anniversary.setUTCFullYear(start.getUTCFullYear() + years);
  if (anniversary > end) {
    years -= 1;
    anniversary.setUTCFullYear(start.getUTCFullYear() + years);
  }

  const seconds = Math.floor((end - anniversary) / 1000);
  return [
    uptimePart(years, "year", 2, ","),
    uptimePart(Math.floor(seconds / 86400), "day", 3, ","),
    uptimePart(Math.floor(seconds / 3600) % 24, "hour", 2, ","),
    uptimePart(Math.floor(seconds / 60) % 60, "min", 2, ","),
    uptimePart(seconds % 60, "sec", 2, ""),
  ].join(" ");
}

// Campos vivos do fastfetch: `uptime` roda a cada segundo, `years` conta anos desde um ano.
function setupLiveFields(body) {
  const fields = Array.from(body.querySelectorAll("[data-live]"));
  if (fields.length === 0) {
    return null;
  }

  function update() {
    for (const field of fields) {
      const { live, since } = field.dataset;
      if (live === "uptime") {
        field.textContent = uptime(since, Date.now());
      } else if (live === "years") {
        field.textContent = `${plural(new Date().getFullYear() - Number(since), "year")}, since ${since}`;
      }
    }
  }

  update();
  const timer = setInterval(update, 1000);
  return function () {
    clearInterval(timer);
  };
}

function setupStory(story) {
  const svg = story.querySelector(".map");
  const frame = story.querySelector(".story__map");
  const rail = story.querySelector(".rail");
  const chapters = Array.from(story.querySelectorAll(".chapter"));
  if (!svg || !frame || !rail || chapters.length === 0) {
    return null;
  }
  const heads = chapters.map((chapter) => chapter.querySelector(".chapter__head"));

  const hud = {
    root: story.querySelector(".hud--top"),
    place: story.querySelector("[data-hud='place']"),
    coords: story.querySelector("[data-hud='coords']"),
    when: story.querySelector("[data-hud='when']"),
    km: story.querySelector("[data-hud='km']"),
  };

  const cities = new Map(
    Array.from(svg.querySelectorAll(".map__city"), (node) => [
      node.dataset.place,
      { node, marker: node.querySelector(".map__marker"), x: Number(node.dataset.x), y: Number(node.dataset.y) },
    ]),
  );
  const routes = new Map(
    Array.from(svg.querySelectorAll(".map__route"), (node) => {
      const reveal = svg.querySelector(`[data-reveal="${node.dataset.route}"]`);
      const { kind, from, to } = node.dataset;
      const length = node.getTotalLength();
      reveal.setAttribute("stroke-dasharray", `${length} ${length}`);
      return [node.dataset.route, { node, reveal, kind, from, to, length, km: Number(node.dataset.km) }];
    }),
  );
  const states = Array.from(svg.querySelectorAll(".map__state"));
  const pattern = svg.querySelector("#map-dots");
  const patternDot = pattern.querySelector("circle");
  const comet = svg.querySelector(".map__comet");
  const bus = svg.querySelector(".map__bus");
  let markers = [];

  function aspect() {
    return frame.clientWidth / Math.max(1, frame.clientHeight);
  }

  function fit(ids) {
    if (ids.includes("all")) {
      const ratio = aspect();
      return { ...COUNTRY, w: ratio >= 1 ? COUNTRY.w * ratio : COUNTRY.w };
    }

    const points = ids.map((id) => cities.get(id)).filter(Boolean);
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const w = Math.max(MIN_VIEW_WIDTH, width, height * aspect()) * (1 + 2 * FIT_PADDING);
    return { cx: (Math.max(...xs) + Math.min(...xs)) / 2, cy: (Math.max(...ys) + Math.min(...ys)) / 2, w };
  }

  // Estado 0 é a abertura (o país inteiro, nada desenhado); o estado k é o capítulo k - 1.
  // Cada estado acumula as rotas e cidades de todos os anteriores.
  const steps = [{ view: ["all"], drawn: new Set(), shown: new Set(), place: null, states: new Set(), when: "", loop: null }];
  for (const chapter of chapters) {
    const previous = steps.at(-1);
    const own = list(chapter.dataset.routes);
    const place = chapter.dataset.place || previous.place;
    const view = list(chapter.dataset.view);
    const shown = new Set(previous.shown);
    for (const id of [place, ...view, ...own.flatMap((route) => [routes.get(route).from, routes.get(route).to])]) {
      if (cities.has(id)) {
        shown.add(id);
      }
    }
    steps.push({
      chapter,
      view: view.length > 0 ? view : [place],
      drawn: new Set([...previous.drawn, ...own]),
      shown,
      place,
      states: new Set(list(chapter.dataset.states)),
      when: chapter.dataset.when ?? "",
      loop: chapter.dataset.loop ?? null,
    });
  }

  let cameras = steps.map((step) => fit(step.view));
  let target = 0;
  let position = 0;
  let current = -1;
  let frameRequest = 0;
  let lastFrame = 0;
  let busStart = 0;

  // Voo em arco entre duas vistas: a largura interpola em escala log (o zoom parece constante)
  // e abre no meio do caminho quando os dois pontos não cabem juntos na tela.
  function cameraAt(a, b, t) {
    const e = easeInOut(t);
    const distance = Math.hypot(b.cx - a.cx, b.cy - a.cy);
    const base = Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * e);
    const lift = Math.max(0, distance * 1.3 - Math.max(a.w, b.w)) * Math.sin(Math.PI * e);
    return { cx: a.cx + (b.cx - a.cx) * e, cy: a.cy + (b.cy - a.cy) * e, w: base + lift };
  }

  function progressOf(id, index, t) {
    const before = steps[index].drawn.has(id) ? 1 : 0;
    const after = steps[Math.min(index + 1, steps.length - 1)].drawn.has(id) ? 1 : 0;
    return before + (after - before) * smoothstep(t);
  }

  function render(now) {
    const index = Math.min(Math.floor(position), steps.length - 1);
    const t = position - index;
    const next = Math.min(index + 1, steps.length - 1);
    const camera = cameraAt(cameras[index], cameras[next], t);
    const unit = camera.w / Math.max(1, frame.clientWidth);
    const h = camera.w / aspect();
    svg.setAttribute("viewBox", `${camera.cx - camera.w / 2} ${camera.cy - h / 2} ${camera.w} ${h}`);

    // Tudo que tem tamanho fixo na tela é multiplicado por `unit` (unidades do SVG por pixel).
    for (const city of cities.values()) {
      city.marker.setAttribute("transform", `scale(${unit})`);
    }
    pattern.setAttribute("width", 7 * unit);
    pattern.setAttribute("height", 7 * unit);
    patternDot.setAttribute("cx", 3.5 * unit);
    patternDot.setAttribute("cy", 3.5 * unit);
    patternDot.setAttribute("r", 0.9 * unit);

    let km = 0;
    let tip = null;
    for (const [id, route] of routes) {
      const progress = progressOf(id, index, t);
      route.node.setAttribute("stroke-width", (route.kind === "commute" ? 1.6 : 2) * unit);
      route.reveal.setAttribute("stroke-width", 14 * unit);
      route.reveal.setAttribute("stroke-dashoffset", route.length * (1 - progress));
      if (route.kind === "flight") {
        route.node.setAttribute("stroke-dasharray", `${6 * unit} ${5 * unit}`);
      } else if (route.kind === "remote") {
        route.node.setAttribute("stroke-dasharray", `${0.1 * unit} ${6 * unit}`);
      }
      if (COUNTED_KINDS.has(route.kind)) {
        km += route.km * progress;
      }
      if (progress > 0.001 && progress < 0.999) {
        tip = { route, progress };
      }
    }
    hud.km.textContent = Math.round(km).toLocaleString("en-US");

    if (tip) {
      const point = tip.route.node.getPointAtLength(tip.route.length * tip.progress);
      comet.setAttribute("transform", `translate(${point.x} ${point.y}) scale(${unit})`);
      comet.dataset.kind = tip.route.kind;
    }
    comet.classList.toggle("is-flying", tip !== null);

    // O ônibus de sábado: vaivém contínuo enquanto o capítulo dele está na tela.
    const loop = steps[Math.round(position)].loop;
    const busRoute = loop && routes.get(loop);
    if (busRoute && progressOf(loop, index, t) > 0.99) {
      busStart ||= now;
      const phase = ((now - busStart) % (2 * BUS_PERIOD_MS)) / BUS_PERIOD_MS;
      const along = smoothstep(phase <= 1 ? phase : 2 - phase);
      const point = busRoute.node.getPointAtLength(busRoute.length * along);
      bus.setAttribute("transform", `translate(${point.x} ${point.y}) scale(${unit})`);
      bus.classList.add("is-running");
    } else {
      busStart = 0;
      bus.classList.remove("is-running");
    }

    renderRail(index, t);
    activate(Math.round(position));
    return Boolean(busRoute);
  }

  // Centro vertical do marco de cada capítulo, relativo ao contêiner dos capítulos.
  function measureRail() {
    const origin = rail.parentElement.getBoundingClientRect().top;
    markers = heads.map(function (head) {
      const dot = getComputedStyle(head, "::before");
      return head.getBoundingClientRect().top - origin + parseFloat(dot.top) + parseFloat(dot.height) / 2;
    });
    rail.style.setProperty("--rail-start", `${markers[0]}px`);
    rail.style.setProperty("--rail-end", `${markers.at(-1)}px`);
  }

  // O preenchimento vai do marco do capítulo atual ao do próximo, na mesma posição da câmera.
  function renderRail(index, t) {
    const from = markers[Math.max(0, index - 1)];
    const to = markers[Math.min(markers.length - 1, index)];
    const y = index === 0 ? markers[0] : from + (to - from) * smoothstep(t);
    rail.style.setProperty("--rail-fill", `${y - markers[0]}px`);
    rail.style.setProperty("--rail-tip", index === 0 ? smoothstep(t).toFixed(3) : "1");
    for (const [position, chapter] of chapters.entries()) {
      chapter.classList.toggle("is-passed", position < index - 1 || (position === index - 1 && t > 0.5));
    }
  }

  // O que não interpola (textos, estados acesos, cidade atual) troca no meio da transição.
  function activate(index) {
    if (index === current) {
      return;
    }
    current = index;
    const step = steps[index];

    for (const chapter of chapters) {
      chapter.classList.toggle("is-active", chapter === step.chapter);
    }
    for (const [id, city] of cities) {
      city.node.classList.toggle("is-shown", step.shown.has(id));
      city.node.classList.toggle("is-current", id === step.place);
      city.node.classList.toggle("is-labeled", id === step.place || step.view.includes(id));
    }
    for (const state of states) {
      state.classList.toggle("is-lit", step.states.has(state.dataset.state));
    }

    const place = step.place ? cities.get(step.place).node.dataset : null;
    hud.place.textContent = place ? `${place.name.toLowerCase()}, ${place.state.toLowerCase()}` : "brazil";
    hud.coords.textContent = place ? formatCoords(Number(place.lat), Number(place.lon)) : "";
    hud.when.textContent = step.when;
    hud.root.classList.remove("is-changing");
    void hud.root.offsetWidth;
    hud.root.classList.add("is-changing");
  }

  function tick(now) {
    frameRequest = 0;
    const dt = lastFrame ? now - lastFrame : 16;
    lastFrame = now;

    if (reducedMotion.matches) {
      position = target;
    } else {
      position += (target - position) * (1 - Math.exp(-dt / DAMPING_MS));
      if (Math.abs(target - position) < 0.0005) {
        position = target;
      }
    }

    const looping = render(now);
    if (position !== target || (looping && !reducedMotion.matches)) {
      frameRequest = requestAnimationFrame(tick);
    } else {
      lastFrame = 0;
    }
  }

  function wake() {
    if (!frameRequest) {
      frameRequest = requestAnimationFrame(tick);
    }
  }

  // Posição da rolagem na história: número de capítulos cuja data já passou da linha de leitura,
  // mais a fração da zona de transição que o próximo já percorreu. Mede-se pela data, e não pelo
  // topo da seção, porque o texto é centrado na seção e começa bem abaixo dela.
  function measure() {
    const line = window.innerHeight * (mobile.matches ? MOBILE_READING_LINE : READING_LINE);
    const zone = window.innerHeight * (mobile.matches ? MOBILE_TRANSITION_ZONE : TRANSITION_ZONE);
    const tops = heads.map((head) => head.getBoundingClientRect().top);
    const passed = tops.filter((top) => top <= line).length;
    const fraction = passed < tops.length ? clamp(1 - (tops[passed] - line) / zone) : 0;
    target = passed + fraction;

    for (const chapter of chapters) {
      const rect = chapter.getBoundingClientRect();
      const distance = Math.abs(rect.top + Math.min(rect.height, window.innerHeight) / 2 - line);
      chapter.style.setProperty("--focus", (1 - clamp(distance / (window.innerHeight * 0.75))).toFixed(3));
    }
    wake();
  }

  function onResize() {
    cameras = steps.map((step) => fit(step.view));
    measureRail();
    measure();
  }

  // Clicar numa cidade leva ao primeiro capítulo que se passa nela.
  function onMapClick(event) {
    const city = event.target.closest(".map__city.is-shown");
    const chapter = city && chapters.find((node) => node.dataset.place === city.dataset.place);
    chapter?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
  }

  story.classList.add("is-live");
  measureRail();
  document.fonts?.ready.then(onResize);
  measure();
  position = target;
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", onResize);
  svg.addEventListener("click", onMapClick);

  return function () {
    window.removeEventListener("scroll", measure);
    window.removeEventListener("resize", onResize);
    svg.removeEventListener("click", onMapClick);
    cancelAnimationFrame(frameRequest);
  };
}

document$.subscribe(function ({ body }) {
  for (const teardown of teardowns) {
    teardown();
  }

  nameHost(body);
  const story = body.querySelector(".story");
  teardowns = [setupLiveFields(body), story && setupStory(story)].filter(Boolean);
});
