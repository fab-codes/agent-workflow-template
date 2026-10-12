# agent-workflow-template

Scheletro di repository per sviluppare con Claude Code e Codex. Claude scrive il codice, `deno task verify`
controlla tutto ciò che non richiede giudizio, `/review` guarda la manutenibilità, e Codex, un altro modello, fa
la review indipendente di correttezza e sicurezza prima di ogni PR. Il ciclo completo è in
[`docs/workflow.md`](docs/workflow.md).

## Requisiti

Deno 2.9.6, Claude Code, Codex CLI e `gh`, installati e autenticati.

## Pubblicare il template

Una volta sola, dopo aver creato il repository su GitHub, lo si segna come template:

```bash
gh repo edit <owner>/agent-workflow-template --template
```

## Nuovo progetto

1. Crea il repository dal template. Un `git clone` porterebbe con sé la storia e il remote del template; così
   si parte da un commit pulito:

   ```bash
   gh repo create <nome> --private --template <owner>/agent-workflow-template --clone
   ```

2. Crea `develop` e pubblicalo: il passo 5 fa la review contro `origin/develop`, e le PR puntano lì.

   ```bash
   git switch -c develop
   git push -u origin develop
   ```

3. Compila i segnaposto, partendo da `AGENTS.md` §1. Ognuno dice cosa scrivere; quando la ricerca trova solo
   questo README, il template è adattato.

   ```bash
   git grep -n "TODO(template)"
   ```

4. Sostituisci questo README con quello del progetto.
5. Esegui `deno task verify`: deve passare prima della prima PR.

## Cosa contiene

| File                                                     | Stato                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------- |
| `AGENTS.md`, `CLAUDE.md`                                 | Regole generiche più segnaposto da compilare               |
| `scripts/check-invariants.ts`                            | Invarianti generici; quelli del progetto si aggiungono qui |
| `.claude/settings.json`, `.claude/hooks/verify.ts`       | Pronti: permessi, attribuzione, Stop hook                  |
| `.claude/commands/review.md`                             | Pronto: `/review`, le tre lenti di manutenibilità          |
| `.github/workflows/ci.yml`, `.github/pull_request_template.md` | Pronti: CI e sezione Review della PR                 |
| `deno.json`, `.gitattributes`, `.gitignore`, `tests/`    | Pronti; `deno.json` si estende con le dipendenze del progetto |
| `docs/workflow.md`                                       | Pronto: il ciclo in una pagina                             |

## Se il progetto non usa Deno

Il template presuppone Deno, che resta comunque necessario allo Stop hook e allo script degli invarianti. Con un
altro stack cambiano:

- il comando lanciato da `.claude/hooks/verify.ts` e il suo elenco `RELEVANT_PATHS`;
- il passo `Verify` di `.github/workflows/ci.yml`;
- §2, §3, §6 e §9 di `AGENTS.md`;
- il controllo sul comando di test in `scripts/check-invariants.ts`, che lo legge da `deno.json`.
