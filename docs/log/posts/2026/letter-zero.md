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
closing: Até a próxima,
---

# Carta zero

Este post é um espécime. Ele passa por todos os elementos que um post pode
ter, para eu ver como cada um fica antes de escrever de verdade.

<!-- more -->

## Texto corrido

Cada linha tem uns 65 caracteres e a hifenização segue o português. Dá para usar *itálico de verdade*, **negrito**,
==marca-texto amarelo== e `código em linha`, e até
`#!python sorted(xs, key=len)` com realce. Siglas como <abbr title="HyperText Markup Language">HTML</abbr>,
API e CPU mostram o nome por extenso quando o mouse passa por cima.[^siglas]

As aspas retas viram "aspas curvas" e três pontos viram reticências... Frações
como 1/2 e 3/4 viram um glifo só. Setas --> e <-- também. Teclas ficam assim:
++ctrl+shift+p++.

[^siglas]: A nota aparece como dica quando o mouse passa sobre o número.

### Uma citação

> Programas devem ser escritos para pessoas lerem, e só incidentalmente
> para máquinas executarem.
>
> <cite>Abelson &amp; Sussman</cite>

### Listas

1. O texto precisa ser confortável de ler.
2. O código precisa ser tão legível quanto o texto.

E uma lista de tarefas:

- [x] fontes auto-hospedadas
- [ ] escrever a primeira carta de verdade

## Código

``` python title="fibonacci.py" linenums="1" hl_lines="4"
from functools import cache


@cache  # (1)!
def fib(n: int) -> int:
    """Retorna o n-ésimo número de Fibonacci."""
    return n if n < 2 else fib(n - 1) + fib(n - 2)
```

1.  O `cache` transforma a recursão exponencial em linear.

=== "Rust"

    ``` rust
    fn main() {
        let total: u64 = (1..=10).sum();
        println!("soma = {total}");
    }
    ```

=== "TypeScript"

    ``` ts
    const total = Array.from({ length: 10 }, (_, i) => i + 1)
      .reduce((a, b) => a + b, 0);
    console.log(`soma = ${total}`);
    ```

## Matemática

A soma dos $n$ primeiros inteiros é $\frac{n(n+1)}{2}$. A identidade de Euler
fica em bloco:

$$
e^{i\pi} + 1 = 0
\qquad
\sum_{k=1}^{n} k = \frac{n(n+1)}{2}
$$

***

## Ícones

Ícones do Lucide com as cores do Catppuccin:
:lucide-terminal:{ .mauve } :lucide-git-branch:{ .blue } :lucide-coffee:{ .peach }
:lucide-leaf:{ .green } :lucide-star:{ .yellow } e um :lucide-heart:{ .heart }
que pulsa. Emojis também funcionam :sparkles:.

## Tabela

| Serviço |   p50 |    p95 | Erros |
| :------ | ----: | -----: | ----: |
| api     | 12 ms |  48 ms | 0,02% |
| worker  | 31 ms | 140 ms | 0,31% |

## Avisos

!!! note "Nota"

    Uma observação lateral.

!!! warning "Cuidado"

    Algo que quebra se ninguém prestar atenção.

??? tip "Uma dica recolhida"

    Aparece só quando você abre.

## Diagrama

``` mermaid
graph LR
  A[rascunho] --> B{bom?};
  B -->|não| A;
  B -->|sim| C[publicar];
```

*[API]: Application Programming Interface
*[CPU]: Central Processing Unit
