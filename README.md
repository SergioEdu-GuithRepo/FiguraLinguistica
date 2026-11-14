# FiguraLinguística

Aplicação web (PWA) para aprender **inglês, francês e japonês** a partir do português — conversação do dia-a-dia em 10–15 minutos por dia.
Esta versão implementa a **Fase 1 (MVP)**, a **Fase 2 (Voz e profundidade)**, a **Fase 3 (Fluência — níveis 1 a 45)** e a **Fase 4 (Domínio B2, Contextos Reais & Explorador de Vocabulário — níveis 1 a 54)** do documento de produto.

## Arrancar

```bash
npm install
npm run dev          # desenvolvimento → http://localhost:3000
# ou produção:
npm run build && npm start
```

Funciona **sem nenhuma chave externa**: contas, progresso e repetição espaçada ficam no `localStorage` do dispositivo, e o tutor usa um motor guiado/livre/desafio offline.

### Variáveis de ambiente (opcionais)

Cria um ficheiro `.env.local`:

| Variável | Para quê |
| --- | --- |
| `ANTHROPIC_API_KEY` | Activa o tutor com IA (Claude) e a adaptação de textos no Leitor. Sem ela, o tutor funciona em modo **Guiado**, **Livre** e **Desafio** offline. |
| `ANTHROPIC_MODEL_LIGHT` | Modelo para níveis 1–18 (por defeito `claude-haiku-4-5`). |
| `ANTHROPIC_MODEL_SMART` | Modelo para níveis 19+ (por defeito `claude-sonnet-4-5`). |
| `TTS_NEURAL` | `off` desactiva a voz neural (a app usa só a voz do aparelho). |
| `TTS_CACHE_DIR` | Pasta da cache de áudio neural (por defeito `data/tts-cache`). |

A chave fica só no servidor (rotas `/api/*`); há limite de pedidos por IP, moderação básica e validação do JSON com zod. Se a IA falhar, o tutor recua automaticamente para o motor offline.

## Voz Neural HD

Todas as frases são lidas com **vozes neurais da Microsoft Azure** (pacote `msedge-tts`), em **MP3 mono 24 kHz / 96 kbps**, com entonação, respiração e cadência naturais. Disponível em todos os planos.

- **Rota** `GET /api/tts?lang=en&voice=en-GB-SoniaNeural&rate=1&text=Hello` → `audio/mpeg` com os cabeçalhos `X-TTS-Engine: edge-neural-hd`, `X-TTS-Voice` e `X-TTS-Cache: mem|disk|miss`. Sem `text`, devolve em JSON o motor, formato e vozes disponíveis.
- **Vozes**: inglês (Sonia, Ryan, Libby — UK; Aria, Guy, Jenny — US), francês (Denise, Henri, Eloise — FR; Sylvie, Jean — CA), japonês (Nanami, Keita). Cada tutor tem a sua voz; nos diálogos, "Tu" e as outras personagens recebem vozes diferentes. Escolhe-se em **Perfil → Voz**.
- **Velocidade**: o botão "devagar" e a velocidade do perfil são aplicados por SSML (prosódia), sem acelerar o áudio.
- **Cache**: memória (LRU) + disco + cache HTTP imutável + service worker (`fl-tts`); as lições descarregadas guardam também o áudio para uso offline. `npm run tts:pregen [-- en|fr|ja]` pré-gera o áudio de todo o conteúdo; `npm run tts:voices` lista as vozes do serviço.
- **Recurso**: se o serviço falhar ou demorar (> 9 s), a app usa automaticamente a voz do aparelho (Web Speech API) e avisa no Perfil. Também se pode escolher "Voz do aparelho" manualmente.

> `msedge-tts` usa o serviço online de leitura em voz alta do Microsoft Edge (não oficial, sem chave). Para produção em escala, recomenda-se trocar o motor em `src/lib/server/tts.ts` por uma chave oficial do Azure Speech — o formato e as vozes são os mesmos.

## Verificações

```bash
npm run check:content   # valida o conteúdo curado (162 unidades, contextos, cobertura do dicionário, moldes, conversas, kanji)
npm run test:logic      # ~5000 testes: tutor nas 3 línguas (Guiado/Livre/Desafio), contextos, fluência, FSRS, progressão, vozes, pronúncia, partículas, cortesia, importação
npm run lint
npx tsc --noEmit
```

## O que está incluído

