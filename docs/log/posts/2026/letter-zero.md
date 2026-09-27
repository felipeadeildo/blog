---
draft: true
date:
  created: 2026-09-27
slug: letter-zero
categories:
  - dev
tags:
  - typography
  - meta
closing: Until next time,
---

# Letter zero

This post is a specimen. It goes through every element a post can have, so I
can see how each one looks before writing for real.

<!-- more -->

## Running text

Each line holds about 65 characters and hyphenation follows English rules. You
can use *real italics*, **bold**, ==highlighter yellow== and `inline code`, and
even `#!python sorted(xs, key=len)` with highlighting. Abbreviations like
<abbr title="HyperText Markup Language">HTML</abbr>, API and CPU show their full
name on hover.[^abbr]

Straight quotes become "curly quotes" and three dots become an ellipsis...
Fractions like 1/2 and 3/4 become a single glyph. So do arrows --> and <--.
Keys look like this: ++ctrl+shift+p++.

[^abbr]: The note shows up as a tooltip when you hover the number.

### A quote

> Programs must be written for people to read, and only incidentally for
> machines to execute.
>
> <cite>Abelson &amp; Sussman</cite>

### Lists

1. Text has to be comfortable to read.
2. Code has to be as readable as the text.

And a task list:

- [x] self-hosted fonts
- [ ] write the first real letter

## Code

``` python title="fibonacci.py" linenums="1" hl_lines="4"
from functools import cache


@cache  # (1)!
def fib(n: int) -> int:
    """Return the n-th Fibonacci number."""
    return n if n < 2 else fib(n - 1) + fib(n - 2)
```

1.  `cache` turns the exponential recursion into a linear one.

=== "Rust"

    ``` rust
    fn main() {
        let total: u64 = (1..=10).sum();
        println!("sum = {total}");
    }
    ```

=== "TypeScript"

    ``` ts
    const total = Array.from({ length: 10 }, (_, i) => i + 1)
      .reduce((a, b) => a + b, 0);
    console.log(`sum = ${total}`);
    ```

## Math

The sum of the first $n$ integers is $\frac{n(n+1)}{2}$. Euler's identity goes
in a block:

$$
e^{i\pi} + 1 = 0
\qquad
\sum_{k=1}^{n} k = \frac{n(n+1)}{2}
$$

***

## Icons

Lucide icons in Catppuccin colors:
:lucide-terminal:{ .mauve } :lucide-git-branch:{ .blue } :lucide-coffee:{ .peach }
:lucide-leaf:{ .green } :lucide-star:{ .yellow } and a :lucide-heart:{ .heart }
that beats. Emojis work too :sparkles:.

## Table

| Service |   p50 |    p95 | Errors |
| :------ | ----: | -----: | -----: |
| api     | 12 ms |  48 ms |  0.02% |
| worker  | 31 ms | 140 ms |  0.31% |

## Callouts

!!! note "Note"

    A side remark.

!!! warning "Careful"

    Something that breaks if nobody pays attention.

??? tip "A collapsed tip"

    Only shows up when you open it.

## Diagram

``` mermaid
graph LR
  A[draft] --> B{good?};
  B -->|no| A;
  B -->|yes| C[publish];
```

*[API]: Application Programming Interface
*[CPU]: Central Processing Unit
