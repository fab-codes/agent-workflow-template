# AGENTS.md — <!-- TODO(template): nome del progetto -->

Standard operativi per chiunque, umano o agente, scriva codice in questo repository.
Sono vincolanti: in caso di conflitto con abitudini generiche o con il default del modello, vince questo documento.

## 1. Progetto

<!-- TODO(template): cosa fa il progetto, in due o tre frasi, e il flusso dei dati tra i suoi componenti. -->

### Priorità non negoziabili, in quest'ordine

<!-- TODO(template): adatta l'elenco. La prima voce è ciò che non deve rompersi mai. -->

1. **Integrità dei dati dell'utente**
2. Sicurezza
3. Correttezza
4. Semplicità
5. Manutenibilità
6. Estendibilità futura

Quando due priorità confliggono vince quella più in alto. Sempre, senza eccezioni discrezionali.

### Cosa questo progetto NON è

<!-- TODO(template): le capacità fuori scope, da rifiutare anche se richieste in modo indiretto. Un elenco
esplicito ferma le feature "già che c'ero" meglio di un principio generico. -->

## Code Review Rules

Regole della review indipendente, umana o agente. Il titolo di questa sezione è quello che Codex cerca: non
rinominarlo. Sta in testa perché Codex legge AGENTS.md solo fino a `project_doc_max_bytes`, 32 KiB di default,
e tronca il resto in silenzio. Il comando del passo 5 di §12 alza il limite con `-c`, così vale su ogni macchina
senza configurazione locale, e `deno task invariants` fallisce se il file supera il limite scritto in quel
comando. Formattazione, lint, typecheck e invarianti meccanici li verifica `deno task verify` in CI: non vanno
segnalati in review.

Si riportano **solo** finding P0 e P1, ognuna con lo scenario concreto che la rende visibile: input, stato di
partenza, effetto sui dati. Manutenibilità e stile restano fuori: li copre `/review`
(`.claude/commands/review.md`).

Ogni anti-pattern di §13 è almeno **P1**. Sono **P0**, perché un merge con uno di questi perde dati o li espone,
i casi seguenti, ciascuno con il percorso sicuro da proporre:

- Un input, anche assurdo, per cui dati dell'utente vengono cancellati, troncati o sovrascritti senza che
  l'operazione lo chieda (§4.1). Percorso sicuro: un'operazione mirata che lascia identico ciò che non tocca.
- Segreti, credenziali, token o dati dell'utente in un log, in un errore o in una risposta (§8.3).
  Percorso sicuro: loggare identificativi e codici di errore, mai contenuti.
- Un input esterno che raggiunge un layer interno senza passare dalla validazione di confine (§8.1).
  Percorso sicuro: validare una volta, all'ingresso, e far circolare solo il valore validato.
- Un'operazione protetta raggiungibile senza autenticazione, o un token confrontato non a tempo costante (§8.1).

<!-- TODO(template): i P0 specifici del progetto, ciascuno con il paragrafo che viola e il percorso sicuro. -->

Sono inoltre **P1**:

- Un'eccezione che può far cadere il processo, o un errore esposto con un codice fuori da §5.3.
- Una dipendenza nuova, o uno specifier non pinnato in modo esatto (§2).
- Una trappola documentata in §7 non gestita nel punto in cui §7 dice di gestirla.
- Un comportamento nuovo, o un bug corretto, senza il test che lo garantisce (§9).

<!-- TODO(template): i P1 specifici del progetto. -->

## 2. Stack

| Layer         | Tecnologia                                            |
| ------------- | ----------------------------------------------------- |
| Runtime       | Deno 2.9.6                                            |
| Linguaggio    | TypeScript (incluso in Deno), strict — `deno check` pulito |
| Test          | `deno test` + `@std/assert`                           |
| Lint / Format | `deno lint`, `deno fmt` (configurazione in `deno.json`) |

<!-- TODO(template): le altre righe dello stack (framework, persistenza, deploy), con le versioni esatte. -->

> Le versioni qui sopra sono indicative. **`deno.json` è l'unica fonte autorevole**: leggilo prima di scrivere
> codice o citare un'API. Non dedurre firme dalla memoria.

