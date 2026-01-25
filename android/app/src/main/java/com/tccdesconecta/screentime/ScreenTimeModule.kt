package com.tccdesconecta.screentime

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import java.util.Calendar

class ScreenTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ScreenTimeModule"
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactApplicationContext.packageName
            )
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestUsageStatsPermission() {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            // Ignore
        }
    }

    @ReactMethod
    fun getScreenTimeToday(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            val calendar = Calendar.getInstance()
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis
            val endTime = System.currentTimeMillis()

            val usageStatsList = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            )

            var totalTime = 0L
            usageStatsList?.forEach { usageStats ->
                totalTime += usageStats.totalTimeInForeground
            }

            // Retorna em minutos
            promise.resolve((totalTime / 1000 / 60).toInt())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getScreenTimeByApp(daysBack: Int, promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            val calendar = Calendar.getInstance()
            calendar.add(Calendar.DAY_OF_YEAR, -daysBack)
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis
            val endTime = System.currentTimeMillis()

            val usageStatsList = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            )

            val appUsageMap = mutableMapOf<String, Long>()
            usageStatsList?.forEach { usageStats ->
                val packageName = usageStats.packageName
                val timeInForeground = usageStats.totalTimeInForeground
                appUsageMap[packageName] = appUsageMap.getOrDefault(packageName, 0) + timeInForeground
            }

            val resultArray = WritableNativeArray()
            appUsageMap.entries.sortedByDescending { it.value }.forEach { entry ->
                val appData = WritableNativeMap()
                appData.putString("packageName", entry.key)
                appData.putInt("timeInMinutes", (entry.value / 1000 / 60).toInt())
                
                // Tenta pegar o nome do app
                try {
                    val pm = reactApplicationContext.packageManager
                    val appInfo = pm.getApplicationInfo(entry.key, 0)
                    val appName = pm.getApplicationLabel(appInfo).toString()
                    appData.putString("appName", appName)
                } catch (e: Exception) {
                    appData.putString("appName", entry.key)
                }
                
                resultArray.pushMap(appData)
            }

            promise.resolve(resultArray)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getWeeklyScreenTime(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            val resultArray = WritableNativeArray()
            
            for (i in 6 downTo 0) {
                val calendar = Calendar.getInstance()
                calendar.add(Calendar.DAY_OF_YEAR, -i)
                calendar.set(Calendar.HOUR_OF_DAY, 0)
                calendar.set(Calendar.MINUTE, 0)
                calendar.set(Calendar.SECOND, 0)
                calendar.set(Calendar.MILLISECOND, 0)
                val startTime = calendar.timeInMillis
                
                calendar.add(Calendar.DAY_OF_YEAR, 1)
                val endTime = calendar.timeInMillis

                val usageStatsList = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY,
                    startTime,
                    endTime
                )

                var totalTime = 0L
                usageStatsList?.forEach { usageStats ->
                    totalTime += usageStats.totalTimeInForeground
                }

                val dayData = WritableNativeMap()
                dayData.putString("date", calendar.time.toString())
                dayData.putInt("timeInMinutes", (totalTime / 1000 / 60).toInt())
                resultArray.pushMap(dayData)
            }

            promise.resolve(resultArray)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
