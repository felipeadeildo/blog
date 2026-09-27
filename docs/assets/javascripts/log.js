const PAGE_SIZE = 10;
const MAX_SUGGESTIONS = 8;

function normalize(text) {
  return Array.from(text.toLowerCase(), (char) => char.normalize("NFD")[0]).join("");
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

function follow(href) {
  const link = Object.assign(document.createElement("a"), { href });
  document.body.append(link);
  link.click();
  link.remove();
}

function isTyping(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function parseQuery(query) {
  const tags = [];
  const terms = [];
  for (const token of normalize(query).split(/\s+/).filter(Boolean)) {
    if (token.startsWith("#")) {
      if (token.length > 1) {
        tags.push(token.slice(1));
      }
    } else {
      terms.push(token);
    }
  }
  return { tags, terms };
}

function readState() {
  const params = new URLSearchParams(window.location.search);
  return {
    query: (params.get("q") ?? "").trim(),
    page: Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1),
  };
}

function writeState({ query, page }) {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const search = params.toString();
  window.history.replaceState(window.history.state, "", search ? `?${search}` : window.location.pathname);
}

function readEntries(list) {
  return Array.from(list.querySelectorAll(".log__entry"), (node) => ({
    node,
    year: node.dataset.date.slice(0, 4),
    tags: node.dataset.tags.split(" ").filter(Boolean).map(normalize),
    text: normalize(node.textContent),
  }));
}

function matches(entry, { tags, terms }) {
  return tags.every((tag) => entry.tags.includes(tag)) && terms.every((term) => entry.text.includes(term));
}

function tagCounts(entries) {
  const counts = new Map();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function keyHint(label, action, available = true) {
  const hint = element("span", available ? "log__key" : "log__key log__key--off");
  hint.append(element("kbd", null, label), element("span", null, action));
  return hint;
}

function mountFeed(root) {
  const list = root.querySelector(".log__entries");
  if (!list) {
    return null;
  }

  const input = root.querySelector(".log__filter");
  const count = root.querySelector(".log__count");
  const suggest = root.querySelector(".log__suggest");
  const status = root.querySelector(".pane__status");
  const pager = root.querySelector(".log__pager");
  const keys = root.querySelector(".log__keys");
  const entries = readEntries(list);
  const tags = tagCounts(entries);
  const view = { ...readState(), visible: [], pages: 1, selected: -1, suggestions: [], suggested: 0 };

  function currentToken() {
    const before = input.value.slice(0, input.selectionStart ?? input.value.length);
    return before.split(/\s/).at(-1);
  }

  function closeSuggestions() {
    view.suggestions = [];
    suggest.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function highlightSuggestion(index) {
    view.suggested = index;
    for (const [position, item] of Array.from(suggest.children).entries()) {
      item.setAttribute("aria-selected", String(position === index));
    }
  }

  function renderSuggestions() {
    const token = currentToken();
    if (!token.startsWith("#")) {
      closeSuggestions();
      return;
    }

    const needle = normalize(token.slice(1));
    const active = parseQuery(input.value).tags;
    view.suggestions = tags.filter(([tag]) => tag.includes(needle) && !(active.includes(tag) && tag !== needle)).slice(0, MAX_SUGGESTIONS);
    if (view.suggestions.length === 0) {
      closeSuggestions();
      return;
    }

    suggest.replaceChildren(...view.suggestions.map(function ([tag, total], index) {
      const item = element("li", "log__suggestion");
      item.setAttribute("role", "option");
      item.append(element("span", null, `#${tag}`), element("span", "log__suggestion-count", String(total)));
      item.addEventListener("mousedown", function (event) {
        event.preventDefault();
        completeTag(index);
      });
      return item;
    }));
    suggest.hidden = false;
    alignSuggestions();
    input.setAttribute("aria-expanded", "true");
    highlightSuggestion(0);
  }

  function alignSuggestions() {
    const label = suggest.querySelector(".log__suggestion span");
    const offset = label.getBoundingClientRect().left - input.getBoundingClientRect().left;
    suggest.style.left = `${suggest.offsetLeft - offset}px`;
  }

  function completeTag(index) {
    const [tag] = view.suggestions[index];
    const caret = input.selectionStart ?? input.value.length;
    const before = input.value.slice(0, caret).replace(/#\S*$/, `#${tag} `);
    input.value = before + input.value.slice(caret).trimStart();
    input.setSelectionRange(before.length, before.length);
    closeSuggestions();
    setQuery(input.value);
  }

  function renderList() {
    const rows = [];
    let year = null;

    for (const entry of view.visible) {
      if (entry.year !== year) {
        year = entry.year;
        rows.push(element("li", "log__year", year));
      }
      rows.push(entry.node);
    }

    if (rows.length === 0) {
      rows.push(renderEmpty());
    }
    list.replaceChildren(...rows);
  }

  function renderEmpty() {
    const empty = element("li", "log__none");
    const logo = document.querySelector(".md-logo img");
    if (logo) {
      const cat = element("img", "log__none-cat");
      cat.src = logo.src;
      cat.alt = "";
      empty.append(cat);
    }

    const message = element("p", "log__none-title");
    message.append("nothing in ~/log matches ", element("span", "log__none-query", `"${view.query}"`));
    empty.append(message);

    const active = parseQuery(view.query).tags;
    const ideas = tags.filter(([tag]) => !active.includes(tag)).slice(0, 5);
    if (ideas.length > 0) {
      const line = element("p", "log__none-hint", "try fewer words, or browse a tag instead:");
      const links = element("p", "log__none-tags");
      for (const [tag] of ideas) {
        const button = element("button", "log__none-tag", `#${tag}`);
        button.type = "button";
        button.addEventListener("click", function () {
          input.value = `#${tag}`;
          setQuery(input.value);
        });
        links.append(button);
      }
      empty.append(line, links);
    }

    const clear = element("p", "log__none-clear");
    clear.append(element("kbd", null, "esc"), " clear");
    empty.append(clear);
    return empty;
  }

  function renderPager(total) {
    if (total === 0) {
      pager.replaceChildren();
      return;
    }

    const first = (view.page - 1) * PAGE_SIZE + 1;
    const last = Math.min(view.page * PAGE_SIZE, total);
    const items = [element("span", "log__range", `${first}-${last} of ${total}`)];

    if (view.pages > 1) {
      for (let number = 1; number <= view.pages; number += 1) {
        const button = element("button", "log__page", String(number));
        button.type = "button";
        if (number === view.page) {
          button.setAttribute("aria-current", "page");
        }
        button.addEventListener("click", () => goToPage(number));
        items.push(button);
      }
    }
    pager.replaceChildren(...items);
  }

  function renderKeys() {
    keys.replaceChildren(
      keyHint("↑↓", "select"),
      keyHint("↵", "open"),
      keyHint("#", "tag"),
      keyHint("←→", "page", view.pages > 1),
      keyHint("esc", "clear", view.query !== ""),
    );
  }

  function select(index) {
    view.visible[view.selected]?.node.removeAttribute("aria-selected");
    view.selected = index;

    const entry = view.visible[index];
    if (entry) {
      entry.node.setAttribute("aria-selected", "true");
      entry.node.scrollIntoView({ block: "nearest" });
    }
  }

  function render() {
    const filters = parseQuery(view.query);
    const matching = entries.filter((entry) => matches(entry, filters));
    view.pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
    view.page = Math.min(view.page, view.pages);

    const start = (view.page - 1) * PAGE_SIZE;
    view.visible = matching.slice(start, start + PAGE_SIZE);
    view.selected = -1;
    for (const entry of entries) {
      entry.node.removeAttribute("aria-selected");
    }

    count.textContent = view.query ? `${matching.length}/${entries.length}` : String(entries.length);
    renderList();
    renderPager(matching.length);
    renderKeys();
    writeState(view);
  }

  function setQuery(query) {
    view.query = query.trim();
    view.page = 1;
    render();
  }

  function goToPage(page) {
    if (page >= 1 && page <= view.pages && page !== view.page) {
      view.page = page;
      render();
      list.scrollIntoView({ block: "nearest" });
    }
  }

  function addTag(tag) {
    const active = parseQuery(view.query).tags;
    if (!active.includes(normalize(tag))) {
      input.value = `${view.query} #${tag}`.trim();
      setQuery(input.value);
    }
  }

  function open(entry) {
    entry?.node.querySelector(".log__title").click();
  }

  input.value = view.query;
  input.addEventListener("input", function () {
    setQuery(input.value);
    renderSuggestions();
  });
  input.addEventListener("blur", closeSuggestions);
  input.addEventListener("keydown", function (event) {
    const suggesting = view.suggestions.length > 0;

    if (suggesting && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      highlightSuggestion((view.suggested + step + view.suggestions.length) % view.suggestions.length);
    } else if (suggesting && (event.key === "Tab" || event.key === "Enter")) {
      event.preventDefault();
      completeTag(view.suggested);
    } else if (suggesting && event.key === "Escape") {
      closeSuggestions();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      input.blur();
      select(0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      open(view.visible[0]);
    } else if (event.key === "Escape") {
      input.blur();
    }
  });

  list.addEventListener("click", function (event) {
    const tag = event.target.closest("[data-tag]");
    if (tag) {
      event.preventDefault();
      addTag(tag.dataset.tag);
    }
  });

  root.querySelector(".pane__top").hidden = false;
  status.hidden = false;
  render();

  return {
    onKey(event) {
      if (event.key === "ArrowDown" || event.key === "j") {
        select(Math.min(view.selected + 1, view.visible.length - 1));
      } else if (event.key === "ArrowUp" || event.key === "k") {
        if (view.selected <= 0) {
          select(-1);
          input.focus();
        } else {
          select(view.selected - 1);
        }
      } else if (event.key === "Enter" && view.selected >= 0) {
        open(view.visible[view.selected]);
      } else if (event.key === "ArrowRight") {
        goToPage(view.page + 1);
      } else if (event.key === "ArrowLeft") {
        goToPage(view.page - 1);
      } else if (event.key === "f") {
        input.focus();
      } else if (event.key === "#") {
        input.focus();
        input.value = `${view.query} #`.trimStart();
        input.dispatchEvent(new Event("input"));
      } else {
        return;
      }
      event.preventDefault();
    },
    onEscape(event) {
      if (view.selected >= 0) {
        event.preventDefault();
        select(-1);
      } else if (view.query) {
        event.preventDefault();
        input.value = "";
        setQuery("");
      }
    },
  };
}

async function loadSiblings(feedUrl) {
  const html = await fetch(feedUrl).then((response) => response.text());
  const feed = new DOMParser().parseFromString(html, "text/html");
  return Array.from(feed.querySelectorAll(".log__title"), (link) => new URL(link.getAttribute("href"), feedUrl).href);
}

function mountPost(root) {
  const article = root.querySelector("article.letter");
  if (!article) {
    return null;
  }

  const words = article.textContent.trim().split(/\s+/).length;
  for (const node of root.querySelectorAll("[data-words]")) {
    node.textContent = String(words);
  }

  const fill = root.querySelector("[data-progress-fill]");
  const value = root.querySelector("[data-progress-value]");
  const feedUrl = new URL(root.querySelector(".meta").dataset.feed, window.location.href).href;
  let siblings = null;

  function updateProgress() {
    const box = article.getBoundingClientRect();
    const travel = box.height - window.innerHeight;
    const ratio = travel <= 0 ? 1 : Math.min(1, Math.max(0, -box.top / travel));
    fill.style.transform = `scaleX(${ratio})`;
    value.textContent = `${Math.round(ratio * 100)}%`;
  }

  if (fill) {
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  return {
    async onKey(event) {
      const step = { "[": -1, "]": 1 }[event.key];
      if (!step) {
        return;
      }
      event.preventDefault();
      siblings ??= loadSiblings(feedUrl).catch(() => []);
      const posts = await siblings;
      const current = posts.indexOf(window.location.origin + window.location.pathname);
      const target = current === -1 ? undefined : posts[current + step];
      if (target) {
        follow(target);
      }
    },
    unmount() {
      window.removeEventListener("scroll", updateProgress);
    },
  };
}

let feed = null;
let post = null;

document.addEventListener("keydown", function (event) {
  if (isTyping(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  feed?.onKey(event);
  post?.onKey(event);
});

document.addEventListener("tui:escape", function (event) {
  feed?.onEscape(event);
});

document$.subscribe(function ({ body }) {
  post?.unmount();
  feed = mountFeed(body);
  post = mountPost(body);
});
