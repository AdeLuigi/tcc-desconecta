# Commit 09 — Reestruturar Pastas por Feature (Vertical Slicing)

**Mensagem de commit:** `refactor: restructure folders by feature (vertical slicing)`

---

## Objetivo

A estrutura atual organiza arquivos por **tipo de artefato** (`screens/`, `services/`, `context/`). Com 38 telas e 8 services no mesmo nível, fica difícil localizar o que pertence a cada funcionalidade. A nova estrutura agrupa por **domínio/feature**: cada feature é autossuficiente, com suas próprias telas, services e hooks.

> ⚠️ **Este é o commit de maior risco.** Ele move muitos arquivos e deve ser feito **após** os commits 05, 06, 07 e 08 estarem completos e testados. Fazer em um branch separado e validar extensivamente antes de mergear.

---

## Estrutura Alvo

```
app/
  features/
    auth/
      screens/
        LoginScreen.tsx
        CadastroScreen.tsx
        OnboardingScreen.tsx
        OnboardingFinalScreen.tsx
        BemVindoScreen.tsx
        WelcomeScreen.tsx
        ConfiguracaoPrimeiroAcessoScreen.tsx
      useCases/
        signInWithGoogleUseCase.ts       ← movido de app/useCases/auth/
      hooks/
        useGoogleLogin.ts                 ← movido de app/hooks/
    screen-time/
      screens/
        EstatisticasPessoaisScreen.tsx
        EstatisticaPessoalResumidaScreen.tsx
        HomeDinamicaScreen.tsx
        AppModoFocoScreen.tsx
      adapters/
        NativeScreenTimeGateway.ts       ← movido de app/adapters/
      ports/
        IScreenTimeGateway.ts            ← movido de app/ports/
    limites/
      screens/
        ConfigurarLimiteScreen.tsx
        LimiteAppsScreen.tsx
        LimiteTelaScreen.tsx
        BloqueioAppsScreen.tsx
        SelecionarAppsLimiteScreen.tsx
      useCases/
        saveLimitConfigUseCase.ts        ← movido de app/useCases/limits/
        deleteLimitConfigUseCase.ts
    grupos/
      screens/
        GruposDeAmigosScreen.tsx
        CriarNovoGrupoScreen.tsx
        PaginaDoGrupoScreen.tsx
        DetalhesDoGrupoScreen.tsx
        ParticipantesDoGrupoScreen.tsx
        DetalhesDoUsuarioScreen.tsx
        RankingScreen.tsx
        FeedDosGruposScreen.tsx
        BatepapoScreen.tsx
        SelecionarTipoGrupoScreen.tsx
        SelecionarCriterioGrupoScreen.tsx
      adapters/
        FirestoreGroupRepository.ts
      ports/
        IGroupRepository.ts
    desafios/
      screens/
        DesafiosDisponiveisScreen.tsx
        DesafiosInscritoScreen.tsx
        DesafiosPublicosScreen.tsx
        SelecionarAppsDesafioScreen.tsx
        AtividadeScreen.tsx
    perfil/
      screens/
        PerfilScreen.tsx
        NotificacoesScreen.tsx
  shared/
    components/         ← igual ao atual app/components/
    navigators/         ← igual ao atual app/navigators/
    theme/              ← igual ao atual app/theme/
    utils/              ← igual ao atual app/utils/
    hooks/
      useAppForeground.ts    ← movido de app/hooks/
    context/
      AuthContext.tsx
    domain/             ← movido de app/domain/
    ports/              ← ports que são verdadeiramente globais
    adapters/
      FirestoreUserRepository.ts
      FcmNotificationService.ts
      index.ts
    i18n/
```

---

## Passos de Execução

### Passo 1 — Criar a nova estrutura de pastas

```bash
mkdir -p app/features/auth/{screens,useCases,hooks}
mkdir -p app/features/screen-time/{screens,adapters,ports}
mkdir -p app/features/limites/{screens,useCases}
mkdir -p app/features/grupos/{screens,adapters,ports}
mkdir -p app/features/desafios/screens
mkdir -p app/features/perfil/screens
mkdir -p app/shared/{components,navigators,theme,utils,hooks,context,domain,adapters,i18n}
```

### Passo 2 — Mover telas para suas features

