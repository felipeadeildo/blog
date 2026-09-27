// Gera o mapa do /whoami: estados do Brasil, as cidades por onde passei e as rotas entre elas.
//
//   node tools/journey.mjs [caminho-do-geojson]
//
// Sem argumento, baixa os estados do click_that_hood (Code for Germany). A saída é
// `overrides/partials/journey.svg`, versionada e incluída na página via snippets; não edite à mão.
//
// O SVG só desenha. Quem move a câmera, acende estados e cidades, revela as rotas e põe o ônibus
// para rodar é o `whoami.js`, a partir dos atributos `data-*` emitidos aqui.

import { readFileSync, writeFileSync } from "node:fs";

const GEOJSON_URL = "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/brazil-states.geojson";
const OUTPUT = new URL("../overrides/partials/journey.svg", import.meta.url);

const SIZE = 1000;
const PADDING = 30;
const BOUNDS = { west: -74.2, east: -34.6, north: 5.4, south: -33.9 };
const LAT_CENTER = -15;
const EARTH_RADIUS_KM = 6371;

// Tolerância do Douglas-Peucker em unidades do SVG. A câmera chega perto no Nordeste e no Sudeste,
// então esses estados guardam mais detalhe; o resto do país só aparece de longe.
const TOLERANCE = { close: 0.15, near: 0.35, far: 0.9 };
const DETAIL = { PE: "close", AL: "close", SE: "close", PB: "close", BA: "near", SP: "near", RJ: "near", MG: "near", SC: "near", PR: "near" };
// Ilhas menores que isso (em unidades² do SVG) somem; Fernando de Noronha não entra na história.
const MIN_RING_AREA = 0.6;

const PLACES = [
  { id: "cabo", name: "Cabo de Santo Agostinho", state: "PE", lat: -8.283, lon: -35.035, side: "right" },
  { id: "coruripe", name: "Coruripe", state: "AL", lat: -10.125, lon: -36.176, side: "left" },
  { id: "maceio", name: "Maceió", state: "AL", lat: -9.665, lon: -35.735, side: "right" },
  { id: "valinhos", name: "Valinhos", state: "SP", lat: -22.97, lon: -46.996, side: "left" },
  { id: "sao-paulo", name: "São Paulo", state: "SP", lat: -23.55, lon: -46.633, side: "left" },
  { id: "rio", name: "Rio de Janeiro", state: "RJ", lat: -22.963, lon: -43.23, side: "right" },
  { id: "florianopolis", name: "Florianópolis", state: "SC", lat: -27.595, lon: -48.548, side: "right" },
];

// `road` e `commute` vão por terra e passam pelos `via` (lat, lon), suavizados com Catmull-Rom.
// `flight` e `remote` são arcos; `bend` curva para a esquerda (positivo) ou para a direita (negativo).
// Voos curvam para o interior e o que foi online curva para o oceano, para as linhas não se cruzarem.
// `remote` é algo que viajou sem mim e não conta no hodômetro.
const ROUTES = [
  {
    id: "cabo-coruripe",
    from: "cabo",
    to: "coruripe",
    kind: "road",
    // AL-101 Norte e Sul, pela costa: Sirinhaém, Tamandaré, Maragogi, Barra de Santo Antônio, Maceió, Barra de São Miguel.
    via: [[-8.59, -35.115], [-8.75, -35.105], [-9.012, -35.222], [-9.405, -35.507], [-9.62, -35.71], [-9.838, -35.906], [-10.01, -36.01]],
  },
  {
    id: "coruripe-maceio-weekly",
    from: "coruripe",
    to: "maceio",
    kind: "commute",
    // Por dentro, via São Miguel dos Campos.
    via: [[-9.95, -36.16], [-9.781, -36.097], [-9.7, -35.9]],
  },
  { id: "coruripe-rio", from: "coruripe", to: "rio", kind: "remote", bend: -0.2 },
  {
    id: "coruripe-maceio",
    from: "coruripe",
    to: "maceio",
    kind: "road",
    // AL-101 Sul, pela costa: Jequiá da Praia, Barra de São Miguel, Marechal Deodoro.
    via: [[-10.013, -36.014], [-9.838, -35.906], [-9.71, -35.84]],
  },
  { id: "maceio-florianopolis", from: "maceio", to: "florianopolis", kind: "remote", bend: -0.12 },
  { id: "maceio-valinhos", from: "maceio", to: "valinhos", kind: "flight", bend: 0.2 },
  { id: "maceio-sao-paulo", from: "maceio", to: "sao-paulo", kind: "flight", bend: 0.07 },
  { id: "maceio-rio", from: "maceio", to: "rio", kind: "flight", bend: 0.1 },
  {
    id: "rio-sao-paulo",
    from: "rio",
    to: "sao-paulo",
    kind: "road",
    // Via Dutra: Resende, Taubaté, São José dos Campos.
    via: [[-22.8, -43.6], [-22.47, -44.45], [-23.03, -45.56], [-23.18, -45.88]],
  },
  { id: "sao-paulo-rio", from: "sao-paulo", to: "rio", kind: "remote", bend: 0.35 },
];

const cosCenter = Math.cos((LAT_CENTER * Math.PI) / 180);
const scale = Math.min(
  (SIZE - 2 * PADDING) / ((BOUNDS.east - BOUNDS.west) * cosCenter),
  (SIZE - 2 * PADDING) / (BOUNDS.north - BOUNDS.south),
);

function project(lon, lat) {
  return [PADDING + (lon - BOUNDS.west) * cosCenter * scale, PADDING + (BOUNDS.north - lat) * scale];
}

