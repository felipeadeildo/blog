---
draft: true
date:
  created: 2026-10-03
slug: yes-another-agent-harness
categories:
  - dev
tags:
  - pi.dev
  - project
  - cli
closing: See you next time!
---


# Sim, outro "harnes de codign agent"

## Um pouco de historia

Quando eu comecei a programar, em meados de 2020 quando finalmente tive meu primeiro notebook, eu passei por maus bocados fazendo meio mundo de scripts python para automatizar um monte de tarefas simplesmente dando skip em tudo que se diz respeito ao "python profissional", sem saber oq era classe, modulo, tudo era one-file-script haha, bons tempos.

De alguma forma eu conseguia olhar para um script de 3k de linhas, cheio de repeticao, variaveis mal nomeadas, um monte de funcoes espalahadas pelo codigo, tem type-hint, sem teste, sem nada! Apenas um bom e velho codigo que de alguma forma, eu, no apice dos meus 12 anos conseguia de alguma forma decorar tudo, saber onde tava cada coisa e manter aquilo dali funcionando e lencando features como louco hahaha.

Bons tempos, talvez de la pra ca eu tenha tido um downgrade, hoje eu sinto nojo de codebase daquele nivel e simplesmente :stars:nao consigo entender:stars:, hahahaa.

De qualqer forma, a questao eh que eu fui evoluindo e entendendo a motivacao de cada coisa, oq elas evitavam, pq eu que preciso de testes? pq eu eu preciso de typechecking? pq que eu preciso saber modularizar meu codigo?

E eu amava fazer isso e repensar sempre: como eu posso reescrever isso daqui?

Na pratica, eu nunca fiz um projeto exatamente igual ao outro, apenas mudando variaveis... fiz varios projetos e todos eles seguiam alguma regra distinta, framework, capacidades, formas de escrever... isso evoluiu bastante ao longo do tempo e continua mudando - apesar da IA hahaha;