```bash
# auth
mv app/screens/LoginScreen.tsx         app/features/auth/screens/
mv app/screens/CadastroScreen.tsx      app/features/auth/screens/
mv app/screens/OnboardingScreen.tsx    app/features/auth/screens/
mv app/screens/OnboardingFinalScreen.tsx app/features/auth/screens/
mv app/screens/BemVindoScreen.tsx      app/features/auth/screens/
mv app/screens/WelcomeScreen.tsx       app/features/auth/screens/
mv app/screens/ConfiguracaoPrimeiroAcessoScreen.tsx app/features/auth/screens/

# screen-time
mv app/screens/EstatisticasPessoaisScreen.tsx     app/features/screen-time/screens/
mv app/screens/EstatisticaPessoalResumidaScreen.tsx app/features/screen-time/screens/
mv app/screens/HomeDinamicaScreen.tsx             app/features/screen-time/screens/
mv app/screens/AppModoFocoScreen.tsx              app/features/screen-time/screens/

# limites
mv app/screens/ConfigurarLimiteScreen.tsx  app/features/limites/screens/
mv app/screens/LimiteAppsScreen.tsx        app/features/limites/screens/
mv app/screens/LimiteTelaScreen.tsx        app/features/limites/screens/
mv app/screens/BloqueioAppsScreen.tsx      app/features/limites/screens/
mv app/screens/SelecionarAppsLimiteScreen.tsx app/features/limites/screens/

# grupos
mv app/screens/GruposDeAmigosScreen.tsx          app/features/grupos/screens/
mv app/screens/CriarNovoGrupoScreen.tsx          app/features/grupos/screens/
mv app/screens/PaginaDoGrupoScreen.tsx           app/features/grupos/screens/
mv app/screens/DetalhesDoGrupoScreen.tsx         app/features/grupos/screens/
mv app/screens/ParticipantesDoGrupoScreen.tsx    app/features/grupos/screens/
mv app/screens/DetalhesDoUsuarioScreen.tsx       app/features/grupos/screens/
mv app/screens/RankingScreen.tsx                 app/features/grupos/screens/
mv app/screens/FeedDosGruposScreen.tsx           app/features/grupos/screens/
mv app/screens/BatepapoScreen.tsx                app/features/grupos/screens/
mv app/screens/SelecionarTipoGrupoScreen.tsx     app/features/grupos/screens/
mv app/screens/SelecionarCriterioGrupoScreen.tsx app/features/grupos/screens/

# desafios
mv app/screens/DesafiosDisponiveisScreen.tsx  app/features/desafios/screens/
mv app/screens/DesafiosInscritoScreen.tsx     app/features/desafios/screens/
mv app/screens/DesafiosPublicosScreen.tsx     app/features/desafios/screens/
mv app/screens/SelecionarAppsDesafioScreen.tsx app/features/desafios/screens/
mv app/screens/AtividadeScreen.tsx            app/features/desafios/screens/

# perfil
mv app/screens/PerfilScreen.tsx        app/features/perfil/screens/
mv app/screens/NotificacoesScreen.tsx  app/features/perfil/screens/
```

### Passo 3 — Mover services, ports e adapters para suas features

```bash
# Mover os ports e adapters criados nos commits anteriores
mv app/ports/IScreenTimeGateway.ts       app/features/screen-time/ports/
mv app/adapters/NativeScreenTimeGateway.ts app/features/screen-time/adapters/

mv app/ports/IGroupRepository.ts         app/features/grupos/ports/
mv app/adapters/FirestoreGroupRepository.ts app/features/grupos/adapters/

# Mover shared
mv app/ports/IUserRepository.ts          app/shared/adapters/  # (port genérico)
mv app/adapters/FirestoreUserRepository.ts app/shared/adapters/
mv app/adapters/index.ts                 app/shared/adapters/
mv app/domain/                           app/shared/domain/
mv app/context/AuthContext.tsx           app/shared/context/
mv app/hooks/useAppForeground.ts         app/shared/hooks/
mv app/hooks/useGoogleLogin.ts           app/features/auth/hooks/

# Mover use cases
mv app/useCases/auth/             app/features/auth/useCases/
mv app/useCases/limits/           app/features/limites/useCases/
```

### Passo 4 — Atualizar todos os imports

Este é o passo mais trabalhoso. Usar sed ou o find & replace do editor para atualizar os caminhos:

```bash
# Exemplo: atualizar imports de screens
# Antes: @/screens/HomeDinamicaScreen
# Depois: @/features/screen-time/screens/HomeDinamicaScreen

# Atualizar tsconfig.json paths se necessário
# Verificar que @/ aponta para app/ (ou ajustar para shared/)
```

**Estratégia recomendada:** usar o "Find and Replace" do VS Code (Ctrl+Shift+H) com regex habilitado para atualizar todos os imports de uma vez por feature.

### Passo 5 — Atualizar `tsconfig.json`

Verificar que o alias `@/` ainda resolve corretamente:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./app/*"]
    }
  }
}
```

Se necessário, adicionar aliases adicionais:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./app/*"],
      "@features/*": ["./app/features/*"],
      "@shared/*": ["./app/shared/*"]
    }
  }
}
```

### Passo 6 — Atualizar `app/navigators/AppNavigator.tsx` e `BottomTabNavigator.tsx`

Todos os imports de screens devem ser atualizados para os novos caminhos. Verificar que todas as rotas continuam acessíveis.

---

## Verificação

```bash
# 1. Checar que não sobrou nenhum arquivo em app/screens/
ls app/screens/
# Esperado: apenas ErrorScreen/ (componente, não tela de feature)

# 2. Checar tipos (detecta imports quebrados)
npx tsc --noEmit

# 3. Build completo
npx expo export --platform android

# 4. Testar TODAS as telas navegando manualmente pelo app
```

---

## Resultado Esperado

- Cada feature é autossuficiente: telas, use cases, hooks e adapters no mesmo lugar.
- Novos desenvolvedores conseguem localizar o código de uma feature sem navegar entre múltiplas pastas.
- `app/shared/` contém apenas artefatos genuinamente compartilhados.
