# Commit 01 — Remove Ignite Boilerplate

**Mensagem de commit:** `chore: remove Ignite boilerplate artifacts`

---

## Objetivo

Remover artefatos remanescentes do template Ignite que não fazem parte do produto Desconecta. Esses arquivos adicionam ruído ao projeto, aumentam o bundle e geram confusão para novos desenvolvedores.

---

## Arquivos a Deletar

| Arquivo/Pasta | Motivo |
|---|---|
| `app/screens/DemoCommunityScreen.tsx` | Tela do boilerplate |
| `app/screens/DemoDebugScreen.tsx` | Tela do boilerplate |
| `app/screens/DemoPodcastListScreen.tsx` | Tela do boilerplate |
| `app/screens/DemoShowroomScreen/` | Pasta inteira do boilerplate |
| `app/navigators/DemoNavigator.tsx` | Navigator do boilerplate |
| `app/context/EpisodeContext.tsx` | Context do boilerplate (podcast) |
| `app/i18n/demo-ar.ts` | Tradução do boilerplate |
| `app/i18n/demo-en.ts` | Tradução do boilerplate |
| `app/i18n/demo-es.ts` | Tradução do boilerplate |
| `app/i18n/demo-fr.ts` | Tradução do boilerplate |
| `app/i18n/demo-hi.ts` | Tradução do boilerplate |
| `app/i18n/demo-ja.ts` | Tradução do boilerplate |
| `app/i18n/demo-ko.ts` | Tradução do boilerplate |

---

## Arquivos a Modificar

### `app/navigators/AppNavigator.tsx`

1. Remover o import de `DemoNavigator`.
2. Remover a rota `Demo` do `RootNavigator` (stack screen e qualquer referência).
3. Remover `DemoTabScreenProps` do tipo exportado, se existir.

### `app/app.tsx`

Remover as entradas de rota Demo do linking config:
```diff
-  DemoShowroom: {
-    screens: { ... }
-  },
-  DemoDebug: "debug",
-  DemoPodcastList: "podcast",
-  DemoCommunity: "community",
```

### `app/i18n/en.ts`

Remover o import e o spread de `demoEn`:
```diff
-import demoEn from "./demo-en"
 export default {
-  ...demoEn,
   // restante das traduções do app
 }
```

Repetir o mesmo padrão em `ar.ts`, `es.ts`, `fr.ts`, `hi.ts`, `ja.ts`, `ko.ts`.

### `app/navigators/navigationTypes.ts`

Remover o tipo `DemoTabParamList` e `DemoTabScreenProps` se presentes.

---

## Passos de Execução

```bash
# 1. Deletar telas Demo
rm app/screens/DemoCommunityScreen.tsx
rm app/screens/DemoDebugScreen.tsx
rm app/screens/DemoPodcastListScreen.tsx
rm -rf app/screens/DemoShowroomScreen/

# 2. Deletar navigator Demo
rm app/navigators/DemoNavigator.tsx

# 3. Deletar context do boilerplate
rm app/context/EpisodeContext.tsx

# 4. Deletar traduções demo
rm app/i18n/demo-ar.ts app/i18n/demo-en.ts app/i18n/demo-es.ts \
   app/i18n/demo-fr.ts app/i18n/demo-hi.ts app/i18n/demo-ja.ts app/i18n/demo-ko.ts

# 5. Editar AppNavigator.tsx — remover import e rota Demo
# 6. Editar app.tsx — remover linking config das rotas Demo
# 7. Editar cada i18n/*.ts — remover import demoXX e spread ...demoXX
# 8. Editar navigationTypes.ts — remover DemoTabParamList / DemoTabScreenProps
```

---

## Verificação

```bash
# Verificar que não há mais referências a Demo no código do app
grep -r "Demo" app/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"

# Rodar o app e confirmar que inicia sem erros
npx expo start --android
```

---

## Resultado Esperado

- O projeto compila sem erros de TypeScript relacionados às rotas Demo.
- Nenhuma referência a `DemoNavigator`, `EpisodeContext` ou `demo-*.ts` permanece no código.
- O bundle final é menor.
