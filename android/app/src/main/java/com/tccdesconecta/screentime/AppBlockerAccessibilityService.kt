package com.tccdesconecta.screentime

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import java.util.Calendar

/**
 * AccessibilityService que detecta qual app está em primeiro plano em tempo real.
 * Quando o app está na lista de bloqueados e o limite de tempo foi atingido,
 * lança a BlockActivity por cima.
 */
class AppBlockerAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "AppBlockerService"
        private const val BLOCK_COOLDOWN_MS = 5000L
        // Verificação periódica: a cada 60 segundos (mudar para 30000L em testes)
        private const val POLL_INTERVAL_MS = 30_000L
    }

    private var lastBlockedTimestamp = 0L
    private var lastBlockedPackage: String? = null
    private var currentForegroundPackage: String? = null

    private val handler = Handler(Looper.getMainLooper())
    private val periodicCheckRunnable = object : Runnable {
        override fun run() {
            val pkg = currentForegroundPackage
            if (pkg != null) {
                Log.d(TAG, "[POLL] Verificando $pkg periodicamente...")
                checkAndBlockIfNeeded(pkg)
            }
            handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 300L
        }
        serviceInfo = info
        handler.postDelayed(periodicCheckRunnable, POLL_INTERVAL_MS)
        Log.d(TAG, "AccessibilityService conectado e configurado")
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(periodicCheckRunnable)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return
        
        if (packageName == this.packageName) return
        if (packageName == "com.android.systemui") return
        if (packageName == "com.android.launcher" || packageName.contains("launcher")) return

        // Atualiza o app em foreground para o poll periódico
        currentForegroundPackage = packageName

        Log.d(TAG, ">>> Evento de: $packageName")
        checkAndBlockIfNeeded(packageName)
    }

    private fun checkAndBlockIfNeeded(packageName: String) {
        if (!AppBlockerConfig.isBlockingEnabled(this)) {
            Log.d(TAG, "  ✗ Bloqueio DESATIVADO")
            return
        }

        val blockedApps = AppBlockerConfig.getBlockedApps(this)
        Log.d(TAG, "  Apps bloqueados (${blockedApps.size}): $blockedApps")
        if (!blockedApps.contains(packageName)) {
            Log.d(TAG, "  ✗ $packageName NÃO está na lista de bloqueados")
            return
        }

        val todayKey = getTodayDayKey()
        val activeDays = AppBlockerConfig.getAppActiveDays(this, packageName)
        Log.d(TAG, "  Hoje=$todayKey, diasAtivos=$activeDays")
        if (!activeDays.contains(todayKey)) {
            Log.d(TAG, "  ✗ Hoje ($todayKey) não é dia ativo")
            return
        }

        val limitMinutes = AppBlockerConfig.getAppLimitMinutes(this, packageName)
        Log.d(TAG, "  Limite para $packageName: $limitMinutes min")
        if (limitMinutes == null) {
            Log.d(TAG, "  ✗ Limite é null, retornando")
            return
        }

        val usedMinutes = calculateAppScreenTime(packageName)
        Log.d(TAG, "  Tempo usado: $usedMinutes min / limite: $limitMinutes min")

        if (usedMinutes < limitMinutes) {
            Log.d(TAG, "  ✗ Tempo ($usedMinutes min) abaixo do limite ($limitMinutes min)")
            return
        }

        val now = System.currentTimeMillis()
        if (packageName == lastBlockedPackage && (now - lastBlockedTimestamp) < BLOCK_COOLDOWN_MS) {
            Log.d(TAG, "  ✗ Em cooldown, ignorando")
            return
        }

        Log.d(TAG, "  ✓ BLOQUEANDO app: $packageName (tempo: $usedMinutes min, limite: $limitMinutes min)")

        lastBlockedTimestamp = now
        lastBlockedPackage = packageName

        val blockIntent = Intent(this, BlockActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("blocked_app", packageName)
            putExtra("limit_minutes", limitMinutes)
        }
        startActivity(blockIntent)
    }

    override fun onInterrupt() {
        Log.d(TAG, "AccessibilityService interrompido")
    }

    /**
     * Calcula o tempo de tela de hoje para um app ESPECÍFICO usando UsageEvents.
     * UsageEvents fornece dados em tempo real (diferente de queryUsageStats que
     * só atualiza quando o app vai para background).
     */
    private fun calculateAppScreenTime(targetPackage: String): Int {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return 0

        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        val startTime = calendar.timeInMillis
        val endTime = System.currentTimeMillis()

        val usageEvents = usageStatsManager.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()

        var totalMillis = 0L
        var lastForegroundTime = 0L

        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            if (event.packageName != targetPackage) continue

            when (event.eventType) {
                UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                    lastForegroundTime = event.timeStamp
                }
                UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                    if (lastForegroundTime > 0) {
                        totalMillis += event.timeStamp - lastForegroundTime
                        lastForegroundTime = 0L
                    }
                }
            }
        }

        // Se o app ainda está em foreground, soma o tempo até agora
        if (lastForegroundTime > 0) {
            totalMillis += endTime - lastForegroundTime
        }

        return (totalMillis / 1000 / 60).toInt()
    }

    /**
     * Retorna a sigla do dia da semana atual (SEG, TER, QUA, QUI, SEX, SAB, DOM).
     */
    private fun getTodayDayKey(): String {
        return when (Calendar.getInstance().get(Calendar.DAY_OF_WEEK)) {
            Calendar.MONDAY -> "SEG"
            Calendar.TUESDAY -> "TER"
            Calendar.WEDNESDAY -> "QUA"
            Calendar.THURSDAY -> "QUI"
            Calendar.FRIDAY -> "SEX"
            Calendar.SATURDAY -> "SAB"
            Calendar.SUNDAY -> "DOM"
            else -> "SEG"
        }
    }
}
