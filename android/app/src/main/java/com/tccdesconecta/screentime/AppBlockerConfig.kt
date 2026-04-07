package com.tccdesconecta.screentime

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

/**
 * Configuração compartilhada para o bloqueio de apps.
 * Armazena configuração por app: cada app tem seu próprio limite e dias ativos.
 *
 * Formato JSON armazenado em "app_configs":
 * {
 *   "com.instagram.android": { "limitMinutes": 30, "activeDays": ["SEG","TER",...] },
 *   "com.tiktok.android":    { "limitMinutes": 60, "activeDays": ["SEG","TER",...] }
 * }
 */
object AppBlockerConfig {
    private const val PREFS_NAME = "app_blocker_prefs"
    private const val KEY_BLOCKING_ENABLED = "blocking_enabled"
    private const val KEY_APP_CONFIGS = "app_configs"

    private fun prefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    // ---- Habilitado/Desabilitado ----

    fun setBlockingEnabled(context: Context, enabled: Boolean) {
        prefs(context).edit()
            .putBoolean(KEY_BLOCKING_ENABLED, enabled)
            .apply()
    }

    fun isBlockingEnabled(context: Context): Boolean {
        return prefs(context).getBoolean(KEY_BLOCKING_ENABLED, false)
    }

    // ---- Configurações per-app ----

    /**
     * Salva o mapa completo de configs por app.
     * @param configs  Map<packageName, Pair<limitMinutes, activeDays>>
     */
    fun setAppConfigs(context: Context, configs: Map<String, Pair<Int, Set<String>>>) {
        val json = JSONObject()
        for ((pkg, pair) in configs) {
            val entry = JSONObject()
            entry.put("limitMinutes", pair.first)
            val daysArray = org.json.JSONArray()
            for (day in pair.second) daysArray.put(day)
            entry.put("activeDays", daysArray)
            json.put(pkg, entry)
        }
        prefs(context).edit()
            .putString(KEY_APP_CONFIGS, json.toString())
            .apply()
    }

    /**
     * Retorna o set de todos os pacotes bloqueados.
     */
    fun getBlockedApps(context: Context): Set<String> {
        val json = prefs(context).getString(KEY_APP_CONFIGS, null) ?: return emptySet()
        return try {
            val obj = JSONObject(json)
            obj.keys().asSequence().toSet()
        } catch (e: Exception) {
            emptySet()
        }
    }

    /**
     * Retorna o limite em minutos para um app específico, ou null se não está bloqueado.
     */
    fun getAppLimitMinutes(context: Context, packageName: String): Int? {
        val json = prefs(context).getString(KEY_APP_CONFIGS, null) ?: return null
        return try {
            val obj = JSONObject(json)
            if (!obj.has(packageName)) return null
            obj.getJSONObject(packageName).getInt("limitMinutes")
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Retorna os dias ativos para um app específico, ou todos os dias se não configurado.
     */
    fun getAppActiveDays(context: Context, packageName: String): Set<String> {
        val allDays = setOf("SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM")
        val json = prefs(context).getString(KEY_APP_CONFIGS, null) ?: return allDays
        return try {
            val obj = JSONObject(json)
            if (!obj.has(packageName)) return allDays
            val entry = obj.getJSONObject(packageName)
            val arr = entry.getJSONArray("activeDays")
            val days = mutableSetOf<String>()
            for (i in 0 until arr.length()) days.add(arr.getString(i))
            days
        } catch (e: Exception) {
            allDays
        }
    }
}
