const SITE_ROOT = new URL("../../", document.currentScript.src);
const BLOG_DIR = "log/";
const CHORD_TIMEOUT = 800;
const PREVIEW_LENGTH = 420;

const SHORTCUTS = {
  h: "",
  l: "log/",
  w: "wiki/",
  i: "whoami/",
};

const ICONS = {
  home: "house",
  dir: "folder",
  post: "file-text",
  doc: "file",
  archive: "calendar",
  category: "tag",
  exec: "square-terminal",
  section: "hash",
  command: "chevron-right",
};

const KIND_LABELS = {
  home: "home",
  dir: "directory",
  post: "post",
  doc: "page",
  archive: "archive",
  category: "category",
  exec: "executable",
  section: "section",
  command: "command",
};

const CHILD_ORDER = ["dir", "post", "doc", "exec", "archive", "category"];
const NO_HIGHLIGHTS = { title: [], path: [] };

const COMMANDS = [
  { name: "cd log/", description: "open the log", run: () => navigate("log/") },
  { name: "cd wiki/", description: "open the wiki", run: () => navigate("wiki/") },
  { name: "cd ..", description: "go up one level", run: goUp },
  { name: "cd ~", description: "go back home", run: () => navigate("") },
  { name: "whoami", description: "who I am and what I'm working on", run: () => navigate("whoami/") },
  { name: "ls", description: "show the site tree", run: () => setQuery("") },
  { name: "theme", description: "switch between light and dark", run: toggleTheme },
  { name: "help", description: "shortcuts and commands", run: () => setQuery("help") },
].map((command) => ({ ...command, kind: "command", title: command.name }));

const HELP = [
  ["/  ctrl+k", "open this terminal"],
  ["↑ ↓  ctrl+p ctrl+n", "move the selection"],
  ["→ ←", "move between the list and the preview"],
  ["↵", "open the result"],
  ["ctrl+↵", "open in a new tab"],
  ["tab", "complete the command"],
  ["esc", "close; outside the terminal, go up one level"],
  ["t", "toggle the theme"],
  ["g h  g l  g w  g i", "home, log, wiki and whoami"],
];

const state = {
  entries: null,
  pages: null,
  rows: [],
  selected: 0,
  pane: "list",
  previewItems: [],
  previewSelected: 0,
  lastFocus: null,
  chordStarted: 0,
};

let ui = null;
let iconTemplate = null;

function normalize(text) {
  return Array.from(text.toLowerCase(), (char) => char.normalize("NFD")[0]).join("");
}

function stripHtml(html) {
  return new DOMParser().parseFromString(html, "text/html").body.textContent.trim();
}

