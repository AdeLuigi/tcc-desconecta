# Plano 13 — Unificar Cálculos de Tempo de Tela

**Mensagem de commit sugerida:** `refactor: unify screen time calculations and formatting`

---

## Objetivo

Eliminar as inconsistências nos cálculos e na exibição de tempo de tela que existem espalhadas por todo o app. Atualmente existem **3 fontes de dado divergentes**, **5 implementações duplicadas de formatação** e **múltiplos writes concorrentes** ao Firestore para o mesmo documento. Este plano unifica tudo em uma fonte canônica por responsabilidade.

---

## Diagnóstico Completo

### 3 fontes de dado que divergem entre si

```
┌── Fonte A: queryEvents() (real-time) ─────────────────────────────────┐
│  ScreenTimeModule.kt → getScreenTimeByApp(), getScreenTimeToday(),     │
│  getScreenTimeForSpecificDay()                                         │
│                                                                        │
│  Algoritmo: itera UsageEvents.MOVE_TO_FOREGROUND / MOVE_TO_BACKGROUND │
│  Aplica SESSION_TIMEOUT de 5 min por sessão                           │
│  Filtra apps via isAppRelevant() (70+ pacotes bloqueados)              │
│                                                                        │
│  Usado por: HomeDinamicaScreen, EstatisticaPessoalResumidaScreen       │
│  (period=1), AppBlockerAccessibilityService                            │
└────────────────────────────────────────────────────────────────────────┘

┌── Fonte B: queryUsageStats() (stale) ─────────────────────────────────┐
│  ScreenTimeForegroundService.kt → calculateTodayMinutes()              │
│                                                                        │
│  Algoritmo: usa INTERVAL_DAILY do UsageStatsManager                   │
│  ⚠️ Só atualiza quando o app vai para background                       │
│  ⚠️ Não aplica SESSION_TIMEOUT                                         │
│  ⚠️ Não filtra launchers/apps de sistema                               │
│  Intervalo: a cada SYNC_INTERVAL_MS (15 min)                          │
│                                                                        │
│  Usado por: notificação persistente, sync background com Firestore     │
└────────────────────────────────────────────────────────────────────────┘

┌── Fonte C: Firestore (agregado diário) ───────────────────────────────┐
│  StatisticsService.ts → getUserStatistics(userId, days)               │
│                                                                        │
│  Algoritmo: query na coleção "estatisticas" WHERE userId AND data >=   │
│  Agrega: soma tempos, calcula média/dia, extrai top 10 apps            │
│  Dados vêm da Fonte A (salvos pelas telas) + Fonte B (serviço bg)     │
│  ⚠️ Fonte B sobrescreve Fonte A com dados menos precisos               │
│                                                                        │
│  Usado por: EstatisticaPessoalResumidaScreen (period=7), ranking de    │
│  grupos, streaks, DetalhesDoGrupoScreen                                │
└────────────────────────────────────────────────────────────────────────┘
```

### 5 implementações de formatação duplicadas

| Arquivo | Função | Formato de saída | Diferença |
|---|---|---|---|
| `app/services/screenTime.ts:255` | `formatTime(minutes)` | `Xh Ymin` / `Xh` / `Ymin` | Referência |
| `app/services/statisticsService.ts:140` | `formatTime(minutes)` | `Xh Ymin` / `Xh` / `Ymin` | **Cópia idêntica** |
| `app/features/screen-time/screens/HomeDinamicaScreen.tsx:336` | Inline | `${hours}h ${minutes}m` | **"m" em vez de "min"** |
| `app/features/limites/screens/ConfigurarLimiteScreen.tsx:78` | `formatMinutes(min)` | `Xh Ymin` / `Xh` / `Ymin` | Cópia local |
| `app/features/perfil/screens/PerfilScreen.tsx:289` | `formatMinutes(min)` | `Xh Ymin` / `Xh` | Cópia local |
| `app/features/screen-time/screens/EstatisticaPessoalResumidaScreen.tsx:394` | `formatLimitTime(minutes)` | `Xh${Y}min` / `Xh` / `${m}min` | Variante para limite |

