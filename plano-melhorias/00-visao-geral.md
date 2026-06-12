# Plano de Melhorias Arquiteturais — Desconecta

Cada arquivo desta pasta descreve **um commit único** com todos os passos necessários para executá-lo.  
A ordem segue a tabela de priorização da `ANALISE_ARQUITETURAL.md` (maior impacto com menor esforço primeiro).

---

## Sequência de Commits

| Arquivo | Commit | Impacto | Esforço |
|---|---|---|---|
| [01-remove-ignite-boilerplate.md](./01-remove-ignite-boilerplate.md) | `chore: remove Ignite boilerplate artifacts` | Alto | Baixo |
| [02-fix-get-user-groups-query.md](./02-fix-get-user-groups-query.md) | `perf: use array-contains to query user groups` | Alto | Baixo |
| [03-extract-use-app-foreground-hook.md](./03-extract-use-app-foreground-hook.md) | `refactor: extract useAppForeground custom hook` | Médio | Baixo |
| [04-move-credentials-to-env.md](./04-move-credentials-to-env.md) | `fix(security): move Google Client ID to env` | Alto | Baixo |
| [05-standardize-error-handling.md](./05-standardize-error-handling.md) | `refactor: standardize error handling across services` | Médio | Médio |
| [06-extract-use-cases.md](./06-extract-use-cases.md) | `refactor: extract use cases from screens` | Alto | Médio |
| [07-ports-adapters-layer.md](./07-ports-adapters-layer.md) | `refactor: add Ports/Adapters layer for external deps` | Alto | Alto |
| [08-rich-domain-entities.md](./08-rich-domain-entities.md) | `refactor: introduce rich domain entities and value objects` | Médio | Alto |
| [09-restructure-by-feature.md](./09-restructure-by-feature.md) | `refactor: restructure folders by feature (vertical slicing)` | Médio | Alto |
| [10-cloud-functions-backend.md](./10-cloud-functions-backend.md) | `feat: move multi-document ops to Cloud Functions` | Alto | Alto |
| [11-minor-tech-debt.md](./11-minor-tech-debt.md) | `fix: resolve remaining technical debt items` | Médio | Baixo |

---

## Dependências entre Commits

```
01 → (independente, pode ser feito a qualquer momento)
02 → (independente)
03 → (independente)
04 → (independente)
05 → (independente, mas idealmente antes de 06)
06 → depende de 05 (usa os erros tipados)
07 → depende de 06 (use cases dependem dos ports)
08 → depende de 07 (entidades alimentam os adapters)
09 → depende de 06, 07, 08 (reorganiza estrutura já refatorada)
10 → depende de 07 (Cloud Functions usam os mesmos contratos)
11 → (independente, pode ser feito a qualquer momento)
```

---

## Convenção dos Arquivos

Cada MD segue esta estrutura:

```
# Commit N — Título
## Objetivo
## Arquivos afetados
## Passos
## Resultado esperado
## Verificação
```
