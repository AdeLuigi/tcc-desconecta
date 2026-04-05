package com.tccdesconecta.screentime

object ScreenTimeBackgroundConfig {
    const val PREFS_NAME = "screentime_background_prefs"
    const val PREF_ENABLED = "background_tracking_enabled"
    const val PREF_LAST_SYNC_AT = "last_sync_at"
    const val PREF_LAST_MINUTES_TODAY = "last_minutes_today"

    const val ACTION_START = "com.tccdesconecta.screentime.action.START"
    const val ACTION_STOP = "com.tccdesconecta.screentime.action.STOP"

    const val NOTIFICATION_CHANNEL_ID = "screentime_background_channel"
    const val NOTIFICATION_CHANNEL_NAME = "Monitoramento de tempo de tela"
    const val NOTIFICATION_ID = 9201

    const val SYNC_INTERVAL_MS = 15 * 60 * 1000L
}
