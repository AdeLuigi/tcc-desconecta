package com.tccdesconecta.screentime

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Base64
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
import java.util.Calendar

class ScreenTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ScreenTimeModule"
    }

    private fun drawableToBase64(drawable: Drawable): String? {
        try {
            val bitmap = if (drawable is BitmapDrawable) {
                drawable.bitmap
            } else {
                val bitmap = Bitmap.createBitmap(
                    drawable.intrinsicWidth,
                    drawable.intrinsicHeight,
                    Bitmap.Config.ARGB_8888
                )
                val canvas = Canvas(bitmap)
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                drawable.draw(canvas)
                bitmap
            }

            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            val byteArray = outputStream.toByteArray()
            return Base64.encodeToString(byteArray, Base64.NO_WRAP)
        } catch (e: Exception) {
            return null
        }
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

            // Em vez de usar buckets agregados (queryUsageStats), percorre eventos e recorta cada sessão ao intervalo do dia
            val packageManager = reactApplicationContext.packageManager
            val launchable = mutableSetOf<String>()

            val events = usageStatsManager.queryEvents(startTime, endTime)
            val lastForeground = mutableMapOf<String, Long>()
            var totalTime = 0L

            val event = UsageEvents.Event()
            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                val pkg = event.packageName ?: continue

                // Filtra apenas apps lançáveis (evita serviços de sistema)
                if (!launchable.contains(pkg)) {
                    if (packageManager.getLaunchIntentForPackage(pkg) != null) {
                        launchable.add(pkg)
                    } else {
                        continue
                    }
                }

                when (event.eventType) {
                    UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                        lastForeground[pkg] = event.timeStamp
                    }
                    UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                        val start = lastForeground.remove(pkg)
                        if (start != null && event.timeStamp >= start) {
                            val sessionStart = maxOf(start, startTime)
                            val sessionEnd = minOf(event.timeStamp, endTime)
                            if (sessionEnd > sessionStart) {
                                totalTime += (sessionEnd - sessionStart)
                            }
                        }
                    }
                }
            }

            // Se algum app está em primeiro plano sem evento de background, fecha a sessão até endTime
            lastForeground.forEach { (_, startedAt) ->
                val sessionStart = maxOf(startedAt, startTime)
                val sessionEnd = endTime
                if (sessionEnd > sessionStart) {
                    totalTime += (sessionEnd - sessionStart)
                }
            }

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
            if (daysBack > 0) {
                calendar.add(Calendar.DAY_OF_YEAR, -daysBack)
            }
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
                val existing = appUsageMap[packageName] ?: 0L
                appUsageMap[packageName] = existing + usageStats.totalTimeInForeground
            }

            val resultArray = WritableNativeArray()
            appUsageMap.entries.sortedByDescending { it.value }.forEach { entry ->
                val appData = WritableNativeMap()
                appData.putString("packageName", entry.key)
                appData.putInt("timeInMinutes", (entry.value / 1000 / 60).toInt())
                
                try {
                    val pm = reactApplicationContext.packageManager
                    val appInfo = pm.getApplicationInfo(entry.key, 0)
                    val appName = pm.getApplicationLabel(appInfo).toString()
                    appData.putString("appName", appName)
                    
                    val icon = pm.getApplicationIcon(entry.key)
                    val iconBase64 = drawableToBase64(icon)
                    if (iconBase64 != null) {
                        appData.putString("appIcon", iconBase64)
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        val categoryId = appInfo.category
                        val categoryName = getCategoryName(categoryId)
                        appData.putInt("categoryId", categoryId)
                        appData.putString("category", categoryName)
                    } else {
                        appData.putInt("categoryId", -1)
                        appData.putString("category", "other")
                    }
                } catch (e: Exception) {
                    appData.putString("appName", entry.key)
                    appData.putInt("categoryId", -1)
                    appData.putString("category", "other")
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

                val dailyStats = mutableMapOf<String, Long>()
                usageStatsList?.forEach { usageStats ->
                    val existing = dailyStats[usageStats.packageName] ?: 0L
                    dailyStats[usageStats.packageName] = existing + usageStats.totalTimeInForeground
                }

                var totalTime = 0L
                dailyStats.values.forEach { time ->
                    totalTime += time
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

    @ReactMethod
    fun getScreenTimeForSpecificDay(daysAgo: Int, promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            // Define o início do dia específico
            val calendar = Calendar.getInstance()
            calendar.add(Calendar.DAY_OF_YEAR, -daysAgo)
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis
            
            // Define o fim do dia específico
            calendar.add(Calendar.DAY_OF_YEAR, 1)
            val endTime = calendar.timeInMillis

            val usageStatsList = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            )

            // Agregar uso por app
            val appUsageMap = mutableMapOf<String, Long>()
            usageStatsList?.forEach { usageStats ->
                val packageName = usageStats.packageName
                val existing = appUsageMap[packageName] ?: 0L
                appUsageMap[packageName] = existing + usageStats.totalTimeInForeground
            }

            // Calcular tempo total
            var totalTime = 0L
            appUsageMap.values.forEach { time ->
                totalTime += time
            }

            // Preparar resultado
            val resultMap = WritableNativeMap()
            val appsArray = WritableNativeArray()
            
            appUsageMap.entries.sortedByDescending { it.value }.forEach { entry ->
                val appData = WritableNativeMap()
                appData.putString("packageName", entry.key)
                appData.putInt("timeInMinutes", (entry.value / 1000 / 60).toInt())
                
                try {
                    val pm = reactApplicationContext.packageManager
                    val appInfo = pm.getApplicationInfo(entry.key, 0)
                    val appName = pm.getApplicationLabel(appInfo).toString()
                    appData.putString("appName", appName)
                    
                    val icon = pm.getApplicationIcon(entry.key)
                    val iconBase64 = drawableToBase64(icon)
                    if (iconBase64 != null) {
                        appData.putString("appIcon", iconBase64)
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        val categoryId = appInfo.category
                        val categoryName = getCategoryName(categoryId)
                        appData.putInt("categoryId", categoryId)
                        appData.putString("category", categoryName)
                    } else {
                        appData.putInt("categoryId", -1)
                        appData.putString("category", "other")
                    }
                } catch (e: Exception) {
                    appData.putString("appName", entry.key)
                    appData.putInt("categoryId", -1)
                    appData.putString("category", "other")
                }
                
                appsArray.pushMap(appData)
            }

            // Data do dia no formato ISO
            val dayCalendar = Calendar.getInstance()
            dayCalendar.add(Calendar.DAY_OF_YEAR, -daysAgo)
            val dateString = String.format(
                "%04d-%02d-%02d",
                dayCalendar.get(Calendar.YEAR),
                dayCalendar.get(Calendar.MONTH) + 1,
                dayCalendar.get(Calendar.DAY_OF_MONTH)
            )

            resultMap.putString("date", dateString)
            resultMap.putInt("totalTimeInMinutes", (totalTime / 1000 / 60).toInt())
            resultMap.putArray("apps", appsArray)

            promise.resolve(resultMap)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun getCategoryName(categoryId: Int): String {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return when (categoryId) {
                ApplicationInfo.CATEGORY_GAME -> "games"
                ApplicationInfo.CATEGORY_AUDIO -> "streaming"
                ApplicationInfo.CATEGORY_VIDEO -> "entertainment"
                ApplicationInfo.CATEGORY_IMAGE -> "photo"
                ApplicationInfo.CATEGORY_SOCIAL -> "social"
                ApplicationInfo.CATEGORY_NEWS -> "news"
                ApplicationInfo.CATEGORY_MAPS -> "maps"
                ApplicationInfo.CATEGORY_PRODUCTIVITY -> "productivity"
                else -> "other"
            }
        }
        return "other"
    }
}
