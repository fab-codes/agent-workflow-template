# CLAUDE.md

Gli standard di ingegneria di questo repository vivono in un unico file, condiviso con tutti gli strumenti AI.
Leggilo e applicalo integralmente:

@AGENTS.md

Quanto segue vale **in aggiunta** ed è specifico di Claude Code.

## Stato del repository

Questo repository si costruisce incrementalmente, un layer alla volta, dal basso verso l'alto. Prima di intervenire,
verifica quali layer sono già presenti in `src/` e mantieni il lavoro coerente con il loro stato reale: a che punto
siamo lo dice il codice, non questa lista.

<!-- TODO(template): l'ordine di costruzione della prima versione, un passo numerato per layer, dal basso verso
l'alto. Una decisione ancora aperta si scrive nel passo in cui va chiusa con l'utente, prima del codice che ne
dipende. -->

Ogni passo è una o più PR, con il ciclo di `AGENTS.md` §12.

## Ambiente locale

<!-- TODO(template): i servizi locali (per esempio Docker) e come si avviano. -->

- Su Windows la shell primaria è PowerShell 5.1: niente `&&`, niente operatori ternari, niente here-string bash.
  Per script POSIX usa il tool Bash.
- La review di Codex (passo 5 di `AGENTS.md` §12) scrive la review su stdout e la trascrizione della sessione su
  stderr. Nella PR va stdout, integrale; modello ed effort si leggono nell'intestazione di stderr (`model:`,
  `reasoning effort:`). Su Windows `deno test` va in panic nella sandbox read-only di Codex, e la review chiude
  con "test validation incomplete": è atteso, i test li coprono `deno task verify` e la CI.

## Portabilità

Il flusso deve funzionare subito dopo un `git pull` su un altro PC, senza configurazione locale. Comandi, regole e
controlli stanno nel repository: in `AGENTS.md`, in `.claude/settings.json`, in `deno task verify`. Mai solo in
`~/.claude` o in `~/.codex`. Al PC restano solo modello ed effort di Claude, che sceglie chi apre la sessione.

La memoria di Claude vale solo su un PC e in un percorso. Un fatto che serve a lavorare sul progetto, come una
decisione dell'utente o una trappola scoperta, va in questo file o in `AGENTS.md`, non in memoria: se la memoria
sparisce, non deve rompersi nulla.

## Workflow

1. **Leggere prima di scrivere.** Prima di modificare un file, aprilo. Prima di citare una versione o aggiungere
   una dipendenza, apri `deno.json`. Prima di usare l'API di una libreria, aprine i `.d.ts`.
   **Non dedurre firme dalla memoria**: le trappole già scoperte sono in `AGENTS.md` §7.
2. **Piano prima delle modifiche non banali.** Se il lavoro tocca più di tre file, cambia la struttura delle
   cartelle o modifica la configurazione, esponi il piano e aspetta conferma.
3. **Incrementale, mai big bang.** Un layer alla volta, con `deno task check` dopo ogni passo. Non accumulare
   una riscrittura ampia e non verificata.
4. **Verificare sempre.** Chiudi ogni task con `deno task verify`, che esegue check, lint, formattazione, test e
   invarianti di progetto, e riporta l'output reale. Se qualcosa fallisce, dillo esplicitamente: mai arrotondare
   verso "funziona".
5. **Seguire il ciclo di una modifica**, in `AGENTS.md` §12: esegui i tuoi passi nell'ordine e fermati a ogni
   passo che spetta all'utente. L'output della review indipendente si mostra e si riporta nella PR integrale,
   mai riassunto: è l'unica garanzia che nessuna finding venga filtrata da chi ha scritto il codice.
   La review indipendente è quella di Codex: `/code-review` e `/security-review` di Claude Code non la
   sostituiscono, perché il giudizio dello stesso modello che ha scritto il codice è correlato al suo. Si possono
   aggiungere come controllo in più, mai usare al posto del passo 5.
