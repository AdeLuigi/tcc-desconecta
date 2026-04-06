package com.tccdesconecta.screentime

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
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
        // Cooldown para não lançar BlockActivity repetidamente (5 segundos)
        private const val BLOCK_COOLDOWN_MS = 5000L
    }

    private var lastBlockedTimestamp = 0L
    private var lastBlockedPackage: String? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 300L
        }
        serviceInfo = info
        Log.d(TAG, "AccessibilityService conectado e configurado")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return
        
        // Ignora eventos do próprio app e do sistema
        if (packageName == this.packageName) return
        if (packageName == "com.android.systemui") return
        if (packageName == "com.android.launcher" || packageName.contains("launcher")) return

        // Verifica se o bloqueio está ativo
        if (!AppBlockerConfig.isBlockingEnabled(this)) return

        // Verifica se o app está na lista de bloqueados
        val blockedApps = AppBlockerConfig.getBlockedApps(this)
        if (!blockedApps.contains(packageName)) return

        // Verifica se o limite de tempo foi atingido
        val limitMinutes = AppBlockerConfig.getLimitMinutes(this)
        val usedMinutes = calculateTodayScreenTime()

        if (usedMinutes < limitMinutes) {
            Log.d(TAG, "App $packageName na lista, mas tempo ($usedMinutes min) ainda abaixo do limite ($limitMinutes min)")
            return
        }

        // Cooldown para não bloquear repetidamente
        val now = System.currentTimeMillis()
        if (packageName == lastBlockedPackage && (now - lastBlockedTimestamp) < BLOCK_COOLDOWN_MS) {
            return
        }

        Log.d(TAG, "BLOQUEANDO app: $packageName (tempo: $usedMinutes min, limite: $limitMinutes min)")

        lastBlockedTimestamp = now
        lastBlockedPackage = packageName

        // Lança a BlockActivity
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
     * Calcula o tempo total de tela de hoje usando UsageStatsManager.
     */
    private fun calculateTodayScreenTime(): Int {
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

        val usageStatsList = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        ) ?: return 0

        val totalMillis = usageStatsList.sumOf { it.totalTimeInForeground }
        return (totalMillis / 1000 / 60).toInt()
    }
}
