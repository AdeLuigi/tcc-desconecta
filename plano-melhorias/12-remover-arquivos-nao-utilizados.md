# 12 — Remover arquivos não utilizados

Auditoria completa de assets, ícones, componentes, serviços e arquivos de configuração que existem no projeto mas nunca são referenciados em nenhum fluxo real da aplicação.

---

## 1. `app/services/api/` — serviço de API do Ignite (boilerplate completo)

Pasta gerada pelo template Ignite com um cliente de API REST (para um podcast fictício). **Nenhum arquivo do projeto importa daqui.**

Arquivos a remover:
```
app/services/api/index.ts
app/services/api/types.ts
app/services/api/apiProblem.ts
app/services/api/apiProblem.test.ts
```

> Verificar se `apisauce` é dependência exclusiva desses arquivos. Se for, remover do `package.json` também.

---

## 2. Ícones registrados no `iconRegistry` mas nunca usados

Cada entrada abaixo está no `iconRegistry` de `app/components/Icon.tsx` mas nunca aparece em nenhum `icon="..."` na base de código.

### 2a. Remover do `iconRegistry` **e** deletar o(s) arquivo(s) de asset

| `icon="..."` | Arquivo(s) a deletar |
|---|---|
| `editar` | `assets/icons/editar.svg` |
| `adicionar` | `assets/icons/adicionar.svg` |
| `bell` | `assets/icons/bell.png`, `bell@2x.png`, `bell@3x.png` |
| `winSVG` | `assets/icons/win.svg` (o `win` PNG é usado; o SVG não) |
| `uploadIcone` | `assets/icons/uploadIcone.svg` |
| `copy` | `assets/icons/copy.png` (`copySvg` é o usado) |
| `share` | `assets/icons/share.png` (`shareSvg` é o usado) |
| `check` | `assets/icons/check.png`, `check@2x.png`, `check@3x.png` |
| `hidden` | `assets/icons/hidden.png`, `hidden@2x.png`, `hidden@3x.png` |
| `lock` | `assets/icons/lock.png`, `lock@2x.png`, `lock@3x.png` |
| `menu` | `assets/icons/menu.png`, `menu@2x.png`, `menu@3x.png` |
| `more` | `assets/icons/more.png`, `more@2x.png`, `more@3x.png` |
| `settings` | `assets/icons/settings.png`, `settings@2x.png`, `settings@3x.png` |
| `clap` | `assets/icons/demo/clap.png`, `@2x`, `@3x` |
| `community` | `assets/icons/demo/community.png`, `@2x`, `@3x` |
| `components` | `assets/icons/demo/components.png`, `@2x`, `@3x` |
| `debug` | `assets/icons/demo/debug.png`, `@2x`, `@3x` |
| `github` | `assets/icons/demo/github.png`, `@2x`, `@3x` |
| `heart` | `assets/icons/demo/heart.png`, `@2x`, `@3x` |
| `pin` | `assets/icons/demo/pin.png`, `@2x`, `@3x` |
| `podcast` | `assets/icons/demo/podcast.png`, `@2x`, `@3x` |
| `slack` | `assets/icons/demo/slack.png`, `@2x`, `@3x` |

### 2b. Arquivos de ícone que nem estão no `iconRegistry`

Esses arquivos existem em `assets/icons/` mas não são referenciados em lugar nenhum:

```
assets/icons/icone-home.png
assets/icons/notifications.png   (o registry usa notifications.svg; o .png é órfão)
assets/icons/search.png           (o registry usa search.svg; o .png é órfão)
```

---

## 3. `assets/icons/demo/` — pasta inteira (Ignite demo)

Já coberta pelo item 2a. Deletar a pasta inteira após remover as entradas do `iconRegistry`:
```
assets/icons/demo/   (27 arquivos: 9 ícones × 3 densidades)
```

---

## 4. `assets/images/demo/` — pasta inteira (Ignite demo)

Imagens do app de demonstração do Ignite. Não são referenciadas em nenhuma tela real:
```
assets/images/demo/cr-logo.png + @2x @3x
assets/images/demo/rnl-logo.png + @2x @3x
assets/images/demo/rnn-logo.png + @2x @3x
assets/images/demo/rnr-image-1.png + @2x @3x
assets/images/demo/rnr-image-2.png + @2x @3x
assets/images/demo/rnr-image-3.png + @2x @3x
assets/images/demo/rnr-logo.png + @2x @3x
```

