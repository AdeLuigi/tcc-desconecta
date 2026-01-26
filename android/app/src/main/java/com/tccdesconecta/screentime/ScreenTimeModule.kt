package com.tccdesconecta.screentime

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
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

            // Usa queryAndAggregateUsageStats para evitar duplicação
            val usageStatsMap = usageStatsManager.queryAndAggregateUsageStats(
                startTime,
                endTime
            )

            var totalTime = 0L
            usageStatsMap?.values?.forEach { usageStats ->
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
            // Se daysBack = 0, pega de hoje. Se = 1, pega desde ontem, etc.
            if (daysBack > 0) {
                calendar.add(Calendar.DAY_OF_YEAR, -daysBack)
            }
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis
            val endTime = System.currentTimeMillis()

            // Usa queryAndAggregateUsageStats para dados já agregados
            val usageStatsMap = usageStatsManager.queryAndAggregateUsageStats(
                startTime,
                endTime
            )

            val appUsageMap = mutableMapOf<String, Long>()
            usageStatsMap?.values?.forEach { usageStats ->
                val packageName = usageStats.packageName
                val timeInForeground = usageStats.totalTimeInForeground
                appUsageMap[packageName] = timeInForeground
            }

            val resultArray = WritableNativeArray()
            appUsageMap.entries.sortedByDescending { it.value }.forEach { entry ->
                val appData = WritableNativeMap()
                appData.putString("packageName", entry.key)
                appData.putInt("timeInMinutes", (entry.value / 1000 / 60).toInt())
                
                // Tenta pegar o nome e ícone do app
                try {
                    val pm = reactApplicationContext.packageManager
                    val appInfo = pm.getApplicationInfo(entry.key, 0)
                    val appName = pm.getApplicationLabel(appInfo).toString()
                    appData.putString("appName", appName)
                    
                    // Pega o ícone do app e converte para base64
                    val icon = pm.getApplicationIcon(entry.key)
                    val iconBase64 = drawableToBase64(icon)
                    if (iconBase64 != null) {
                        appData.putString("appIcon", iconBase64)
                    }
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
