package com.tccdesconecta.screentime

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class ScreenTimeBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return

        val prefs = context.getSharedPreferences(ScreenTimeBackgroundConfig.PREFS_NAME, Context.MODE_PRIVATE)
        val enabled = prefs.getBoolean(ScreenTimeBackgroundConfig.PREF_ENABLED, false)
        if (!enabled) return

        val serviceIntent = Intent(context, ScreenTimeForegroundService::class.java).apply {
            action = ScreenTimeBackgroundConfig.ACTION_START
        }
        ContextCompat.startForegroundService(context, serviceIntent)
    }
}