> **Nota:** `FeedPosts.tsx` e `PostComments.tsx` também têm `formatTime`, mas formatam horário do relógio (HH:MM), não duração — são casos diferentes e não devem ser unificados com os acima.

### Writes concorrentes ao Firestore

`saveScreenTimeData()` é chamado de forma independente em:

1. `HomeDinamicaScreen.tsx` — ao abrir a tela e ao voltar ao foreground
2. `EstatisticaPessoalResumidaScreen.tsx` — period=1 (hoje) ao abrir/focar
3. `EstatisticaPessoalResumidaScreen.tsx` — period=7 (semanal) ao abrir/focar
4. `ScreenTimeForegroundService.kt` — a cada SYNC_INTERVAL_MS (15 min) em background

Se o usuário navegar entre as telas 1 e 2 no mesmo dia, o documento do dia é sobrescrito múltiplas vezes. O serviço background (item 4) usa Fonte B (stale) e pode sobrescrever dados mais precisos da Fonte A.

### Inconsistência no AppBlockerAccessibilityService

`calculateAppScreenTime()` em `AppBlockerAccessibilityService.kt` usa `queryEvents()` (correto), mas **não aplica o SESSION_TIMEOUT de 5 minutos** que existe em `ScreenTimeModule.kt`. Isso significa que o bloqueio pode ser ativado em um ponto diferente do tempo que é exibido ao usuário.

---

## Itens do Plano

### Item 1 — Criar `app/utils/timeFormat.ts` (função canônica)

**Problema:** 5 cópias de `formatTime` espalhadas.  
**Solução:** Extrair para um único utilitário e atualizar todos os imports.

**Arquivo a criar:** `app/utils/timeFormat.ts`

```typescript
/**
 * Formata minutos como string legível de duração.
 * Ex: 90 → "1h 30min" | 60 → "1h" | 45 → "45min" | 0 → "0min"
 */
export function formatScreenTime(minutes: number): string {
  if (minutes <= 0) return "0min"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}
```

**Arquivos a atualizar (remover cópia local e importar):**

| Arquivo | Ação |
|---|---|
| `app/services/screenTime.ts` | Remover `formatTime()`, exportar `formatScreenTime` de `timeFormat.ts` ou re-exportar |
| `app/services/statisticsService.ts` | Remover `formatTime()`, importar de `timeFormat.ts` |
| `app/features/screen-time/screens/HomeDinamicaScreen.tsx` | Substituir inline `${hours}h ${minutes}m` por `formatScreenTime(screenTimeToday)` |
| `app/features/limites/screens/ConfigurarLimiteScreen.tsx` | Remover `formatMinutes()`, importar `formatScreenTime` |
| `app/features/perfil/screens/PerfilScreen.tsx` | Remover `formatMinutes()`, importar `formatScreenTime` |
| `app/features/screen-time/screens/EstatisticaPessoalResumidaScreen.tsx` | Remover `formatLimitTime()`, usar `formatScreenTime` |

> **Atenção ao `HomeDinamicaScreen`:** O formato atual é `${h}h ${m}m` (com "m" no final). Ao unificar para `Xh Ymin`, o visual do card muda ligeiramente — confirmar com design se é aceitável.

---

### Item 2 — Trocar `queryUsageStats` por `queryEvents` no serviço background

**Problema:** `ScreenTimeForegroundService.kt` usa `queryUsageStats(INTERVAL_DAILY)` que retorna dados desatualizados enquanto um app está aberto.  
**Solução:** Substituir `calculateTodayMinutes()` por uma implementação baseada em `queryEvents`, igual ao algoritmo de `ScreenTimeModule.kt`.

**Arquivo:** `android/app/src/main/java/com/tccdesconecta/screentime/ScreenTimeForegroundService.kt`

