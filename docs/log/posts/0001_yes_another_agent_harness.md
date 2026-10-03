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


brief: aqui, quero falar que o existe um gap muito grande de informacao entre oq a nossa mente quer - que inclusive vai mudando ao longo do tempo - e o que verbalizamos / escrevemos... eh um gap de informacao muito grande, na pratica, eh um puta problema de comunicacao humano-maquina. Isso vai dar gancho pra falar sobre como tentar a abstrair esse bap; Acho bom citar o Fabio Akita em seu video sobre LLMs e como isso formou uma opiniao muito forte sobre como utilizar LLMs e como isso eh na pratica.


## Dev Tools: 1a extensao no vscode

brief: basicamente qui vamso falar sobre a minha primeira extensao para code completing + code writing, problemas que tive, e solucoes que foram aparecendo;

### exposing and calling tools;
...


## Quebrando preconceitos

brief: aqui eh confesso todos os meus preconceitos com LLM, meus medos, e como fui lidando / quebrando elas um por um e quais eu ainda tenho... [isso vai puxar gancho pro final, onde eu vou listar coisas que me interessam, mas que eu ainda nao tenho aprendido a respeito com maior profundidade ao ponto de falar sobre e ter opiniao formada de medio prazo: evals, memory, sub agents, loop, "long running agents"]

## CLI Coding Agents: uma nova era

brief: brincar com as eras tendo duracao de 1 ano, se brincar... meses; Ai falamos sobre os coding agents, colocar eles dentro ded uma timeline, oq eu curti, oq eu gostei, pontos positivos, negativos, coisas que acertaram, erraram, oq eu utilizei e modifiquei em cada um deles, e como as ideias de cada funcionalidade do meu atual harness foi surgindo; [lembrar de brincar sobre anthropic lendo minhas conversas quando eu criei uma serie de regras para meus agentes conversarem entre si num arquivo compartilhado - ou nao - em /tmp/project-slug para compartilharem contexto entre se e se organizarem em como terminar de wecutar suas terafas, alem de delegarem quem vai fazer oq em turnos paralelos hahaha]

### MCP

...

## Falling in love: pi

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