- **Início / Cursos / Lições / Perfil** com o design do documento (tokens de cor, modo claro/escuro/automático, modo leve de poupança de dados, cartões de 24px, Plus Jakarta Sans + Noto Sans JP, japonês ≥ 18px).
- **Conta local**, onboarding (idioma, objectivo diário, interesses) e **teste de colocação** (níveis 1–54).
- **Níveis 1–54 nas 3 línguas (162 unidades curadas e ~4400+ entradas de dicionário)** — **Sobrevivência** (1–9), **Rotina** (10–18), **Interacção** (19–27), **Autonomia** (28–36), **Fluência quotidiana** (37–45) e **Domínio** (46–54, B2): cada unidade com 6 passos — Ouvir e tocar · Molde vivo · Vocabulário-chave · Montar a frase · Dizer em voz alta · Conversa com o tutor.
- **Contextos Reais & Kit de Bolso (`/contextos`)**: 8 pacotes temáticos práticos desbloqueados desde o nível 1 (Aeroporto/Imigração, Banco/Pagamentos Digitais, Trabalho Remoto/Videoconferência, Tecnologia/Suporte, Bem-estar/Desporto, Universidade/Bolsas, Serviços/Reembolsos e Falsos Amigos), com frases prontas por registo social (formal, neutro, informal), áudio normal e lento (0.6×), dicas culturais para lusófonos, questionários de situações e guarda em lote na revisão espaçada.
- **Explorador de Vocabulário & Treino em Contexto (`/cursos/vocabulario` e `/palavras`)**: pesquisa instantânea segura para IME em todo o dicionário vivo (idioma-alvo, português e romaji), filtros por classe gramatical e alertas de falsos amigos, guarda de cenas completas na revisão e exercícios de preenchimento de frases reais integrados com o motor FSRS-5.
- **Leitor interactivo**: tocar numa palavra → significado, pronúncia, lema, exemplo, guardar para revisão; tocar numa frase → blocos e molde. Furigana/romaji no japonês, liaisons e género (cor) no francês, expressões fixas realçadas.
- **Tutor conversacional em 3 modos**:
  - **🎯 Guiado**: conversa estruturada com escada de ajuda (Dica → Começo da frase → Frase modelo).
  - **💬 Livre**: conversa aberta sobre o tema da unidade com sugestões de vocabulário da cena.
  - **⚡ Desafio**: sem ajudas, temporizador de 25 s por turno e bónus de +15 XP.
- **Treinos de Fluência**: **⏱ Responder rápido** (reacção em ≤ 8 s a situações reais) e **🧠 Traduzir o sentido** (equivalentes idiomáticos naturais sem tradução literal palavra a palavra).
- **Modelo do Aluno e Pacotes Recomendados**: acompanha vocabulário dominado vs. frágil, estruturas praticadas, erros recorrentes por categoria, tempo médio de resposta e recomenda o próximo pacote de prática personalizada.
- **Marcos de Comunicação, Exames de Etapa e Certificados (`/marcos`)**: lista de competências reais da vida quotidiana por etapa (A1.1 → B2), exame prático de 6 perguntas por etapa e certificado digital partilhável/imprimível.
- **Repetição espaçada FSRS-5** (palavras e moldes), revisão relâmpago de 2 minutos, lista de palavras.
- **Avaliação de pronúncia** (passo "Dizer em voz alta"): o reconhecimento de voz do navegador transcreve (até 3 alternativas), a app alinha com a frase-alvo e dá uma pontuação 0–100, cada palavra a verde/amarelo/vermelho e até 2 dicas (números por extenso, kana no japonês). Sem reconhecimento de voz: **Gravar-me → Comparar** com a voz nativa (a gravação fica só em memória).
- **Japonês completo**: módulo de **kana** (tabela, reconhecimento, traçado); módulo de **kanji** (129 kanji por frequência e ordem das unidades — ficha com leituras on/kun, exemplos e mnemónica; reconhecimento com FSRS; traçado); **furigana automática** (esconde a leitura dos kanji já dominados) e romaji ajustáveis; **prática de partículas** (`は が を に で と へ も…`); módulo de **Contadores e Níveis de Cortesia (`/cortesia`)** (`つ`, `人`, `本`, `枚`, `杯` com alterações fonéticas e quadro comparativo Informal 普通形 vs. Cortês です/ます vs. Keigo 尊敬語/謙譲語 + treino interactivo).
- **Importar texto** (Leitor): cola qualquer texto → segmentação (incluindo japonês), cobertura do dicionário, dificuldade por frase, filtro "só frases ao meu nível", vocabulário para revisão e perguntas de completar — tudo offline. Com chave, há também a adaptação completa por IA.
- **Voz** neural HD (ver acima) e Web Speech API como recurso (TTS + reconhecimento, com consentimento; não se guarda áudio).
- **Tarefa diária, XP, sequência** (com 1 "congelamento" por semana), lembretes inteligentes de horário habitual.
- **PWA & Offline**: manifest, ícones, service worker com cache de lições descarregadas (individualmente ou **etapa inteira em lote**), barra de estado offline e **modo leve** (sem pré-carregar áudio neural).
- **Reportar erro** em qualquer frase → `data/reports.jsonl`.

### Notas de arquitectura

- **Autenticação** local (palavra-passe com hash salgado no dispositivo) — não há servidor de contas.
- **Pagamentos**: a página Planos simula a subscrição (claramente identificado); o plano gratuito limita a 5 conversas/dia e 1 idioma activo.
- A avaliação de pronúncia depende do reconhecimento de voz do navegador (melhor no Chrome/Edge); não é uma análise fonética ao nível do fonema.

## Estrutura

```
src/
  app/                páginas (App Router) e rotas /api (tutor, report, adapt, tts)
                      contextos/, kana/, kanji/, particulas/, cortesia/, marcos/, leitor/ …
  components/         Shell, Reader (leitor interactivo), ContextualVocabDrill, Trace, passos da unidade, UI
  content/{en,fr,ja}/ unidades e dicionários curados das 6 etapas (níveis 1–54) + contexts-dict.ts;
                      ja/kana.ts, ja/kanji.ts
  lib/                tipos, tokenizador, FSRS, estado/progresso, store (localStorage),
                      voz, pronunciation.ts, particles.ts, cortesia.ts, fluencia.ts,
                      adapt-offline.ts, tutor (motor offline + prompt), server/ (IA, TTS, limites)
scripts/              check-content.ts, test-logic.ts, tts-pregen, make-icons.mjs
public/               sw.js, manifest, ícones
```

Convenções do conteúdo (ver `src/lib/types.ts`): no japonês os tokens separam-se com `|`; no francês as liaisons obrigatórias marcam-se com `‿`; chaves do dicionário com espaços são expressões fixas.