**Método atual (`calculateTodayMinutes`) — linha ~180:**
```kotlin
// ATUAL: usa queryUsageStats (stale)
private fun calculateTodayMinutes(): Int {
    val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    // ...
    val usageStatsList = usageStatsManager.queryUsageStats(
        UsageStatsManager.INTERVAL_DAILY, startTime, endTime
    ) ?: emptyList()
    val totalMillis = usageStatsList.sumOf { it.totalTimeInForeground }
    return (totalMillis / 1000 / 60).toInt()
}
```

**Substituição por `queryEvents` (mesmo algoritmo do ScreenTimeModule):**
```kotlin
// NOVO: usa queryEvents (real-time, mesmo algoritmo que as telas usam)
private fun calculateTodayMinutes(): Int {
    val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val calendar = java.util.Calendar.getInstance().apply {
        set(java.util.Calendar.HOUR_OF_DAY, 0)
        set(java.util.Calendar.MINUTE, 0)
        set(java.util.Calendar.SECOND, 0)
        set(java.util.Calendar.MILLISECOND, 0)
    }
    val startTime = calendar.timeInMillis
    val endTime = System.currentTimeMillis()
    val SESSION_TIMEOUT = 5 * 60 * 1000L

    val events = usageStatsManager.queryEvents(startTime, endTime)
    val lastForeground = mutableMapOf<String, Long>()
    var totalMs = 0L
    val event = android.app.usage.UsageEvents.Event()

    while (events.hasNextEvent()) {
        events.getNextEvent(event)
        val pkg = event.packageName ?: continue
        when (event.eventType) {
            android.app.usage.UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                val prev = lastForeground[pkg]
                if (prev != null && event.timeStamp > prev) {
                    val sessionStart = maxOf(prev, startTime)
                    val sessionEnd = minOf(event.timeStamp, endTime, prev + SESSION_TIMEOUT)
                    if (sessionEnd > sessionStart) totalMs += sessionEnd - sessionStart
                }
                lastForeground[pkg] = event.timeStamp
            }
            android.app.usage.UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                val start = lastForeground.remove(pkg) ?: return@run
                val sessionStart = maxOf(start, startTime)
                val sessionEnd = minOf(event.timeStamp, endTime)
                if (sessionEnd > sessionStart) totalMs += sessionEnd - sessionStart
            }
        }
    }
    // Sessões ainda abertas
    lastForeground.forEach { (_, startedAt) ->
        val sessionStart = maxOf(startedAt, startTime)
        val sessionEnd = minOf(endTime, startedAt + SESSION_TIMEOUT)
        if (sessionEnd > sessionStart) totalMs += sessionEnd - sessionStart
    }
    return (totalMs / 1000 / 60).toInt()
}
```

> **Impacto:** A notificação vai exibir o mesmo número que o card da HomeDinamicaScreen. O sync para o Firestore vai salvar dados precisos em vez de dados defasados.

---

### Item 3 — Centralizar o save no Firestore (evitar writes concorrentes)

**Problema:** `saveScreenTimeData()` é chamado de 3 lugares no lado JS, potencialmente sobrescrevendo dados mais recentes com dados mais antigos.

**Solução:** Manter o save **apenas em `HomeDinamicaScreen`**, que já é a tela principal que carrega o app todo dia. `EstatisticaPessoalResumidaScreen` deve **somente ler** — o dado já foi salvo pela Home.

**Arquivos a alterar:**

**`app/features/screen-time/screens/EstatisticaPessoalResumidaScreen.tsx`**

Remover as 2 chamadas a `saveScreenTimeData()` (period=1 e period=7). Manter apenas a leitura:

```typescript
// REMOVER (period=1, ~linha 237):
ScreenTimeService.saveScreenTimeData(userData.uid, todayTime, appsWithCategory as any)
  .then(...)
  .catch(...)

// REMOVER (period=7, ~linha 315):
ScreenTimeService.saveScreenTimeData(userData.uid, todayTime, appsWithCategory as any)
  .then(...)
  .catch(...)
```

