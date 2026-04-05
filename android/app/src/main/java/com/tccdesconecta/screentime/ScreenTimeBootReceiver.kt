package com.tccdesconecta.screentime

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat

class ScreenTimeBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        // Ativa após boot completo ou boot encriptado
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED && 
            intent?.action != "android.intent.action.LOCKED_BOOT_COMPLETED") {
            return
        }

        Log.d("ScreenTimeBootReceiver", "Device booted. Starting background tracking...")
        
        // SEMPRE ativa monitoramento após reboot, independente de estado anterior
        val prefs = context.getSharedPreferences(ScreenTimeBackgroundConfig.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putBoolean(ScreenTimeBackgroundConfig.PREF_ENABLED, true)
            .apply()

        val serviceIntent = Intent(context, ScreenTimeForegroundService::class.java).apply {
            action = ScreenTimeBackgroundConfig.ACTION_START
        }
        
        try {
            ContextCompat.startForegroundService(context, serviceIntent)
            Log.d("ScreenTimeBootReceiver", "✅ Serviço de monitoramento iniciado com sucesso")
        } catch (e: Exception) {
            Log.e("ScreenTimeBootReceiver", "❌ Erro ao iniciar serviço", e)
        }
    }
}