6. **Restare nell'ambito.** Fai ciò che è stato chiesto. Refactor collaterali, riordini di file, aggiornamenti
   di dipendenze e miglioramenti "già che c'ero" si propongono, non si eseguono.
7. **Niente file di contorno.** Non creare README aggiuntivi, riepiloghi, documentazione `.md` o script di
   supporto se non richiesti esplicitamente.
8. **Segnalare i problemi veri.** Se una richiesta è in conflitto con `AGENTS.md` — per esempio rende possibile
   la violazione di un invariante di §4.1, o aggiunge una capacità fuori scope (§1) — dillo in una frase e
   proponi l'alternativa, invece di eseguire in silenzio.

## Dati e servizi reali

<!-- TODO(template): quali servizi e dati sono reali (database di produzione, account, API a pagamento) e se
esiste un ambiente di staging. -->

- **Non eseguire mai operazioni di scrittura contro servizi o dati reali** di tua iniziativa: né `curl`, né
  script, né test, né "verifica veloce". Le scritture le decide e le lancia l'utente.
- I test girano su fake in memoria e senza rete (`AGENTS.md` §9).
- Se serve una prova end-to-end, prepara il comando, spiega cosa farà e su quali dati, e lascialo eseguire
  all'utente.
- In caso di dubbio su un'operazione che modifica dati: fermati e chiedi. Una domanda costa meno di un dato
  corrotto.

## Documentazione di riferimento

Quando un'API non è ovvia, consulta la fonte invece di indovinare:

- Deno runtime — https://docs.deno.com/runtime/
- Configurazione `deno.json` — https://docs.deno.com/runtime/fundamentals/configuration/
- Testing in Deno — https://docs.deno.com/runtime/fundamentals/testing/

<!-- TODO(template): la documentazione delle librerie e dei servizi del progetto. -->

Per una libreria poco documentata la fonte autorevole non è il web: è il pacchetto pinnato. Leggi i suoi `.d.ts`
e i suoi sorgenti.

Se resta un dubbio reale, chiedi. Un'ipotesi sbagliata costa più di una domanda.

## Richiede conferma esplicita

- Installare, rimuovere o aggiornare dipendenze.
- Modificare `deno.json`, il `Dockerfile` o la configurazione di deploy.
- Qualsiasi operazione che scriva su servizi o dati reali.
- Qualsiasi operazione Git che scrive: `commit`, `push`, `merge`, `rebase`, `reset`, creazione di branch o PR.
- Cancellare file o cartelle.

<!-- TODO(template): le altre modifiche che richiedono conferma, per esempio cambiare un contratto pubblico. -->

Una parte di queste regole è imposta anche da `.claude/settings.json`, in ogni modalità di permesso: push,
operazioni sulle PR, `reset`, `clean`, `restore` e cancellazione di branch o stash mostrano un prompt all'utente.
Il prompt si aggiunge alla conferma in chat, non la sostituisce. Le regole riconoscono il comando nella forma in
cui è scritto: i comandi git che scrivono vanno nella forma normale, senza opzioni come `-C` o `-c` prima del
sottocomando. Per lavorare in un'altra cartella si fa `cd` e poi `git push`, mai `git -C cartella push`.

I file `.env` non sono leggibili né modificabili, tranne `.env.example`: il `.env` lo scrive l'utente. Ogni regola
di shell esiste in coppia, `Bash(...)` e `PowerShell(...)`: su Windows un `deny` su Bash senza la regola
PowerShell gemella spegne lo strumento PowerShell in silenzio.

Il blocco `attribution` di `.claude/settings.json` usa la forma `"commit": "", "pr": "", "sessionUrl": false`.
La forma breve `"attribution": false` richiede Claude Code 2.1.281: su una versione precedente rende il file non
valido, e Claude Code ignora un `settings.json` non valido per intero, permessi e Stop hook compresi. Dopo ogni
modifica al file, `claude doctor` non deve segnalare impostazioni non valide.

In auto mode il classificatore di Claude Code può bloccare le modifiche a `.claude/settings.json` come
auto-modifica: per cambiare queste regole l'utente esce da auto mode, e rientra per le prove.