function isWordStart(text, index) {
  return index === 0 || /[\s/\-_#.]/.test(text[index - 1]);
}

function fuzzyMatch(term, text) {
  const haystack = normalize(text);
  const positions = [];
  let score = 0;
  let cursor = 0;

  for (const char of term) {
    const index = haystack.indexOf(char, cursor);
    if (index === -1) {
      return null;
    }

    let bonus = 1;
    if (positions.length > 0 && index === positions.at(-1) + 1) {
      bonus += 6;
    }
    if (isWordStart(haystack, index)) {
      bonus += 8;
    }

    score += bonus;
    positions.push(index);
    cursor = index + 1;
  }

  score -= (positions.at(-1) - positions[0]) * 0.2;
  return { score, positions };
}

function matchEntry(terms, entry) {
  const title = [];
  const path = [];
  let score = 0;

  for (const term of terms) {
    const onTitle = fuzzyMatch(term, entry.title);
    const onPath = fuzzyMatch(term, entry.path);

    if (onTitle && (!onPath || onTitle.score * 2 >= onPath.score)) {
      score += onTitle.score * 2;
      title.push(...onTitle.positions);
    } else if (onPath) {
      score += onPath.score;
      path.push(...onPath.positions);
    } else if (normalize(entry.text).includes(term)) {
      score += 2;
    } else {
      return null;
    }
  }

  if (entry.kind !== "section") {
    score += 4;
  }
  return { entry, score, highlights: { title, path } };
}

function matchCommand(terms, command) {
  const query = terms.join(" ");
  const match = fuzzyMatch(query.replaceAll(" ", ""), command.name.replaceAll(" ", ""));
  if (!match) {
    return null;
  }

  const prefixBonus = command.name.startsWith(query) ? 40 : 0;
  return { entry: command, score: match.score * 2 + prefixBonus, highlights: NO_HIGHLIGHTS };
}

function segmentsOf(page) {
  return page.split("/").filter(Boolean);
}

function classify(page, pages) {
  if (page === "") {
    return "home";
  }
  if (page === BLOG_DIR || pages.some((other) => other !== page && other.startsWith(page))) {
    return "dir";
  }
  if (page.startsWith(`${BLOG_DIR}archive/`)) {
    return "archive";
  }
  if (page.startsWith(`${BLOG_DIR}category/`)) {
    return "category";
  }
  if (page.startsWith(BLOG_DIR)) {
    return "post";
  }
  if (segmentsOf(page).length === 1) {
    return "exec";
  }
  return "doc";
}

function parentOf(page) {
  const segments = segmentsOf(page);
  while (segments.length > 0) {
    segments.pop();
    const candidate = segments.length > 0 ? `${segments.join("/")}/` : "";
    if (state.pages.has(candidate)) {
      return candidate;
    }
  }
  return "";
}

function childrenOf(page) {
  return state.entries
    .filter((entry) => entry.kind !== "section" && entry.page !== "" && entry.page !== page && parentOf(entry.page) === page)
    .sort(function (a, b) {
      const byKind = CHILD_ORDER.indexOf(a.kind) - CHILD_ORDER.indexOf(b.kind);
      if (byKind !== 0) {
        return byKind;
      }
      return a.kind === "post" ? b.page.localeCompare(a.page) : a.title.localeCompare(b.title);
    });
}

function sectionsOf(page) {
  return state.entries.filter((entry) => entry.kind === "section" && entry.page === page);
}

function treeRows(page = "", depth = 0) {
  const rows = [];
  const children = childrenOf(page);

  for (const [index, entry] of children.entries()) {
    let branch = "";
    if (depth > 0) {
      branch = index === children.length - 1 ? "└─" : "├─";
    }
    rows.push({ entry, depth, branch, highlights: NO_HIGHLIGHTS });
    if (entry.kind === "dir") {
      rows.push(...treeRows(entry.page, depth + 1));
    }
  }
  return rows;
}

function listRows(query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    const home = state.entries.find((entry) => entry.kind === "home");
    return [{ entry: home, depth: 0, branch: "", highlights: NO_HIGHLIGHTS }, ...treeRows()];
  }

  const commands = COMMANDS.map((command) => matchCommand(terms, command)).filter(Boolean);
  const entries = state.entries.map((entry) => matchEntry(terms, entry)).filter(Boolean);
  return [...commands, ...entries].sort((a, b) => b.score - a.score).map((result) => ({ ...result, depth: 0, branch: "" }));
}

async function loadEntries() {
  if (state.entries !== null) {
    return;
  }

  const response = await fetch(new URL("search.json", SITE_ROOT));
  const { items } = await response.json();
  const pages = items.map((item) => item.location).filter((location) => !location.includes("#"));

  state.pages = new Set(pages);
  state.entries = items.map(function (item) {
    const [page, anchor] = item.location.split("#");
    return {
      kind: anchor ? "section" : classify(page, pages),
      title: item.title,
      path: `~/${page.replace(/\/$/, "")}${anchor ? `#${anchor}` : ""}`,
      page,
      location: item.location,
      text: stripHtml(item.text),
    };
  });
}

function currentPath() {
  return decodeURI(window.location.pathname).slice(decodeURI(SITE_ROOT.pathname).length);
}

async function goUp() {
  await loadEntries();
  const path = currentPath();

  if (path === "") {
    close();
    return;
  }
  navigate(parentOf(path));
}