### Vincoli di dipendenza

- **Pin esatto, sempre.** Mai `latest`, mai range (`^`, `~`) su specifier `npm:` o `jsr:`. Un minor bump di una
  dipendenza può cambiare il comportamento del sistema.
- **Niente dipendenze nuove senza necessità dimostrata.** Prima verifica se lo copre già Deno o la standard
  library. Ogni pacchetto aggiunto è debito e superficie di attacco.

<!-- TODO(template): le tecnologie vietate per decisione architetturale, se ce ne sono. -->

## 3. Comandi

```bash
deno task check      # deno check su tutto il repository (type-check)
deno task test       # deno test, senza accesso alla rete
deno task lint       # deno lint
deno task fmt        # deno fmt
deno task fmt:check  # deno fmt --check, non scrive
deno task invariants # invarianti architetturali deterministiche
deno task verify     # check + lint + fmt:check + test + invariants
```

<!-- TODO(template): i comandi per avviare il progetto in locale e, se c'è, il build del container. -->

**Definition of Done**: una modifica è completa solo quando `deno task verify` passa pulito — quindi
`deno task check`, `deno task lint`, `deno task fmt:check`, `deno task test` e `deno task invariants` sono
riusciti — e l'output reale è stato riportato. Nessun "dovrebbe funzionare", nessun arrotondamento verso
"funziona". Se qualcosa fallisce, si dice esplicitamente.

## 4. Principi

### 4.1 Invarianti del progetto

Le regole che nessuna modifica può violare, per nessun input. Non sono linee guida: sono invarianti del codice.

<!-- TODO(template): per esempio: nessuna cancellazione implicita; nessun overwrite dell'intero dato quando basta
una modifica mirata; read-modify-write sempre sulla versione più recente; ciò che l'operazione non tocca esce
identico. Dove un invariante si verifica senza giudizio, aggiungilo anche a scripts/check-invariants.ts. -->

Se un'implementazione rende una di queste invarianti anche solo possibile, l'implementazione è sbagliata:
si cambia il design, non si aggiunge un controllo.

### 4.2 Zero over-engineering

- Scrivi la cosa più semplice che risolve il problema **posto**, non quello immaginato.
- Niente astrazioni preventive: nessuna factory, wrapper, registry o layer di configurazione finché non esistono
  **almeno due chiamanti reali**. Unica eccezione consapevole: i confini architetturali dichiarati in §5.1, che
  non sono astrazioni speculative.
- Niente cartelle "in anticipo": una cartella nasce quando ha almeno due file che le appartengono davvero.
- Una funzione di cinque righe usata una volta sola resta inline.
- Niente caching, pooling o batching senza una misurazione che lo giustifichi.
- Cancellare codice è un miglioramento. Niente codice morto, niente flag inutilizzati, niente commenti-cimitero.

### 4.3 Massima qualità

Il codice deve essere production-ready al primo commit. Non esiste "poi lo sistemiamo".

- Leggibilità prima di ogni cleverness. Vietati one-liner criptici, ternari annidati, side effect nascosti.
- Nomi espliciti e per esteso, nessuna abbreviazione criptica.
- Ogni funzione fa **una** cosa. Se serve un commento per spiegare *cosa* fa un blocco, quel blocco va estratto
  o rinominato.
- Gestisci sempre errori e casi limite: dato assente, vuoto o malformato, duplicati, caratteri Unicode, input
  enormi, campi opzionali mancanti. Mai solo l'happy path.
- Ogni funzione esportata ha tipi espliciti in ingresso e in uscita. Niente tipi inferiti sui confini pubblici.
- Il codice deve stare in piedi da solo: niente conoscenza implicita richiesta al lettore.

### 4.4 SOLID, con misura

- **SRP** — un modulo, una responsabilità.
- **OCP** — un comportamento si estende senza toccare i chiamanti, dove esiste un caso d'uso reale che lo chiede.
- **LSP** — le implementazioni di un'interfaccia sono intercambiabili: i test scritti sul fake in memoria restano
  validi contro l'implementazione reale.