Exemplo dessa pratica foi [este script de download de cursos da rocketseat](https://gist.github.com/felipeadeildo/961587b1f5660a5db42102666e9884d0?permalink_comment_id=5067970#gistcomment-5067970), um dos poucos dessa categoria que deixei publico (you know why, dont you?). Onde, la no final tem alguns comentarios de como poderiamos abstrair... escrevi aquele codigo pensando: e se fizessemos uma representacao de uma plataforma de curso como uma arvore? cada no so precisa de X informacao e cospe Y coisa... e as folhas sao, essencialmente, videos / materiais baixados.


A conclusao disso dai eh: eu sempre questionei muito a qualidade do que eu fazia... por um lado isso era bom por me manter sempre atualizado, e por outro... perigoso pq eu poderia pegar um projeto novo - como [este daqui](https://github.com/NES-Collaborate/nes-website) - onde mesmo sem dominar total mente a tecnologia, fui la, meti a cara me forcando a aprneder rapidamente e passar dia e noite construindo enquanto aprendia mais sobre a propria tecnologia hahaha.

Esse questionamento continuo me deu algumas opinioes - e continuam a forjar - que podem ser consideradas fortes, uma alta inflexibilidade a adotar coisas simplesmente pelo hype e de ter que saber oq esta acontecendo under the hood a fim de comecar a utilizar.

Opiniao sobre stack, sobre ferramentas, sobre formas de desenvolver, fluxos e coisas desse tipo.

E pq nao, opinar no que se eh necessario para um "bom" - segunddo *MEUS* termos - harness?

## E Deus disse: e haja AI!

No comeco de 2023 quando saiu o primeiro modelo de LLM - mainstream, at leat - introduzido pela OpenAI: o GPT 3.5. <!-- TODO: verificar data e modelo -->

Eu estava fazendo curso de verao na FGV EMAp de dois cursos:
1. Introducao a programacao com Python [easy easy, estava fazendo so para ter horas de curso]
2. Analise Real [puta que pariu, que curso complicado, eu tava morrendo, algm me ajuda]

hahaha, no meio disso tudo, apareceu o gpt 3.5... como eu tava com muito tempo ne - contem ironia - resolvi pegar uma chave de api, escrever um simples script:

passo 1: logar na minha conta fgv
passo 2: listar exercicios nao resolvidos
passo 3: para cada um, submeter chamada de api do enunciado, e exemplos de entrada e saida e passar pra openai
passo 4: apos ter sido escrito, submeter codigo gerado + verificacoes como solucao do exercicio.

e foi assim que eu conquistei mais tempo: fazendo a ia escrever codigo que eu teria que gastar tempo escrevendo. Passei no curso com A+ (sorry FGV, em minha defesa, ate o momento, nao tinha nenhuma restricao quanto ao uso de AI :D)

Nesse momento eu pensei: essa eh uma puta solucao, desocnsiderando os gastos que se tem em rodar um modelo desse, me parece que isso daqui vai mudar a forma como escrevemos codigo... se isso daqui evoluir num ponto de simplesmnete virar interepretador de intencoes tao bom ao ponto de virar camada de abstracao entre mim e o codigo... isso daqui vai mudar muito como usamos linguagens de programaca. Liguei para um grande amigo meu, Tiago Trindade, e tivemos uma longa conversa sobre a definicao de programador e como seria o futuro.... mas isso eh historia para outro post.

## Interpretador de intencoes... mas como?

Escrever codigo eh, na pratica, o ato de expor o seu desejo - intencao - de forma procedural, passo a passo, detalhada em linhas de codigo.

Por exemplo, suponha a situacao em que vc precisa informar diariamente para o seu chefe / CTO oq vc fez de ontem da ultima semana em termos de codigo... Na pratica vc vai atras de do historico de coisas que vc fez, se deixou anotado, ou no histoico de commits e coisas assim, vai sumarizar isso de alguma forma, e entregar pronto; Esse eh o seu desejo. Mas como ele seria em forma de codigo?

Talvez, fosse algo assim:

<!--TODO: melhora essse codigo, nomeclatura, e adiciona umas anotacoes legais nele-->
```python
messenger = Messenger(...)
gh = Github(...)
seventh_day_before = datetime.now() - datetime.timedelta(days=7)

summary = "\n\n".join(
    "\n".join(repo.last_commits(author="your-user", limit=seventh_day_before))
    for repo in gh.list_repos("your-organization")
)

messenger.send(f"That's what ive done:\n{summary}")
```

Note que, no processo de escrever este codigo, VC foi o tradutor da sua intencao para codigo que, eventualmente sera interpretado / compilado e executado.

O LLM como assistente de codigo nada mais eh do que um interpretador de intencao: vc vai transmitir ela atraves de linguagem natural (nao linguagem de programacao) e ele vai se encarregar de executar essas instrucoes.

O problema eh que, quando utilizamos isso como uma camada (um codom hahah) entre sua real intencao e o codigo, pode acontecer do LLM simplesmente nao conseguir escrever de tal forma como vc gostaria, ou como vc imaginou... nao pq a LLM eh burra, mas pq lhe faltou informacao... Quando vc, humano - espero -,  escreve o codigo diretamente, existe zero camadas de interpretacao da sua intencao, vc eh a intencao, vc eh a janela de contexto, vc sabe - em geral - oq quer fazer... onde quer chegar... e quando alguma coisa lhe falta, rapidamente sua mente atraves das conexxoes sinapticas no seu cebero fazem retrieval da informacao para fechar o GAP.

O LLM que apenas possui uma instrucao inicial sua - por sua vez, provavelmente, com um grande gap de informacoes, pq somos preguicosos, nao gostamos de escrever a especificidade nunca sera tao profunda quanto temos na nossa cabeca - nao tentar fechar esses gaps - por design, por arquitetura - sozinho, com suas proprias ferramentas... Entao na pratica, eh muito necessario que, se quer algo que consiga expor sua intencao em forma de codigo de forma curada... vc precisa entrar no loop para fechar esses possiveis GAPs de infromacao...

Como diria o Akita em seu prime: ["ChatGPT eh so um completador de texto vangloriado"](https://youtu.be/O68y0yRZL1Y).

## Dev Tools: 1a extensao no vscode


Apesar disso, eu tentei, e a 1a versao disso foi uma extensao no vscode que hoje ja nao mais existe nem o rastro no github para code completing. Naquele inicio, com uma janela de contexto pequena, era mais facil tentar predizer o que eu estava tentando escrever do que escrever algo maior... 

A extensao que escrevi para o vscode era simples, basicamente pegava meu codigo e enviava para a openai quando eu dava idle de 5 segundos, e retornava o possivel output para terminar aquilo dali. Exemplo:

```python
# fibonacci

def fib(n: int) -> int:
    ...
```

Alguns segundos depois, me aparecia:

```python
# fibonacci

def fib(n: int) -> int:
    return n if n in (1, 0) else fib(n-1) + fib(n-2)
```

Magico! Funcionava que era uma beleza, mas nao era o suficiente, com uma codebase separada por arquivos, fazia bem mais sentido expor outros arquivos tbm... mas a janela de contexto nao permitia... entao veio as engenharias de contexto e tooling para contexto sob demanda.

### exposing and calling tools;

O que o LLM precisava era simples: mais contexto para ser mais acurado em codebases maiores.

E a solucao pra isso, nessa extensao, era muito simples: especificar uma sintaxe para chamada de ferramentas.

```text
Voce eh um agente de codigo especializado em terminar de escrever
codigo escrito por outro dev.

Quando esitver na duvida do contrato de alguma ferramenta,
explore utilizando as seguinte sintaxe:

>>> listar pwd?
>>> ler pwd

Exemplos:
> retorna lista de arquivos no projeto atual:
>>> listar
pyproject.toml
src/
README.md

> retorna lista de arquivos dentro da pasta `src/` do projeto atual
>>> listar src/
src/__init__.py
src/core.py
src/api.py

> retorna o texto do arquivo especificado no projeto atual
>>> ler src/core.py
# src/core.py:
def fib(n: int) -> int:
    return n if n in (1, 0) else fib(n-1) + fib(n-2)

---

Automaticamente, os lugares em que voce referenciar seram trocados pelo retorno da sintaxe.
Pode parar quando escrever alguma delas;
```

E o codigo da extensao era algo parecido com isso daqui:

```python
system_prompt = ...
project_path = Path(...)
current_file = project_path / "src" / "example.py"

context = f"""\
Complete com base em:
Projeto: {project_path}
Arquivo: {current_file}
Conteudo:
{current_file.read()}
"""

history = [{"system": system_prompt, {"user": context}]
tools = {
    "listar": lambda x: os.listdir(x or "."),
    "ler": lambda x: Path(x).read()
}

while True:
    model = OpenAI(..., history=history)
    response = ""
    for chunk in model.stream_complete():
        response += chunk
        # print(chunk, end="")

    for index, lenght, (command, argument) in extract_syntax_calls(response):
        result = tools[command](argument)
        response = response[:index+lenght] + f"\n{result}" + repsonse[index+lenght:]
    else: # nao teve chamada de ferramenta
        break

    history.append({"assistant": response})

print(response)
```

Era algo bem mais elegante que isso, mas o pseudo codigo era algo assim.

Entao "dar ferramentas a um LLM" nada mais eh que fazer regex em cima de output estruturado. Nao existe nada de "poder", eh simplesmente um completador de texto que aplicamos varias e varias vezes, e passamos regex em cima dos chunks a fim de mapear o resultado a uma tool implementada na mao. Nada alem disso;

## CLI Coding Agents: uma nova era


Bom, isso dai ja era coisa do passado, coisas bem mais legais foram aparecendo, e o proprio vscode comecou a ter releases voltadas para facilitar a implementacao / integracao dessas novas ferramentas de IA.

Eventualmente, fomos introduzidos ao "realmente precisamos que isso esteja rodando dentro de uma IDE? Eu nao preciso de uma IDE para listar e ler arquivos, muito menos EDITAR os mesmos... posso so expor uma tool "edit" com alguns argumentos especificos e boa.

E com isso, chegou a era dos CLI's!!!

Quem fez isso muito bem - e continua ate o momento em que faco escrevo esse post - eh a anthropic, revolucionou, quebrou varios paradigmas do que se eh considerado ambiente de programacao... claro que para isso, requer uma evolucao de modelos e tudo mais, e o finetuning numa camada de treinamento final que treina os llms apenas para chamada de ferramentas, chamada de tools, vulgo: escrever bom's outputs de JSONs especificados.

Em ordem cronologica, la pra 2023 quem tinha comecado isso foi o criador do [Aider](...) nascido junto com o GPT-4, introduzindo tbm uma forma de ser agnostica a modelos.

Eventualmente, em abril de 2025, veio a OpenAI e trouxe o Codex CLI que sinceramente, era uma bosta... o modelo nao sabia muito bem utilizar as tools... pq nao? pq na epoca, so tinha UMA tool: bash. Entao na pratica `list` = `bash("ls")`, `read` = `bash("cat file_path.ext)` e `edit` = `bash("sed ...")`. So que o odelo nao tinha refinamento pra usar unix shell ainda.

E finalmente, veio a Anthropic trazendo o claude code, o mais maduro mas focado no ecosistema do claude... rtranzeod algumas coisa slegais como fluxos de subagents em paralelo e coisas do tipo. Alem de trazer uma abstracao para as ferramentas.

Lindo!


### Onde que essa galera perdeu a linha?

Note que, na pratica, um LLM nao precisa de 2 ferramentas pra se virar:

- read
- edit

passa ano, entra ano e nao conseguimos fugir do input/output, cara.

read(file_path) -> file content
read(folder_path) -> list of folders and files inside the path
edot(file_path, filters, new_content) -> edit files

apenas.

O resto eh para facilitar a vida, por exemplo:

- search (eh nada mais eh que um grep, mas pode botar grep com AST)
- bash (esse daqui eh maravilhoso, pq - se o modelo for bom o suficiente, nao era o caso da opneai no inicio de 2025 - so com bash da pra abstrair read e edit).

O pessoal se perdeu no momento em que o hype em cima disso comecou... foi uma loucura, muita misinformation das capacidades... muita gente burra, idiota falando merda pela internet... e o pessoal achando que tudo estaria perdido pq se o LLM eh "melhor do que eu escrevendo codigo" entao ele vai me substituir se tiver as ferrementas certas... Que bagunca isso virou.

Do nada, 10001 ferramentas, tools, workflows, skiils, e num sei oq la... mano, tudo isso, nao passava de regex em cima de output estruturado para trazer mais contexto sob demanda e executar ferramentas. Apenas isso... mas o mundo, a internet, as pessoas, precisavam de hype... entao deram 1000001 nomes para input/output condicional `a um match de regex em cima de output estruturado. Simples assim... louco nao?

## Onde Claude Code tem me perdido

brief: falar sobre auto mode, permissoes de quebrando, system prompts enorme, ferramentas desnecessarias.

## Falling in love: pi.dev

brief: citar Bruno Assis que me apresentou pi.dev, breve experiencia, e falar que eu queria algo opinionated on top of, e que eventualmente descobri o omp.sh e coisas que eu gostei / nao gostei e gostaria

### omp
...

### bare pi + extensions (not a fork)
brief: falar um pocuo das experiencias com extensoes, coletando, como que foi

### a extensao que faltava: pi-ask-permission [like claude code does]
...


### ok, vamos unificar... e adeildo disse: haja harness opinionated!
...

### looking and feel!!
...

## Consideracoes

brief: aqui falamos sobre nao se achar o dono da cocada preta... eu to fazendo isso pq sao minhas opinioes, se nao gosta ou discorda, faz um fork ou faz melhor, eu nao to nem ai; abre pr la kkkkk; a ideia disso daqui, eh trazer essas visoes sobre como eu enxergo essas novidades de ia, e como varias delas sao bem slop... por exemplo "skills", mano, isso eh um prompt em .md compartilhado por algum host tipo skills.sh, eh a penas isso, eh uma forma legal de vc dar ctrl+c & ctrl+v, grande coisa kkkk; a ideia aqui eh dizer que eu nao sou portador de todo conhecimento do mundo, e que eu ainda estou um pouco longe do estado da arte dos "workflows agenticos galaticos do improvement loop dos deuses", tem muita coisa que eu ainda nao sei bem como funciona... mas ate o momento, tem me servido muito bem oq tenho utilizado so far... existem coisas que nao podem quebrar, a responsabilidade de fazer algo de qualdiade, nao eh da ia: EH SUA, ou seja, se vc nao sabe - numa camada boa suficiente - o que caralhos esta acontecendo na sua aplicacao, no que vc ta denseolvendo... na arquitetura... cara, existe uma grande chance de fazer fazer algo que vai dar merda... nao eh por incapacidade da IA< eh por incapacidade sua! eh skill issue;

e fazer um convite tbm a quem quiser colaborar com ideias, fazendo algo realmente bom, e com carinho, pensando na experiencia de cada feature, nao eh estar por estar... eh realmente impleemntando cosia que NOS MESMOS utilizariamos no nosso dia a dia... saca? bem fechado... as coisas tem inicio meio e fim.

eh isso, pra cima! bora biu!
