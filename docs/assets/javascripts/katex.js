const KATEX_URL = "https://cdn.jsdelivr.net/npm/katex@0.16.22/dist";

let katexReady = null;

function loadElement(tag, attributes) {
  return new Promise(function (resolve, reject) {
    const element = Object.assign(document.createElement(tag), attributes);
    element.onload = resolve;
    element.onerror = reject;
    document.head.append(element);
  });
}

function loadKatex() {
  if (katexReady === null) {
    katexReady = Promise.all([
      loadElement("link", { rel: "stylesheet", href: `${KATEX_URL}/katex.min.css` }),
      loadElement("script", { src: `${KATEX_URL}/katex.min.js` }).then(function () {
        return loadElement("script", { src: `${KATEX_URL}/contrib/auto-render.min.js` });
      }),
    ]);
  }
  return katexReady;
}

async function renderMath(root) {
  const formulas = root.querySelectorAll(".arithmatex");
  if (formulas.length === 0) {
    return;
  }

  await loadKatex();
  for (const formula of formulas) {
    window.renderMathInElement(formula, {
      delimiters: [
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
      ],
      throwOnError: false,
    });
  }
}

document$.subscribe(function ({ body }) {
  renderMath(body);
});
