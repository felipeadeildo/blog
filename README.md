# adeildo.dev

My corner of the internet: a **log** of posts, a **wiki** about the desktop and
tools I run, and a **whoami** page. It's built with [Zensical](https://zensical.org)
and a pile of custom templates, CSS and a little vanilla JS, all in Catppuccin.

## Running it

You need [uv](https://docs.astral.sh/uv/).

```sh
uv sync
uv run zensical serve   # http://localhost:8000, drafts included
uv run zensical build   # static site in site/
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/docs.yml`.

## Writing a post

Posts live flat in `docs/log/posts/`, named `NNNN_snake_case_title.md` so the
folder lists them in order. The number only sorts files; the URL comes from the
`slug` and the date from the front matter:

```yaml
---
draft: true
date:
  created: 2026-09-27
slug: my-post
categories:
  - dev
tags:
  - something
closing: Until next time,
---

# Title

The first paragraph is the excerpt in the feed.

<!-- more -->
```

`draft: true` shows the post under `serve` and leaves it out of the build.
Admonitions, content tabs, code annotations, mermaid, footnotes, abbreviations
and keys all work; the wiki pages use most of them.

## The /whoami map

`overrides/partials/journey.svg` is generated, don't edit it by hand:

```sh
node tools/journey.mjs
```