- **ISP** — un'interfaccia espone solo ciò che serve ai suoi chiamanti. Non è un proxy generico su una libreria.
- **DIP** — il dominio dipende dalle astrazioni; solo l'adapter dipende dal dettaglio della libreria esterna.

Non forzare i principi per completezza formale: applicali dove producono un vantaggio reale.

## 5. Architettura

### 5.1 Layer e regola di dipendenza

<!-- TODO(template): i layer, dall'alto verso il basso, con il ruolo e la cartella di ciascuno. -->

Le dipendenze puntano **in una sola direzione, verso il basso**. Un layer non conosce chi lo chiama.
Ogni direzione vietata si scrive anche in `LAYER_RULES` di `scripts/check-invariants.ts`, così la verifica
`deno task verify` invece della memoria di chi scrive.

- Una libreria esterna critica si importa da un solo layer, il suo adapter. I suoi tipi e le sue stranezze si
  normalizzano lì dentro e non ne attraversano il confine (§7).
- Le implementazioni concrete si costruiscono una sola volta, nel composition root, e si iniettano.

### 5.2 Struttura

<!-- TODO(template): l'albero di src/, con un commento per file o cartella. -->

```
tests/                   # mirror di src/, un file per modulo testato
```

Vincoli strutturali:

- **Niente barrel file** `index.ts` / `mod.ts` che ri-esportano. Si importa sempre dal file diretto.
- Niente `utils.ts` contenitore. Un file per area semantica, con un nome che dice cosa contiene.

### 5.3 Modello di errore

Un unico tipo di errore di dominio, con un codice da un'unione chiusa di stringhe:

<!-- TODO(template): l'elenco dei codici di errore. -->

- Gli errori attesi si modellano; non si usano eccezioni generiche per il controllo di flusso.
- Il messaggio esposto all'esterno è **sanitizzato**: nessun segreto, nessuno stack trace, nessun dettaglio
  dei servizi interni, nessun dato dell'utente.
- Lo stack trace si logga server-side solo se non contiene segreti.
- **Nessuna eccezione deve far cadere il processo.** Ogni handler ha una barriera; le rejection non gestite
  sono loggate, non fatali.

## 6. TypeScript e Deno

- **`any` è vietato.** Per dati non tipizzati: `unknown` più type guard o parsing esplicito.
  L'unica eccezione tollerata è al confine con una libreria dai tipi incompleti (§7): va isolata in una riga,
  con un cast motivato da un commento, e non si propaga oltre l'adapter.
- Niente `@ts-ignore`. `@ts-expect-error` solo con un commento che ne spiega la necessità.
- `type` per union, intersezioni e shape di dati; `interface` solo per contratti pensati per essere implementati.
- Niente `enum`: unioni di stringhe oppure oggetti `as const`.
- `import type { ... }` quando importi solo tipi.
- Import espliciti con estensione `.ts` per i file locali; specifier `npm:` e `jsr:` pinnati e dichiarati in
  `deno.json` sotto `imports`, invece che ripetuti inline nei file.
- **Named export, mai `export default`.**
- `readonly` sui parametri di configurazione e sulle strutture che non devono mutare. Le funzioni pure prendono
  un valore e ne restituiscono uno nuovo, non mutano l'input.
- Permessi Deno minimi ed espliciti nelle task. Mai `-A`.

## 7. Dipendenze critiche

Una libreria esterna poco documentata o instabile si confina nel suo adapter (§5.1) e si descrive qui: la
superficie API **verificata** sui suoi `.d.ts` e sui suoi sorgenti, e le trappole già scoperte. Non inventare
firme: se serve qualcosa che non è qui, apri il pacchetto e verifica prima di scrivere.

<!-- TODO(template): per ogni dipendenza critica: versione pinnata, import validati, metodi utilizzabili con le
firme reali, trappole verificate (valori di ritorno sorprendenti, metodi stub, metodi distruttivi da non
chiamare), sequenze di inizializzazione vincolanti. Se il progetto non ne ha, scrivi "Nessuna" e lascia la
sezione: altri paragrafi la citano. -->

## 8. Sicurezza

### 8.1 Confini e input

Ogni input esterno — richiesta, argomento, file, variabile d'ambiente — si valida **una volta sola, al confine**,
in un modulo dedicato, e produce un valore già sicuro. I layer interni ricevono solo valori validati.

