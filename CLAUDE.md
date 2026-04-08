# Notas técnicas para o assistente de IA

Este arquivo documenta decisões técnicas não-óbvias do projeto para auxiliar em futuras melhorias.

---

## Bloqueio de apps Android — AccessibilityService + Handler de polling

### O problema
O `AppBlockerAccessibilityService` usa `TYPE_WINDOW_STATE_CHANGED` para detectar qual app está em foreground. **Este evento só dispara quando o usuário navega entre apps** (abre um novo app, volta ao launcher, etc.).

Se o usuário já está dentro de um app bloqueado quando o limite de tempo é atingido, **nenhum evento novo é disparado** — o serviço não percebe que o limite foi ultrapassado enquanto o usuário permanece no mesmo app.

### A solução implementada
`AppBlockerAccessibilityService.kt` mantém `currentForegroundPackage` (atualizado a cada evento) e usa um `Handler` com `periodicCheckRunnable` que chama `checkAndBlockIfNeeded()` periodicamente, mesmo sem eventos novos.

```kotlin
private const val POLL_INTERVAL_MS = 60_000L  // 60s em produção
```

O mesmo método `checkAndBlockIfNeeded()` é chamado tanto pelo evento de janela quanto pelo poll periódico.

### Intervalo recomendado
- **Produção**: `60_000L` (60 segundos) — bom equilíbrio entre responsividade e bateria
- **Testes/debug**: `30_000L` ou menos

### Onde alterar
`android/app/src/main/java/com/tccdesconecta/screentime/AppBlockerAccessibilityService.kt`, constante `POLL_INTERVAL_MS`.

---

## Cálculo de tempo de tela por app — UsageEvents vs UsageStatsManager

### Por que usamos `queryEvents()` e não `queryUsageStats()`
`UsageStatsManager.queryUsageStats()` retorna `totalTimeInForeground` que **só é atualizado quando o app vai para background**. Enquanto o app está aberto, o valor retornado está desatualizado.

`queryEvents()` retorna eventos individuais `MOVE_TO_FOREGROUND` / `MOVE_TO_BACKGROUND`, permitindo calcular o tempo em tempo real — inclusive somando a sessão atual ainda aberta (`endTime - lastForegroundTime`).

### Onde está implementado
`AppBlockerAccessibilityService.kt`, método `calculateAppScreenTime(targetPackage: String)`.

---

## Lentidão no save (Firestore + re-fetch)

### O problema identificado
Após salvar no Firestore (`updateDoc`), o código fazia um `getUserData()` (re-fetch) para atualizar o contexto. O Firestore no React Native usa uma única conexão — o re-fetch demorava 30-50 segundos e bloqueava operações subsequentes.

### A solução
Atualizar o `userData` do contexto **localmente** com os dados já conhecidos, sem re-fetch. Implementado em `ConfigurarLimiteScreen.tsx` e `PerfilScreen.tsx`.

---

## Configuração de bloqueio — estrutura per-app

### SharedPreferences nativa (`AppBlockerConfig.kt`)
Cada app tem seu próprio limite e dias ativos, armazenados em JSON:
```json
{
  "com.instagram.android": { "limitMinutes": 30, "activeDays": ["SEG","TER",...] },
  "com.tiktok.android":    { "limitMinutes": 60, "activeDays": ["SEG","TER",...] }
}
```
Isso permite que cada grupo de limite (`LimiteConfig`) tenha configurações independentes, em vez de um limite global compartilhado.

### Sincronização JS → Nativo
Ao salvar um `LimiteConfig`, o `ConfigurarLimiteScreen.tsx` monta o mapa per-app e chama `screenTimeService.configureAppBlocking(appConfigs, true)`. Se um app aparecer em múltiplos `LimiteConfig`, usa o limite **mais restritivo** (menor valor).
