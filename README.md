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
  - story
  - nextjs
closing: Until next time,
---

# Title

The first paragraph is the excerpt in the feed.

<!-- more -->
```

`draft: true` shows the post under `serve` and leaves it out of the build.
Admonitions, content tabs, code annotations, mermaid, footnotes, abbreviations
and keys all work; the wiki pages use most of them.

### Categories and tags

**Categories** say which part of my life a post comes from. The list is closed,
and a post takes one or two:

| Category  | For                                              |
| --------- | ------------------------------------------------ |
| `dev`     | software, code and the tools I build with        |
| `desktop` | Linux, niri and the rest of the machine's setup  |
| `life`    | everyday life, whatever isn't code               |
| `ranqia`  | work at Ranqia, usually alongside `dev`          |

**Tags** say what the post is about. They are open, but every tag is one of
four kinds, in this order in the front matter:

1. **The kind of post**, exactly one: `story` (something that happened),
   `tutorial` (how to do something), `opinion` (what I think and why) or
   `postmortem` (what broke and what I learned).
2. **My project**, when the post is about one: `pi-harness`, `grace`.
3. **Technologies**, by the name the project gives itself: `nextjs`,
   `react-router`, `claude-code`, `pi`.
4. **Concepts**, the idea regardless of the tool: `ssr`, `tool-calling`,
   `coding-agents`.

Every tag is lowercase kebab-case and in English, whatever the language of
the post. Reuse a tag before inventing one: `grep -rh -A8 '^tags:'
docs/log/posts` lists the ones in use. Somewhere between three and eight tags
per post is plenty: tag what the post is about, not every tool it mentions.

## The /whoami map

`overrides/partials/journey.svg` is generated, don't edit it by hand:

```sh
node tools/journey.mjs
```
