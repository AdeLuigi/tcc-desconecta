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
import androidx.core.content.ContextCompat
import androidx.core.app.NotificationCompat
import com.google.firebase.firestore.FirebaseFirestore
import com.tccdesconecta.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class ScreenTimeForegroundService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private var shouldRestartService = true
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
            shouldRestartService = false
            stopSelfSafely()
            return START_NOT_STICKY
        }

        shouldRestartService = true

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
        maybeRestartService("onDestroy")
        super.onDestroy()
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        maybeRestartService("onTaskRemoved")
        super.onTaskRemoved(rootIntent)
    }

    private fun stopSelfSafely() {
        handler.removeCallbacks(syncRunnable)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun maybeRestartService(origin: String) {
        val enabled = getSharedPreferences(ScreenTimeBackgroundConfig.PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(ScreenTimeBackgroundConfig.PREF_ENABLED, false)

        if (!shouldRestartService || !enabled) {
            return
        }

        Log.w("ScreenTimeService", "Serviço encerrado em $origin. Reiniciando monitoramento...")
        val restartIntent = Intent(this, ScreenTimeForegroundService::class.java).apply {
            action = ScreenTimeBackgroundConfig.ACTION_START
        }
        handler.postDelayed({
            runCatching {
                ContextCompat.startForegroundService(this, restartIntent)
            }.onFailure { err ->
                Log.e("ScreenTimeService", "Falha ao reiniciar serviço", err)
            }
        }, 1000L)
    }

    private fun collectAndPersistSnapshot() {
        val minutesToday = calculateTodayMinutes()
        val now = System.currentTimeMillis()

        getSharedPreferences(ScreenTimeBackgroundConfig.PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putLong(ScreenTimeBackgroundConfig.PREF_LAST_SYNC_AT, now)
            .putInt(ScreenTimeBackgroundConfig.PREF_LAST_MINUTES_TODAY, minutesToday)
            .apply()

        uploadSnapshotToFirestore(minutesToday)

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(
            ScreenTimeBackgroundConfig.NOTIFICATION_ID,
            buildNotification("Tempo hoje: ${minutesToday} min")
        )
    }

    private fun uploadSnapshotToFirestore(minutesToday: Int) {
        val prefs = getSharedPreferences(ScreenTimeBackgroundConfig.PREFS_NAME, Context.MODE_PRIVATE)
        val userId = prefs.getString(ScreenTimeBackgroundConfig.PREF_USER_ID, null)

        if (userId.isNullOrBlank()) {
            Log.d("ScreenTimeService", "Sem userId configurado para sync em background")
            return
        }

        val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val dateKey = formatter.format(Date())

        val payload = hashMapOf<String, Any>(
            "userId" to userId,
            "data" to dateKey,
            "tempo_total_minutos" to minutesToday,
            "categorias" to hashMapOf<String, Long>(),
            "top_apps" to emptyList<Map<String, Any>>(),
            "timestamp" to Date()
        )

        FirebaseFirestore.getInstance()
            .collection("estatisticas")
            .whereEqualTo("userId", userId)
            .whereEqualTo("data", dateKey)
            .limit(1)
            .get()
            .addOnSuccessListener { snapshot ->
                if (!snapshot.isEmpty) {
                    val existing = snapshot.documents.first()
                    existing.reference.update(payload)
                        .addOnFailureListener { err ->
                            Log.e("ScreenTimeService", "Erro ao atualizar estatística diária", err)
                        }
                } else {
                    FirebaseFirestore.getInstance()
                        .collection("estatisticas")
                        .add(payload)
                        .addOnFailureListener { err ->
                            Log.e("ScreenTimeService", "Erro ao criar estatística diária", err)
                        }
                }
            }
            .addOnFailureListener { err ->
                Log.e("ScreenTimeService", "Erro ao consultar estatística diária", err)
            }
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
        val notification = NotificationCompat.Builder(this, ScreenTimeBackgroundConfig.NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Desconecta monitorando")
            .setContentText(contentText)
            .setOngoing(true)
            .setAutoCancel(false)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        notification.flags = notification.flags or Notification.FLAG_ONGOING_EVENT or Notification.FLAG_NO_CLEAR
        return notification
    }
}