- Path: si rifiutano traversal (`../`, `..\`, anche codificato), path assoluti, null byte e caratteri di
  controllo; separatori e Unicode (NFC) si normalizzano. Ogni caso rifiutato ha il suo test.
- Autenticazione, se c'è: obbligatoria su ogni endpoint non dichiarato pubblico, con confronto dei token **a
  tempo costante**. Un `===` su un token è un difetto, non uno stile.
- Limiti espliciti sulla dimensione dell'input e del risultato, e timeout su ogni chiamata di rete.

<!-- TODO(template): i confini reali del progetto e cosa si valida su ciascuno. -->

### 8.2 Segreti e configurazione

- Tutti i segreti arrivano da environment variables, validate una sola volta all'avvio.
  Configurazione mancante o incoerente → fallimento immediato e rumoroso, mai un default silenzioso.
- Default conservativi: in assenza di configurazione esplicita il sistema fa meno, non di più.
- `.env.example` contiene solo placeholder. Mai un valore reale, mai un frammento di credenziale.

### 8.3 Logging

Si logga: operazione, timestamp, esito, durata, identificativi sanitizzati, codice di errore.

Non si logga mai, per default: dati dell'utente, credenziali, token, URL con credenziali, body delle richieste,
header di autorizzazione.

Il logger è un modulo dedicato con output strutturato. Niente `console.log` sparsi, e il lint lo impone: un
`console.log` di un oggetto di dominio è la via più breve per finire dati dell'utente nei log.

## 9. Testing

Si testano le parti deterministiche e quelle pericolose. Il resto si testa se il test aggiunge informazione.

Copertura obbligatoria:

- validazione degli input al confine, inclusi quelli malformati e ostili
- ogni invariante di §4.1

<!-- TODO(template): le aree del progetto che richiedono un test per ogni caso. -->

Regole:

- Le dipendenze esterne stanno dietro un'interfaccia con un fake in memoria: il dominio si testa integralmente
  senza servizi reali.
- **I test non accedono alla rete.** Il comando di test ha al massimo `--allow-env`, e `deno task invariants`
  lo verifica: un test non può raggiungere un servizio reale nemmeno per errore.
- Un test descrive un comportamento osservabile, non l'implementazione. Il nome del test dice cosa garantisce.
- Ogni bug corretto porta con sé il test che lo avrebbe intercettato.

## 10. Naming

| Cosa                    | Convenzione                              | Esempio                       |
| ----------------------- | ---------------------------------------- | ----------------------------- |
| File di modulo          | kebab-case                               | `parse-config.ts`             |
| File che esporta classe | PascalCase, come la classe               | `OrderService.ts`             |
| File di test            | kebab-case + `_test.ts`                  | `paths_test.ts`               |
| Classi e tipi           | PascalCase, senza prefisso `I`           | `OrderRepository`, `Order`    |
| Funzioni e variabili    | camelCase                                | `normalizePath`               |
| Costanti di modulo      | UPPER_SNAKE_CASE                         | `MAX_REQUEST_SIZE`            |
| Env vars                | UPPER_SNAKE_CASE                         | `AUTH_TOKEN`                  |
| Booleani                | prefisso `is` / `has` / `can` / `should` | `isWritable`, `hasSection`    |

## 11. Lingua

- **Codice in inglese**: identificatori, tipi, nomi dei file, codici di errore, messaggi di commit.
- **Commenti in inglese**, solo dove servono, rigorosamente concisi. Un commento spiega il **perché** di una scelta
  non ovvia, un vincolo esterno o un workaround. Mai il *cosa*: quello lo dice il codice.
  I punti che meritano un commento sono le trappole delle dipendenze (§7) e le decisioni di sicurezza.
  Vietati i blocchi decorativi, i banner di sezione e i JSDoc che riformulano la firma.
- Documentazione di progetto (`README.md`, questo file) in italiano.

## 12. Ciclo di sviluppo e Git

### Ciclo di una modifica

1. Utente: chiede la modifica. Claude: se non è banale, propone il piano e aspetta l'ok.
2. Claude: scrive codice e test. Lo Stop hook esegue `deno task verify` a fine turno.
3. Claude: con `verify` verde, esegue `/review` e mostra il report.
4. Utente: approva il commit. Claude: committa.
5. Claude: esegue `git fetch origin` e
   `codex review -c project_doc_max_bytes=65536 -c model_reasoning_effort=xhigh --base origin/develop`,
   e mostra l'output integrale.
6. Claude: per ogni finding P0/P1 scrive il test che la riproduce e poi la correzione, oppure motiva perché
   la respingerebbe; decide l'utente. Se il codice cambia, nuovo commit e si torna al passo 5: un esito vale
   solo per lo SHA che ha visto.
7. Claude: con l'ok dell'utente, push e PR verso `develop`, con la sezione **Review** compilata.
8. Utente: con la CI verde, mergia.

Il comando del passo 5 è fisso, senza istruzioni aggiuntive: chi ha scritto il codice non sceglie cosa guarda
il revisore. I due `-c` non sono istruzioni: il primo fa leggere a Codex questo file per intero (Code Review
Rules), il secondo fissa l'effort, che senza configurazione locale sarebbe il default del modello, anche `low`.
Il modello resta il default del CLI installato: un nome scritto qui invecchierebbe. La base è `origin/develop`
perché il `develop` locale resta indietro dopo ogni merge fatto su GitHub, e la review includerebbe codice di
altre PR.

### Regole

- Branch: `feat/<numero>-<breve-descrizione>` o `fix/<numero>-<breve-descrizione>`, dove il numero è
  progressivo e coincide con quello della PR: `feat/5-startup-config`.
- Titolo della PR: `<numero> - <descrizione in inglese>`, con lo stesso numero del branch:
  `5 - Startup configuration validation`. Nessun prefisso Conventional Commits nel titolo:
  quello vive nei messaggi di commit.
- Flusso: branch → PR verso `develop` → PR `develop` → `main`. Nessun push diretto su `develop` o `main`:
  ogni modifica passa da una PR, così CI e review indipendente la vedono prima del merge.
- Il corpo della PR ha una sezione **Review**: lo SHA dell'ultima review, il modello e l'effort che l'hanno
  eseguita, il suo output integrale e l'esito di ogni finding P0/P1 emersa nel ciclo. Una finding accolta si
  chiude con il test che la riproduce e poi la correzione; una respinta, con la motivazione. Lo schema è in
  `.github/pull_request_template.md`.
- Una PR si mergia solo con la CI verde e con ogni finding P0/P1 chiusa nella sezione **Review**. GitHub non lo
  impone: il gate è questa regola.
- Messaggi di commit in inglese, Conventional Commits: `feat:`, `fix:`, `refactor:`, `perf:`, `docs:`, `test:`, `chore:`.
- Un commit corrisponde a un cambiamento coerente. Niente commit-valanga che mescolano refactor e feature.
- **Non committare, non pushare e non aprire PR se non esplicitamente richiesto.** Prepara il lavoro nel working
  tree e fermati.
- Mai committare `.env`, credenziali o dump di dati reali.
- **Mai trailer di attribuzione ad AI** nei messaggi di commit o nei corpi delle PR.

## 13. Anti-pattern — motivo di rifiuto in review

- Qualunque percorso che possa cancellare, troncare o sovrascrivere dati dell'utente senza che l'operazione lo chieda.
- Una libreria critica importata fuori dal suo adapter, o un suo tipo che ne attraversa il confine (§5.1, §7).
- `any`, `@ts-ignore`, o cast al confine di una libreria senza commento.
- Input esterno usato senza passare dalla validazione di confine (§8.1).
- Confronto di un token con `===`.
- Dati dell'utente, segreti o credenziali in un log o in un messaggio d'errore.
- Logica di dominio nel layer di trasporto, o dettagli di una libreria nel dominio.
- Astrazioni premature, barrel file, `utils.ts` come discarica, cartelle vuote.
- Feature fuori scope aggiunte "già che c'ero" (§1).
- Dichiarare un lavoro "fatto" senza aver eseguito `deno task verify`.

<!-- TODO(template): gli anti-pattern specifici del progetto. -->