function navigate(location, newTab = false) {
  const url = new URL(location, SITE_ROOT);
  close();

  if (newTab) {
    window.open(url, "_blank", "noopener");
    return;
  }

  const link = Object.assign(document.createElement("a"), { href: url.href });
  document.body.append(link);
  link.click();
  link.remove();
}

function hasOverlayOpen() {
  return document.querySelector("#__drawer:checked, #__search:checked") !== null;
}

function toggleTheme() {
  close();
  document.querySelector("[data-md-component='palette'] input:not(:checked)")?.click();
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function icon(kind) {
  iconTemplate ??= document.getElementById("fzf-icons")?.content;
  const node = element("span", `fzf__icon fzf__icon--${kind}`);
  node.setAttribute("aria-hidden", "true");

  const svg = iconTemplate?.querySelector(`[data-icon="${ICONS[kind]}"] svg`);
  if (svg) {
    node.append(svg.cloneNode(true));
  }
  return node;
}

function highlighted(text, positions, className) {
  const node = element("span", className);
  const marks = new Set(positions);

  for (const [index, char] of Array.from(text).entries()) {
    if (marks.has(index)) {
      node.append(element("b", "fzf__hit", char));
    } else {
      node.append(char);
    }
  }
  return node;
}

function build() {
  const root = element("div", "fzf");
  root.hidden = true;

  const backdrop = element("div", "fzf__backdrop");
  backdrop.addEventListener("click", close);

  const dialog = element("div", "fzf__dialog");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", "search terminal");

  const titlebar = element("div", "fzf__titlebar");
  titlebar.append(element("span", "fzf__dots"), element("span", "fzf__name", "fzf ~/adeildo"));

  const prompt = element("label", "fzf__prompt");
  const input = element("input", "fzf__input");
  Object.assign(input, { type: "text", spellcheck: false, autocomplete: "off", placeholder: "search or type help" });
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "true");
  input.setAttribute("aria-controls", "fzf-list");
  input.addEventListener("input", render);
  prompt.append(element("span", "fzf__caret", "❯"), input);

  const info = element("div", "fzf__info");
  const count = element("span", "fzf__count");
  info.append(count, element("span", "fzf__rule"));

  const list = element("ul", "fzf__list");
  list.id = "fzf-list";
  list.setAttribute("role", "listbox");

  const main = element("div", "fzf__main");
  main.append(prompt, info, list);

  const preview = element("aside", "fzf__preview");
  const body = element("div", "fzf__body");
  body.append(main, preview);

  const footer = element("div", "fzf__footer", "↑↓ move · → sections · ↵ open · tab complete · esc close");

  dialog.append(titlebar, body, footer);
  root.append(backdrop, dialog);
  document.body.append(root);

  return { root, dialog, input, count, list, preview };
}

function previewHeader(entry) {
  const header = element("div", "fzf__preview-header");
  const heading = element("div", "fzf__preview-heading");
  heading.append(icon(entry.kind), element("span", "fzf__preview-title", entry.title));
  header.append(heading, element("span", "fzf__preview-kind", KIND_LABELS[entry.kind]));
  return header;
}

function previewList(label, items) {
  const block = element("div", "fzf__preview-block");
  const list = element("ul", "fzf__outline");

  for (const { node, location } of items) {
    const index = state.previewItems.length;
    node.addEventListener("mousemove", () => selectPreview(index));
    node.addEventListener("click", (event) => navigate(location, event.ctrlKey || event.metaKey));
    state.previewItems.push({ node, location });
    list.append(node);
  }

  block.append(element("p", "fzf__preview-label", label), list);
  return block;
}

function selectPreview(index) {
  if (state.previewItems.length === 0) {
    return;
  }

  state.pane = "preview";
  state.previewSelected = (index + state.previewItems.length) % state.previewItems.length;
  ui.dialog.dataset.pane = "preview";

  for (const [position, item] of state.previewItems.entries()) {
    item.node.setAttribute("aria-selected", String(position === state.previewSelected));
  }
  state.previewItems[state.previewSelected].node.scrollIntoView({ block: "nearest" });
}

