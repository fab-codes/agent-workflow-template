---
description: Review di manutenibilità contro AGENTS.md — over-engineering, coerenza, commenti
argument-hint: [path o riferimento git — default: modifiche non committate]
---

# Review

Target: **$ARGUMENTS** — se vuoto, le modifiche non committate (`git status --porcelain` e `git diff`).

Questa è una **lettura**, non un intervento: produci un report, non modificare i file. Le correzioni le decide
l'utente dopo aver visto le findings.

## Prima di guardare il codice

1. Esegui `deno task lint` e `deno task invariants`. Coprono la parte meccanica
   di `AGENTS.md` §13. **Non ridurre a mano ciò che loro già segnalano**: il loro esito va nel report come
   riga di stato, non come tua finding.
2. `AGENTS.md` è la fonte di verità. Citalo per paragrafo (`§4.2`) invece di riassumerlo: se ti trovi a
   riscrivere una regola qui, la regola sta già altrove e il tuo compito è applicarla, non ripeterla.
3. **Apri i file, non fidarti del diff.** Una violazione di coerenza è invisibile in un diff: si vede solo
   confrontando il file nuovo con i file vicini che fanno la stessa cosa.

## Ambito

Questa review guarda la manutenibilità. Correttezza e sicurezza, cioè le voci P0 e P1 di **Code Review Rules**
in `AGENTS.md`, le giudica la review indipendente (§12), su un altro modello: ripeterle qui produrrebbe due
giudizi correlati contati come due controlli indipendenti. Se mentre leggi trovi comunque un problema di quel
tipo, non tacerlo: mettilo in cima al report. Ma non andarlo a cercare.

## Le lenti

### Lente 1 — Over-engineering (§4.2)

Domanda, per ogni astrazione: _quanti chiamanti reali ha, adesso?_ Contali con grep, non a intuito. Meno di
due chiamanti → va inlinata. Le uniche eccezioni sono i confini architetturali dichiarati in §5.1.

Segnali: factory, wrapper, registry, layer di configurazione; una cartella con un solo file; una funzione di
cinque righe usata una volta sola; caching, pooling o batching senza una misura che li giustifichi; parametri
opzionali che nessun chiamante passa; flag mai letti; codice morto; generalizzazione per un secondo caso d'uso
che non esiste ancora.

### Lente 2 — Coerenza con la codebase (§5, §6, §10)

Il metro non è un ideale astratto: sono i file che esistono già. Scegli due o tre file fratelli — stesso
layer, stesso ruolo — e confronta.

Domanda: _un lettore capirebbe che questo file e quelli accanto sono stati scritti dalla stessa mano?_

Segnali: direzione delle dipendenze invertita rispetto a §5.1; un errore gestito in una forma diversa dal
modello di dominio unico di §5.3; naming fuori dalla tabella §10; `type` dove i vicini usano `interface` o
viceversa; import senza estensione `.ts`, o senza `import type` quando importa solo tipi; struttura dei test
diversa da quella degli altri file di test; un tipo che attraversa un confine che gli altri rispettano.

### Lente 3 — Commenti (§11, §4.3)

Domanda, per ogni commento: _dice COSA fa il codice, o PERCHÉ è fatto così?_

Il **cosa** va cancellato: se serve a capire il blocco, il problema è il nome o la lunghezza del blocco, e la
finding è quella. Il **perché** resta, se è vero.

Segnali di troppo: JSDoc che riformula la firma; banner decorativi e separatori di sezione; codice commentato;
commenti che descrivono una versione precedente del codice e ora mentono; traduzioni in prosa di una riga
ovvia.

Segnali di troppo poco — contano quanto i precedenti: una trappola di una dipendenza critica usata senza la nota
che la spiega (§7), una decisione di sicurezza senza il motivo, un cast al confine di una libreria senza il
commento che lo motiva (§6).

## Report

Per ogni finding, in quest'ordine di gravità:

- `file.ts:riga` — il paragrafo di `AGENTS.md` violato — cosa non va, in una frase
- perché è un problema **qui**, con lo scenario concreto che lo rende visibile
- la correzione proposta, in una riga

Chiudi con lo stato di `deno task lint` e dello script invarianti.

**Se non trovi nulla, dillo.** Un report vuoto è un esito valido e frequente su codice scritto seguendo
`AGENTS.md`. Riempirlo di osservazioni marginali per non consegnarlo vuoto è il modo più veloce per rendere
questo comando inutile.

## Cosa non riportare

Preferenze stilistiche non scritte in `AGENTS.md`; qualsiasi cosa già coperta da `deno fmt` o `deno lint`;
riscritture generiche non legate a una regola del progetto; proposte di feature — anche buone, anche piccole:
sono fuori scope per §4.2 e vanno chieste all'utente, non infilate in una review.