---

## 5. Imagens em `assets/images/` não referenciadas no código

### 5a. Ícones de app padrão do Expo (substituídos por `desconecta-icon.png`)
```
assets/images/app-icon-android-adaptive-background.png
assets/images/app-icon-android-adaptive-foreground.png
assets/images/app-icon-android-legacy.png
assets/images/app-icon-ios.png
assets/images/app-icon-web-favicon.png
```

### 5b. Imagens órfãs diversas
```
assets/images/ChatGPT Image 18 de jan. de 2026, 18_02_56 1 (1).png  (arquivo de trabalho esquecido)
assets/images/sad-face.png
assets/images/sad-face@2x.png
assets/images/sad-face@3x.png
assets/images/main-log-big.svg
```

### 5c. SVGs duplicados (só o `.png` equivalente é importado no código)
```
assets/images/background-2.svg          (background-2.png é usado)
assets/images/dispute-com-amigos.svg     (dispute-com-amigos.png é usado)
assets/images/jovem-negra-1.svg          (jovem-negra-1.png é usado)
assets/images/meta-diaria.svg            (meta-diaria.png é usado)
```

---

## 6. Código morto — `deleteLimitConfigUseCase`

A função foi criada no plano de melhoria mas nunca foi conectada a nenhuma tela:

```
app/features/limites/useCases/deleteLimitConfigUseCase.ts
```

> Se a funcionalidade de deletar limite não existe na UI, remover. Se for implementar futuramente, manter.

---

## 7. Diretórios vazios (scaffolding vestigial)

Foram criados durante a reestruturação por feature e agora estão completamente vazios:
```
app/hooks/
app/useCases/auth/
app/useCases/limits/
```

---

## 8. Arquivos de documentação e boilerplate na raiz

| Arquivo | Situação |
|---|---|
| `firebase-functions-example.js` | Não é importado nem executado; exemplo de referência |
| `README_novo.md` | Rascunho nunca finalizado |

---

## 9. `plano-melhorias/` — planos já concluídos

Todos os 11 arquivos numerados são `.DONE.md` (finalizados). A pasta pode ser arquivada ou deletada se o histórico de decisões já estiver no TCC/artigo:
```
plano-melhorias/01-remove-ignite-boilerplate.DONE.md
plano-melhorias/02-fix-get-user-groups-query.DONE.md
plano-melhorias/03-extract-use-app-foreground-hook.DONE.md
plano-melhorias/04-move-credentials-to-env.DONE.md
plano-melhorias/05-standardize-error-handling.DONE.md
plano-melhorias/06-extract-use-cases.DONE.md
plano-melhorias/07-ports-adapters-layer.DONE.md
plano-melhorias/08-rich-domain-entities.DONE.md
plano-melhorias/09-restructure-by-feature.DONE.md
plano-melhorias/10-cloud-functions-backend.DONE.md
plano-melhorias/11-minor-tech-debt.DONE.md
```

---

## Resumo por prioridade

| Prioridade | Item | Arquivos afetados |
|---|---|---|
| 🔴 Alta | `app/services/api/` (boilerplate Ignite) | 4 arquivos |
| 🔴 Alta | `assets/icons/demo/` + `assets/images/demo/` | ~48 arquivos |
| 🔴 Alta | Ícones demo no `iconRegistry` (clap, community, etc.) | 9 entradas no código |
| 🟡 Média | Ícones registrados mas nunca usados (bell, lock, menu...) | 14 entradas + ~30 arquivos PNG |
| 🟡 Média | Ícones `.png` com variante `.svg` usada (copy, share, notifications, search) | 9 arquivos |
| 🟡 Média | Imagens SVG duplicadas de PNGs usados | 4 arquivos |
| 🟡 Média | Imagens de app-icon padrão do Expo | 5 arquivos |
| 🟡 Média | `deleteLimitConfigUseCase.ts` (código morto) | 1 arquivo |
| 🟢 Baixa | Diretórios vazios | 3 pastas |
| 🟢 Baixa | `firebase-functions-example.js`, `README_novo.md` | 2 arquivos |
| 🟢 Baixa | `plano-melhorias/*.DONE.md` (se histórico não for necessário) | 11 arquivos |
