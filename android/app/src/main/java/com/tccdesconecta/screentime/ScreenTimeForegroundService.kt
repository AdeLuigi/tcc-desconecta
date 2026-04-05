package com.tccdesconecta.screentime

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat

class ScreenTimeForegroundService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private val syncRunnable = object : Runnable {
        override fun run() {
            runCatching {
                collectAndPersistSnapshot()
            }.onFailure { err ->
                Log.e("ScreenTimeService", "Erro na coleta em background", err)
            }
            handler.postDelayed(this, ScreenTimeBackgroundConfig.SYNC_INTERVAL_MS)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ScreenTimeBackgroundConfig.ACTION_STOP) {
            stopSelfSafely()
            return START_NOT_STICKY
        }

        startForeground(
            ScreenTimeBackgroundConfig.NOTIFICATION_ID,
            buildNotification("Monitoramento de tempo de tela em andamento")
        )

        handler.removeCallbacks(syncRunnable)
        handler.post(syncRunnable)

        return START_STICKY
    }

    override fun onDestroy() {
        handler.removeCallbacks(syncRunnable)
        super.onDestroy()
    }

    private fun stopSelfSafely() {
        handler.removeCallbacks(syncRunnable)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun collectAndPersistSnapshot() {
        val minutesToday = calculateTodayMinutes()
        val now = System.currentTimeMillis()

        getSharedPreferences(ScreenTimeBackgroundConfig.PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putLong(ScreenTimeBackgroundConfig.PREF_LAST_SYNC_AT, now)
            .putInt(ScreenTimeBackgroundConfig.PREF_LAST_MINUTES_TODAY, minutesToday)
            .apply()

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(
            ScreenTimeBackgroundConfig.NOTIFICATION_ID,
            buildNotification("Tempo hoje: ${minutesToday} min")
        )
    }

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

        val usageStatsList = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        ) ?: emptyList()

        val totalMillis = usageStatsList.sumOf { it.totalTimeInForeground }
        return (totalMillis / 1000 / 60).toInt()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            ScreenTimeBackgroundConfig.NOTIFICATION_CHANNEL_ID,
            ScreenTimeBackgroundConfig.NOTIFICATION_CHANNEL_NAME,
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Exibe o monitoramento contínuo do tempo de tela"
            setShowBadge(false)
        }

        manager.createNotificationChannel(channel)
    }

    private fun buildNotification(contentText: String): Notification {
        return NotificationCompat.Builder(this, ScreenTimeBackgroundConfig.NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_recent_history)
            .setContentTitle("Desconecta monitorando")
            .setContentText(contentText)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