> **Atenção:** Verificar se o `saveLastSevenDaysData()` ainda deve existir (ele preenche dados históricos de dias sem registro). Esse pode ser mantido em `HomeDinamicaScreen` no `useEffect` de `hasLoadedHistoricalData`.

---

### Item 4 — Adicionar SESSION_TIMEOUT ao AppBlockerAccessibilityService

**Problema:** `calculateAppScreenTime()` em `AppBlockerAccessibilityService.kt` não aplica o cap de 5 minutos por sessão, podendo divergir do tempo exibido ao usuário.

**Arquivo:** `android/app/src/main/java/com/tccdesconecta/screentime/AppBlockerAccessibilityService.kt`

**Mudança:** Adicionar a constante e a lógica de cap nas sessões em aberto, espelhando o algoritmo do `ScreenTimeModule.kt`:

```kotlin
// Adicionar constante (mesma do ScreenTimeModule):
private const val SESSION_TIMEOUT_MS = 5 * 60 * 1000L

// Em calculateAppScreenTime(), ao processar MOVE_TO_FOREGROUND:
// Adicionar cap nas sessões sem BACKGROUND:
val maxSessionEnd = previousStart + SESSION_TIMEOUT_MS
val sessionEnd = minOf(event.timeStamp, endTime, maxSessionEnd)

// Ao processar sessões ainda abertas ao final (se app ainda em foreground):
val sessionEnd = minOf(endTime, startedAt + SESSION_TIMEOUT_MS)
```

---

## Ordem de Execução Recomendada

```
Item 1 (formatação) → sem risco, pode ser feito primeiro e de forma isolada
Item 2 (queryEvents no serviço bg) → após Item 1, antes do Item 3
Item 3 (centralizar save) → após Item 2 (garante que o serviço bg está preciso)
Item 4 (SESSION_TIMEOUT no bloqueador) → pode ser feito em paralelo com qualquer outro
```

---

## Impacto Esperado Após Conclusão

| Antes | Depois |
|---|---|
| Notificação mostra tempo diferente da tela Home | Notificação e Home mostram o mesmo número |
| `formatTime` precisa ser atualizado em 5 arquivos | Uma mudança em `timeFormat.ts` propaga para todo o app |
| EstatisticaPessoalResumidaScreen pode sobrescrever dados da Home | Só a Home salva; Estatísticas apenas lê |
| Bloqueio pode disparar em ponto diferente do tempo exibido | Bloqueio e exibição usam o mesmo algoritmo |
| `${hours}h ${minutes}m` na Home vs `Xh Ymin` nas outras telas | Formato unificado em todas as telas |

---

## Arquivos Envolvidos

### Novo arquivo
- `app/utils/timeFormat.ts`

### Arquivos JS/TS a modificar
- `app/services/screenTime.ts` — remover `formatTime()`
- `app/services/statisticsService.ts` — remover `formatTime()`
- `app/features/screen-time/screens/HomeDinamicaScreen.tsx` — substituir inline format + remover save duplicado não
- `app/features/screen-time/screens/EstatisticaPessoalResumidaScreen.tsx` — remover `formatLimitTime()`, remover saves, importar `formatScreenTime`
- `app/features/limites/screens/ConfigurarLimiteScreen.tsx` — remover `formatMinutes()`, importar `formatScreenTime`
- `app/features/perfil/screens/PerfilScreen.tsx` — remover `formatMinutes()`, importar `formatScreenTime`

### Arquivos Kotlin a modificar
- `android/app/src/main/java/com/tccdesconecta/screentime/ScreenTimeForegroundService.kt` — substituir `calculateTodayMinutes()`
- `android/app/src/main/java/com/tccdesconecta/screentime/AppBlockerAccessibilityService.kt` — adicionar `SESSION_TIMEOUT_MS`
