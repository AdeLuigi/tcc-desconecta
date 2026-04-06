package com.tccdesconecta.screentime

import android.content.Context
import android.content.SharedPreferences

/**
 * Configuração compartilhada para o bloqueio de apps.
 * Armazena a lista de apps bloqueados e o limite de tempo.
 */
object AppBlockerConfig {
    private const val PREFS_NAME = "app_blocker_prefs"
    private const val KEY_BLOCKED_APPS = "blocked_apps"
    private const val KEY_LIMIT_MINUTES = "limit_minutes"
    private const val KEY_BLOCKING_ENABLED = "blocking_enabled"

    private fun prefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun setBlockedApps(context: Context, packageNames: List<String>) {
        prefs(context).edit()
            .putStringSet(KEY_BLOCKED_APPS, packageNames.toSet())
            .apply()
    }

    fun getBlockedApps(context: Context): Set<String> {
        return prefs(context).getStringSet(KEY_BLOCKED_APPS, emptySet()) ?: emptySet()
    }

    fun setLimitMinutes(context: Context, minutes: Int) {
        prefs(context).edit()
            .putInt(KEY_LIMIT_MINUTES, minutes)
            .apply()
    }

    fun getLimitMinutes(context: Context): Int {
        return prefs(context).getInt(KEY_LIMIT_MINUTES, 60)
    }

    fun setBlockingEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit()
            .putBoolean(KEY_BLOCKING_ENABLED, enabled)
            .apply()
    }

    fun isBlockingEnabled(context: Context): Boolean {
        return prefs(context).getBoolean(KEY_BLOCKING_ENABLED, false)
    }
}