function haversine(a, b) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = radians(b.lat - a.lat);
  const dLon = radians(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function perpendicularDistance([x, y], [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return Math.hypot(x - x1, y - y1);
  }
  return Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / length;
}

function simplify(points, tolerance) {
  if (points.length < 3) {
    return points;
  }

  let farthest = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], points[0], points.at(-1));
    if (distance > farthest) {
      farthest = distance;
      index = i;
    }
  }

  if (farthest <= tolerance) {
    return [points[0], points.at(-1)];
  }
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
}

function area(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function ringPath(ring, tolerance) {
  const points = simplify(ring.map(([lon, lat]) => project(lon, lat)), tolerance);
  if (points.length < 4 || area(points) < MIN_RING_AREA) {
    return "";
  }

  const [first, ...rest] = points.slice(0, -1).map(([x, y]) => [round(x), round(y)]);
  return `M${first}L${rest.join("L")}Z`;
}

function statePath(geometry, state) {
  const tolerance = TOLERANCE[DETAIL[state] ?? "far"];
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((rings) => rings.map((ring) => ringPath(ring, tolerance))).join("");
}

function arcPath(route, points) {
  const [x1, y1] = points.get(route.from);
  const [x2, y2] = points.get(route.to);
  const controlX = (x1 + x2) / 2 - (y2 - y1) * route.bend;
  const controlY = (y1 + y2) / 2 + (x2 - x1) * route.bend;
  return `M${round(x1)},${round(y1)}Q${round(controlX)},${round(controlY)} ${round(x2)},${round(y2)}`;
}

// Catmull-Rom uniforme convertido em cúbicas: a curva passa por todos os pontos da estrada.
function roadPath(route, points) {
  const path = [points.get(route.from), ...route.via.map(([lat, lon]) => project(lon, lat)), points.get(route.to)];
  let d = `M${round(path[0][0])},${round(path[0][1])}`;

  for (let i = 0; i < path.length - 1; i += 1) {
    const p0 = path[Math.max(0, i - 1)];
    const [p1, p2] = [path[i], path[i + 1]];
    const p3 = path[Math.min(path.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${round(c1[0])},${round(c1[1])} ${round(c2[0])},${round(c2[1])} ${round(p2[0])},${round(p2[1])}`;
  }
  return d;
}

function routePath(route, points) {
  return route.via ? roadPath(route, points) : arcPath(route, points);
}

// Por terra soma os trechos entre os pontos; pelo ar é a distância em linha reta.
function routeKm(route, places) {
  const stops = [places.get(route.from), ...(route.via ?? []).map(([lat, lon]) => ({ lat, lon })), places.get(route.to)];
  let km = 0;
  for (let i = 0; i < stops.length - 1; i += 1) {
    km += haversine(stops[i], stops[i + 1]);
  }
  return Math.round(km / 10) * 10;
}

async function loadStates(path) {
  if (path) {
    return JSON.parse(readFileSync(path, "utf8"));
  }
  const response = await fetch(GEOJSON_URL);
  if (!response.ok) {
    throw new Error(`geojson: HTTP ${response.status}`);
  }
  return response.json();
}

const { features } = await loadStates(process.argv[2]);
const byId = new Map(PLACES.map((place) => [place.id, place]));
const points = new Map(PLACES.map((place) => [place.id, project(place.lon, place.lat)]));
const kms = new Map(ROUTES.map((route) => [route.id, routeKm(route, byId)]));

const states = features
  .map((feature) => {
    const state = feature.properties.sigla;
    return `<path class="map__state" data-state="${state}" d="${statePath(feature.geometry, state)}"/>`;
  })
  .join("");

const masks = [];
const routes = ROUTES.map(function (route) {
  const d = routePath(route, points);
  masks.push(
    `<mask id="reveal-${route.id}" maskUnits="userSpaceOnUse" x="-500" y="-500" width="2000" height="2000">` +
      `<path class="map__reveal" data-reveal="${route.id}" d="${d}"/></mask>`,
  );
  return (
    `<path class="map__route map__route--${route.kind}" data-route="${route.id}" data-kind="${route.kind}" data-from="${route.from}" data-to="${route.to}" ` +
    `data-km="${kms.get(route.id)}" mask="url(#reveal-${route.id})" d="${d}"/>`
  );
}).join("");

const cities = PLACES.map(function (place) {
  const [x, y] = points.get(place.id).map(round);
  const labelX = place.side === "left" ? -10 : 10;
  const anchor = place.side === "left" ? "end" : "start";
  return [
    `<g class="map__city" data-place="${place.id}" data-name="${place.name}" data-state="${place.state}" `,
    `data-lat="${place.lat}" data-lon="${place.lon}" data-x="${x}" data-y="${y}" transform="translate(${x} ${y})">`,
    `<g class="map__marker">`,
    `<circle class="map__pulse" r="5"/><circle class="map__dot" r="4.5"/>`,
    `<text class="map__label" x="${labelX}" y="4" text-anchor="${anchor}">${place.name}</text>`,
    "</g></g>",
  ].join("");
}).join("");

const svg = [
  `<svg class="map" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="Map of Brazil with the places in this story">`,
  "<defs>",
  `<pattern id="map-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="0.9"/></pattern>`,
  masks.join(""),
  "</defs>",
  `<g class="map__states">${states}</g>`,
  `<g class="map__routes">${routes}</g>`,
  `<g class="map__comet" transform="translate(-100 -100)"><circle r="4"/></g>`,
  `<g class="map__bus" transform="translate(-100 -100)"><circle r="3.5"/></g>`,
  `<g class="map__cities">${cities}</g>`,
  "</svg>",
].join("");

writeFileSync(OUTPUT, `${svg}\n`);

const total = ROUTES.filter((route) => route.kind !== "remote").reduce((sum, route) => sum + kms.get(route.id), 0);
console.log(`journey.svg: ${(svg.length / 1024).toFixed(1)} KiB, ${total} km on the road`);