function focusList() {
  state.pane = "list";
  ui.dialog.dataset.pane = "list";
  for (const item of state.previewItems) {
    item.node.setAttribute("aria-selected", "false");
  }
}

function renderCommandPreview(command) {
  ui.preview.append(element("p", "fzf__preview-path", `$ ${command.name}`), element("p", "fzf__preview-text", command.description));
  if (command.name !== "help") {
    return;
  }

  const table = element("dl", "fzf__help");
  for (const [keys, description] of HELP) {
    table.append(element("dt", null, keys), element("dd", null, description));
  }
  ui.preview.append(table);
}

function renderPreview(row) {
  ui.preview.replaceChildren();
  ui.preview.scrollTop = 0;
  state.previewItems = [];
  if (!row) {
    return;
  }

  const { entry } = row;
  ui.preview.append(previewHeader(entry));

  if (entry.kind === "command") {
    renderCommandPreview(entry);
    return;
  }

  ui.preview.append(element("p", "fzf__preview-path", entry.path));

  const sections = sectionsOf(entry.page);
  const text = entry.kind === "section" ? entry.text : entry.text || sections.map((section) => section.text).join(" ");
  if (text) {
    const snippet = text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH).trimEnd()}…` : text;
    ui.preview.append(element("p", "fzf__preview-text", snippet));
  }

  if (entry.kind === "dir") {
    const items = childrenOf(entry.page).map(function (child) {
      const node = element("li");
      node.append(icon(child.kind), element("span", null, child.title));
      return { node, location: child.location };
    });
    if (items.length > 0) {
      ui.preview.append(previewList("contents", items));
    }
  } else if (entry.kind !== "section" && sections.length > 0) {
    const items = sections.map(function (section, index) {
      const node = element("li");
      node.append(element("span", "fzf__outline-index", `[${index}]`), element("span", null, section.title));
      return { node, location: section.location };
    });
    ui.preview.append(previewList("sections", items));
  }
}

function renderRow(row, index) {
  const { entry, highlights, depth, branch } = row;
  const item = element("li", `fzf__row fzf__row--${entry.kind}`);
  item.id = `fzf-row-${index}`;
  item.setAttribute("role", "option");
  item.style.setProperty("--depth", depth);
  item.addEventListener("mousemove", function () {
    if (state.pane === "list") {
      select(index);
    }
  });
  item.addEventListener("click", (event) => run(row, event.ctrlKey || event.metaKey));

  if (branch) {
    item.append(element("span", "fzf__branch", branch));
  }
  item.append(icon(entry.kind));

  if (entry.kind === "command") {
    item.append(element("span", "fzf__title", entry.name), element("span", "fzf__path", entry.description));
  } else {
    const title = entry.kind === "dir" ? `${entry.title}/` : entry.title;
    item.append(highlighted(title, highlights.title, "fzf__title"));
    if (depth === 0 || highlights.path.length > 0) {
      item.append(highlighted(entry.path, highlights.path, "fzf__path"));
    }
  }
  return item;
}

function render() {
  focusList();
  const query = ui.input.value.trim();
  state.rows = listRows(query);

  ui.list.replaceChildren(...state.rows.map(renderRow));
  if (query === "") {
    ui.count.textContent = `${state.rows.length} pages`;
  } else {
    ui.count.textContent = state.rows.length === 1 ? "1 result" : `${state.rows.length} results`;
  }
  select(0);
}

function select(index) {
  if (state.rows.length === 0) {
    renderPreview(null);
    ui.input.removeAttribute("aria-activedescendant");
    return;
  }

  state.selected = (index + state.rows.length) % state.rows.length;
  for (const [position, row] of Array.from(ui.list.children).entries()) {
    row.setAttribute("aria-selected", String(position === state.selected));
  }

  const row = ui.list.children[state.selected];
  row.scrollIntoView({ block: "nearest" });
  ui.input.setAttribute("aria-activedescendant", row.id);
  renderPreview(state.rows[state.selected]);
}

function run(row, newTab = false) {
  if (!row) {
    return;
  }
  if (row.entry.kind === "command") {
    row.entry.run();
  } else {
    navigate(row.entry.location, newTab);
  }
}

function setQuery(query) {
  ui.input.value = query;
  render();
  ui.input.focus();
}

function direction(event) {
  if (event.key === "ArrowDown" || (event.ctrlKey && (event.key === "n" || event.key === "j"))) {
    return 1;
  }
  if (event.key === "ArrowUp" || (event.ctrlKey && (event.key === "p" || event.key === "k"))) {
    return -1;
  }
  return 0;
}

function onPreviewKey(event) {
  const step = direction(event);

  if (step !== 0) {
    selectPreview(state.previewSelected + step);
  } else if (event.key === "Enter") {
    navigate(state.previewItems[state.previewSelected].location, event.ctrlKey || event.metaKey);
  } else if (event.key === "ArrowLeft" || event.key === "Escape") {
    focusList();
  } else {
    focusList();
    return;
  }
  event.preventDefault();
}

function caretAtEnd(input) {
  return input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
}

function onInputKey(event) {
  if (state.pane === "preview") {
    onPreviewKey(event);
    return;
  }

  const step = direction(event);

  if (event.key === "ArrowRight" && caretAtEnd(ui.input) && state.previewItems.length > 0) {
    event.preventDefault();
    selectPreview(0);
  } else if (step !== 0) {
    event.preventDefault();
    select(state.selected + step);
  } else if (event.key === "Enter") {
    event.preventDefault();
    run(state.rows[state.selected], event.ctrlKey || event.metaKey);
  } else if (event.key === "Tab") {
    event.preventDefault();
    const current = state.rows[state.selected];
    if (current) {
      setQuery(current.entry.title);
    }
  } else if (event.key === "Escape") {
    event.preventDefault();
    close();
  }
}

async function open(query = "") {
  if (!ui || !ui.root.isConnected) {
    ui = build();
  }

  state.lastFocus = document.activeElement;
  ui.root.hidden = false;
  document.documentElement.classList.add("fzf-open");
  ui.input.value = query;
  ui.input.focus();

  await loadEntries();
  render();
}

function isOpen() {
  return ui !== null && !ui.root.hidden;
}

function close() {
  if (!isOpen()) {
    return;
  }
  ui.root.hidden = true;
  document.documentElement.classList.remove("fzf-open");
  state.lastFocus?.focus?.();
}

function isTyping(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function onGlobalKey(event) {
  const ctrl = event.ctrlKey || event.metaKey;

  if (isOpen() && event.target === ui.input) {
    event.stopImmediatePropagation();
    onInputKey(event);
    return;
  }

  if (ctrl && event.key.toLowerCase() === "k") {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (isOpen()) {
      close();
    } else {
      open();
    }
    return;
  }

  if (isOpen() && event.key === "Escape") {
    close();
    return;
  }

  if (isOpen() || isTyping(event.target) || ctrl || event.altKey) {
    return;
  }

  if (event.key === "/") {
    event.preventDefault();
    event.stopImmediatePropagation();
    open();
  } else if (event.key === "Escape" && !hasOverlayOpen()) {
    goUp();
  } else if (event.key === "t") {
    toggleTheme();
  } else if (event.key === "?") {
    event.preventDefault();
    open("help");
  } else if (event.key === "g") {
    state.chordStarted = Date.now();
  } else if (Date.now() - state.chordStarted < CHORD_TIMEOUT && event.key in SHORTCUTS) {
    state.chordStarted = 0;
    navigate(SHORTCUTS[event.key]);
  }
}

function onHeaderKey(event) {
  const action = event.target.closest("[data-fzf]")?.dataset.fzf;
  if (action === "open") {
    open();
  } else if (action === "theme") {
    toggleTheme();
  } else if (action === "help") {
    open("help");
  }
}

window.addEventListener("keydown", onGlobalKey, true);
document.addEventListener("click", onHeaderKey);
