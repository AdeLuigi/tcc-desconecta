// Define o pacote do módulo
package com.tccdesconecta.screentime

// Importações necessárias para verificar permissões e acessar estatísticas de uso
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
import android.util.Log
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream
import java.util.Calendar

// Classe principal do módulo que expõe funcionalidades de tempo de tela para o React Native
class ScreenTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    // Retorna o nome do módulo que será usado no JavaScript
    override fun getName(): String {
        return "ScreenTimeModule"
    }

    // Converte um ícone do tipo Drawable para uma string Base64 para ser usada no React Native
    private fun drawableToBase64(drawable: Drawable): String? {
        try {
            // Verifica se o drawable já é um BitmapDrawable
            val bitmap = if (drawable is BitmapDrawable) {
                // Usa o bitmap diretamente
                drawable.bitmap
            } else {
                // Cria um bitmap vazio com as dimensões do drawable
                val bitmap = Bitmap.createBitmap(
                    drawable.intrinsicWidth,
                    drawable.intrinsicHeight,
                    Bitmap.Config.ARGB_8888
                )
                // Cria um canvas para desenhar o drawable no bitmap
                val canvas = Canvas(bitmap)
                // Define os limites do drawable
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                // Desenha o drawable no canvas
                drawable.draw(canvas)
                bitmap
            }

            // Cria um stream de saída para os bytes da imagem
            val outputStream = ByteArrayOutputStream()
            // Comprime o bitmap em formato PNG com qualidade 100%
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
            // Converte o stream em array de bytes
            val byteArray = outputStream.toByteArray()
            // Codifica os bytes em Base64 sem quebras de linha
            return Base64.encodeToString(byteArray, Base64.NO_WRAP)
        } catch (e: Exception) {
            // Retorna null em caso de erro
            return null
        }
    }

    // Verifica se o app tem permissão para acessar estatísticas de uso
    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            // Obtém o serviço de operações do app
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            // Verifica o modo de permissão para acessar estatísticas de uso
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactApplicationContext.packageName
            )
            // Resolve a promise com true se a permissão foi concedida, false caso contrário
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            // Rejeita a promise em caso de erro
            promise.reject("ERROR", e.message)
        }
    }

    // Abre a tela de configurações para solicitar permissão de estatísticas de uso
    @ReactMethod
    fun requestUsageStatsPermission() {
        try {
            // Cria uma intent para abrir as configurações de acesso de uso
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            // Adiciona a flag para iniciar a atividade em uma nova tarefa
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            // Inicia a atividade
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            // Ignora erros silenciosamente
        }
    }

    // Retorna o tempo total de tela do dia atual em minutos
    @ReactMethod
    fun getScreenTimeToday(promise: Promise) {
        try {
            // Obtém o serviço de estatísticas de uso do Android
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

            // Cria um calendário para calcular o início do dia (meia-noite)
            val calendar = Calendar.getInstance()
            calendar.set(Calendar.HOUR_OF_DAY, 0) // Define hora como 00
            calendar.set(Calendar.MINUTE, 0) // Define minuto como 00
            calendar.set(Calendar.SECOND, 0) // Define segundo como 00
            calendar.set(Calendar.MILLISECOND, 0) // Define milissegundo como 00
            val startTime = calendar.timeInMillis // Obtém o timestamp do início do dia
            val endTime = System.currentTimeMillis() // Obtém o timestamp atual

            // Obtém o gerenciador de pacotes para verificar apps lançáveis
            val packageManager = reactApplicationContext.packageManager
            // Cria um conjunto para armazenar pacotes que são apps lançáveis (não serviços de sistema)
            val launchable = mutableSetOf<String>()

            // Consulta todos os eventos de uso de apps no período
            val events = usageStatsManager.queryEvents(startTime, endTime)
            // Mapa para rastrear quando cada app foi colocado em primeiro plano
            val lastForeground = mutableMapOf<String, Long>()
            // Variável para acumular o tempo total de uso
            var totalTime = 0L

            // Objeto reutilizável para ler cada evento
            val event = UsageEvents.Event()
            // Percorre todos os eventos disponíveis
            while (events.hasNextEvent()) {
                events.getNextEvent(event) // Lê o próximo evento
                val pkg = event.packageName ?: continue // Obtém o nome do pacote, pula se for nulo

                // Verifica se o pacote é um app lançável (não é serviço de sistema)
                if (!launchable.contains(pkg)) {
                    // Se o PackageManager consegue obter uma intent de lançamento, é um app lançável
                    if (packageManager.getLaunchIntentForPackage(pkg) != null) {
                        launchable.add(pkg) // Adiciona ao conjunto de apps lançáveis
                    } else {
                        continue // Pula este pacote se não for lançável
                    }
                }

                // Processa o evento de acordo com seu tipo
                when (event.eventType) {
                    // Quando o app vai para primeiro plano
                    UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                        lastForeground[pkg] = event.timeStamp // Registra o momento em que foi para primeiro plano
                    }
                    // Quando o app vai para segundo plano
                    UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                        val start = lastForeground.remove(pkg) // Remove e obtém o momento do último foreground
                        // Se havia um registro de foreground e o timestamp é válido
                        if (start != null && event.timeStamp >= start) {
                            // Calcula o início da sessão (máximo entre o start e o startTime do dia)
                            val sessionStart = maxOf(start, startTime)
                            // Calcula o fim da sessão (mínimo entre o evento e o endTime)
                            val sessionEnd = minOf(event.timeStamp, endTime)
                            // Se a sessão tem duração válida
                            if (sessionEnd > sessionStart) {
                                // Adiciona a duração da sessão ao tempo total
                                totalTime += (sessionEnd - sessionStart)
                            }
                        }
                    }
                }
            }

            // Processa apps que ainda estão em primeiro plano (sem evento de background)
            lastForeground.forEach { (_, startedAt) ->
                // Calcula o início da sessão
                val sessionStart = maxOf(startedAt, startTime)
                // Usa o momento atual como fim da sessão
                val sessionEnd = endTime
                // Se a sessão tem duração válida
                if (sessionEnd > sessionStart) {
                    // Adiciona a duração ao tempo total
                    totalTime += (sessionEnd - sessionStart)
                }
            }

            // Converte de milissegundos para minutos e resolve a promise
            promise.resolve((totalTime / 1000 / 60).toInt())
        } catch (e: Exception) {
            // Rejeita a promise em caso de erro
            promise.reject("ERROR", e.message)
        }
    }

    // Retorna o tempo de uso separado por app, com detalhes como nome, ícone e categoria
    @ReactMethod
    fun getScreenTimeByApp(daysBack: Int, promise: Promise) {
        try {
            Log.d("ScreenTimeModule", "=== getScreenTimeByApp iniciado ===")
            Log.d("ScreenTimeModule", "Parâmetro daysBack: $daysBack")
            
            // Obtém o serviço de estatísticas de uso do Android
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            // Cria um calendário para calcular o período desejado
            val calendar = Calendar.getInstance()
            // Se daysBack > 0, volta N dias no passado
            if (daysBack > 0) {
                calendar.add(Calendar.DAY_OF_YEAR, -daysBack)
            }
            // Define o início do dia como meia-noite
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis // Timestamp do início do período
            val endTime = System.currentTimeMillis() // Timestamp atual
            
            Log.d("ScreenTimeModule", "Período: de ${java.util.Date(startTime)} até ${java.util.Date(endTime)}")
            Log.d("ScreenTimeModule", "Duração do período em dias: ${(endTime - startTime) / (1000 * 60 * 60 * 24)}")

            // Obtém o gerenciador de pacotes para filtrar apps
            val packageManager = reactApplicationContext.packageManager
            // Conjunto para armazenar apps lançáveis
            val launchable = mutableSetOf<String>()

            // Consulta todos os eventos de uso no período
            val events = usageStatsManager.queryEvents(startTime, endTime)
            Log.d("ScreenTimeModule", "Eventos obtidos: ${if (events != null) "sucesso" else "null"}")
            
            // Mapa para rastrear quando cada app foi para foreground
            val lastForeground = mutableMapOf<String, Long>()
            // Mapa para acumular tempo de uso por app
            val appUsageMap = mutableMapOf<String, Long>()

            // Objeto reutilizável para ler eventos
            val event = UsageEvents.Event()
            var eventCount = 0
            // Percorre todos os eventos
            while (events.hasNextEvent()) {
                events.getNextEvent(event) // Lê o próximo evento
                eventCount++
                val pkg = event.packageName ?: continue // Obtém o pacote, pula se nulo

                // Verifica se o pacote é um app lançável
                if (!launchable.contains(pkg)) {
                    // Tenta obter a intent de lançamento
                    if (packageManager.getLaunchIntentForPackage(pkg) != null) {
                        launchable.add(pkg) // Adiciona à lista de lançáveis
                    } else {
                        continue // Pula pacotes não lançáveis (serviços de sistema)
                    }
                }

                // Processa de acordo com o tipo de evento
                when (event.eventType) {
                    // App foi para primeiro plano
                    UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                        lastForeground[pkg] = event.timeStamp // Registra o timestamp
                    }
                    // App foi para segundo plano
                    UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                        val start = lastForeground.remove(pkg) // Remove e obtém o timestamp de foreground
                        // Se havia um foreground e o timestamp é válido
                        if (start != null && event.timeStamp >= start) {
                            // Calcula o início real da sessão (recorta ao período)
                            val sessionStart = maxOf(start, startTime)
                            // Calcula o fim real da sessão (recorta ao período)
                            val sessionEnd = minOf(event.timeStamp, endTime)
                            // Se a sessão é válida
                            if (sessionEnd > sessionStart) {
                                // Calcula a duração da sessão
                                val sessionTime = sessionEnd - sessionStart
                                // Adiciona ao tempo acumulado do app (soma com o valor existente ou 0)
                                appUsageMap[pkg] = (appUsageMap[pkg] ?: 0L) + sessionTime
                            }
                        }
                    }
                }
            }

            // Processa apps ainda em primeiro plano (sem evento de background)
            lastForeground.forEach { (pkg, startedAt) ->
                // Calcula o início da sessão
                val sessionStart = maxOf(startedAt, startTime)
                // Usa o momento atual como fim
                val sessionEnd = endTime
                // Se a sessão é válida
                if (sessionEnd > sessionStart) {
                    // Calcula a duração
                    val sessionTime = sessionEnd - sessionStart
                    // Adiciona ao tempo acumulado do app
                    appUsageMap[pkg] = (appUsageMap[pkg] ?: 0L) + sessionTime
                }
            }
            
            Log.d("ScreenTimeModule", "Total de eventos processados: $eventCount")
            Log.d("ScreenTimeModule", "Total de apps com uso detectado: ${appUsageMap.size}")
            Log.d("ScreenTimeModule", "Apps lançáveis identificados: ${launchable.size}")
            Log.d("ScreenTimeModule", "=== Lista dos ${launchable.size} apps lançáveis ===")
            launchable.forEachIndexed { index, pkg ->
                val tempoUso = appUsageMap[pkg]?.let { (it / 1000 / 60).toInt() } ?: 0
                Log.d("ScreenTimeModule", "${index + 1}. $pkg (tempo: ${tempoUso}min)")
            }

            // Cria um array para o resultado
            val resultArray = WritableNativeArray()
            // Ordena os apps por tempo de uso (maior primeiro) e percorre
            appUsageMap.entries.sortedByDescending { it.value }.forEach { entry ->
                val timeInMinutes = (entry.value / 1000 / 60).toInt()
                Log.d("ScreenTimeModule", "App: ${entry.key}, Tempo: $timeInMinutes min")
                // Cria um mapa para os dados do app
                val appData = WritableNativeMap()
                // Adiciona o nome do pacote
                appData.putString("packageName", entry.key)
                // Converte o tempo de milissegundos para minutos
                appData.putInt("timeInMinutes", (entry.value / 1000 / 60).toInt())
                
                try {
                    // Obtém o gerenciador de pacotes
                    val pm = reactApplicationContext.packageManager
                    // Obtém informações do app
                    val appInfo = pm.getApplicationInfo(entry.key, 0)
                    // Obtém o nome legível do app
                    val appName = pm.getApplicationLabel(appInfo).toString()
                    appData.putString("appName", appName)
                    
                    // Obtém o ícone do app
                    val icon = pm.getApplicationIcon(entry.key)
                    // Converte o ícone para Base64
                    val iconBase64 = drawableToBase64(icon)
                    // Se a conversão foi bem-sucedida, adiciona ao resultado
                    if (iconBase64 != null) {
                        appData.putString("appIcon", iconBase64)
                    }

                    // Se o Android for Oreo (API 26) ou superior
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        // Obtém o ID da categoria do app
                        val categoryId = appInfo.category
                        // Converte o ID para um nome legível
                        val categoryName = getCategoryName(categoryId)
                        appData.putInt("categoryId", categoryId)
                        appData.putString("category", categoryName)
                    } else {
                        // Para versões antigas, usa valores padrão
                        appData.putInt("categoryId", -1)
                        appData.putString("category", "other")
                    }
                } catch (e: Exception) {
                    // Em caso de erro, usa valores padrão
                    appData.putString("appName", entry.key)
                    appData.putInt("categoryId", -1)
                    appData.putString("category", "other")
                }
                
                // Adiciona os dados do app ao array de resultados
                resultArray.pushMap(appData)
            }
            
            Log.d("ScreenTimeModule", "Total de apps no resultado final: ${resultArray.size()}")
            Log.d("ScreenTimeModule", "=== getScreenTimeByApp finalizado ===")

            // Resolve a promise com o array de apps
            promise.resolve(resultArray)
        } catch (e: Exception) {
            Log.e("ScreenTimeModule", "Erro em getScreenTimeByApp: ${e.message}", e)
            // Rejeita a promise em caso de erro
            promise.reject("ERROR", e.message)
        }
    }

    // Retorna o tempo de tela dos últimos 7 dias (um valor total por dia)
    @ReactMethod
    fun getWeeklyScreenTime(promise: Promise) {
        try {
            // Obtém o serviço de estatísticas de uso
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            // Array para armazenar o resultado de cada dia
            val resultArray = WritableNativeArray()
            
            // Loop de 6 dias atrás até hoje (total de 7 dias)
            for (i in 6 downTo 0) {
                // Cria um calendário para o dia específico
                val calendar = Calendar.getInstance()
                // Volta i dias no passado
                calendar.add(Calendar.DAY_OF_YEAR, -i)
                // Define o início do dia (meia-noite)
                calendar.set(Calendar.HOUR_OF_DAY, 0)
                calendar.set(Calendar.MINUTE, 0)
                calendar.set(Calendar.SECOND, 0)
                calendar.set(Calendar.MILLISECOND, 0)
                val startTime = calendar.timeInMillis // Timestamp do início do dia
                
                // Avança 1 dia para obter o fim do período (início do dia seguinte)
                calendar.add(Calendar.DAY_OF_YEAR, 1)
                val endTime = calendar.timeInMillis // Timestamp do fim do dia

                // Consulta as estatísticas de uso para este dia específico
                val usageStatsList = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY, // Intervalo diário
                    startTime,
                    endTime
                )

                // Mapa para agregar o uso por pacote
                val dailyStats = mutableMapOf<String, Long>()
                // Percorre todas as estatísticas retornadas
                usageStatsList?.forEach { usageStats ->
                    // Obtém o tempo existente do pacote (ou 0 se não existir)
                    val existing = dailyStats[usageStats.packageName] ?: 0L
                    // Soma o tempo em foreground ao tempo existente
                    dailyStats[usageStats.packageName] = existing + usageStats.totalTimeInForeground
                }

                // Variável para acumular o tempo total do dia
                var totalTime = 0L
                // Soma todos os tempos de uso
                dailyStats.values.forEach { time ->
                    totalTime += time
                }

                // Cria um mapa para os dados do dia
                val dayData = WritableNativeMap()
                // Adiciona a data como string
                dayData.putString("date", calendar.time.toString())
                // Converte o tempo de milissegundos para minutos
                dayData.putInt("timeInMinutes", (totalTime / 1000 / 60).toInt())
                // Adiciona ao array de resultados
                resultArray.pushMap(dayData)
            }

            // Resolve a promise com o array de 7 dias
            promise.resolve(resultArray)
        } catch (e: Exception) {
            // Rejeita a promise em caso de erro
            promise.reject("ERROR", e.message)
        }
    }

    // Retorna o tempo de tela de um dia específico com detalhes por app
    @ReactMethod
    fun getScreenTimeForSpecificDay(daysAgo: Int, promise: Promise) {
        try {
            // Obtém o serviço de estatísticas de uso
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            // Cria um calendário para o dia específico
            val calendar = Calendar.getInstance()
            // Volta daysAgo dias no passado
            calendar.add(Calendar.DAY_OF_YEAR, -daysAgo)
            // Define o início do dia (meia-noite)
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startTime = calendar.timeInMillis // Timestamp do início do dia
            
            // Avança 1 dia para obter o fim do período
            calendar.add(Calendar.DAY_OF_YEAR, 1)
            val endTime = calendar.timeInMillis // Timestamp do fim do dia

            // Obtém o gerenciador de pacotes para filtrar apps
            val packageManager = reactApplicationContext.packageManager
            // Conjunto para armazenar apps lançáveis
            val launchable = mutableSetOf<String>()

            // Consulta todos os eventos de uso no dia específico
            val events = usageStatsManager.queryEvents(startTime, endTime)
            // Mapa para rastrear quando cada app foi para foreground
            val lastForeground = mutableMapOf<String, Long>()
            // Mapa para acumular tempo de uso por app
            val appUsageMap = mutableMapOf<String, Long>()

            // Objeto reutilizável para ler eventos
            val event = UsageEvents.Event()
            // Percorre todos os eventos do dia
            while (events.hasNextEvent()) {
                events.getNextEvent(event) // Lê o próximo evento
                val pkg = event.packageName ?: continue // Obtém o pacote, pula se nulo

                // Verifica se o pacote é um app lançável
                if (!launchable.contains(pkg)) {
                    // Tenta obter a intent de lançamento
                    if (packageManager.getLaunchIntentForPackage(pkg) != null) {
                        launchable.add(pkg) // Adiciona à lista de lançáveis
                    } else {
                        continue // Pula pacotes não lançáveis (serviços de sistema)
                    }
                }

                // Processa de acordo com o tipo de evento
                when (event.eventType) {
                    // App foi para primeiro plano
                    UsageEvents.Event.MOVE_TO_FOREGROUND -> {
                        lastForeground[pkg] = event.timeStamp // Registra o timestamp
                    }
                    // App foi para segundo plano
                    UsageEvents.Event.MOVE_TO_BACKGROUND -> {
                        val start = lastForeground.remove(pkg) // Remove e obtém o timestamp de foreground
                        // Se havia um foreground e o timestamp é válido
                        if (start != null && event.timeStamp >= start) {
                            // Calcula o início real da sessão (recorta ao período do dia)
                            val sessionStart = maxOf(start, startTime)
                            // Calcula o fim real da sessão (recorta ao período do dia)
                            val sessionEnd = minOf(event.timeStamp, endTime)
                            // Se a sessão é válida
                            if (sessionEnd > sessionStart) {
                                // Calcula a duração da sessão
                                val sessionTime = sessionEnd - sessionStart
                                // Adiciona ao tempo acumulado do app
                                appUsageMap[pkg] = (appUsageMap[pkg] ?: 0L) + sessionTime
                            }
                        }
                    }
                }
            }

            // Processa apps ainda em primeiro plano (sem evento de background)
            lastForeground.forEach { (pkg, startedAt) ->
                // Calcula o início da sessão
                val sessionStart = maxOf(startedAt, startTime)
                // Usa o fim do dia como fim da sessão
                val sessionEnd = endTime
                // Se a sessão é válida
                if (sessionEnd > sessionStart) {
                    // Calcula a duração
                    val sessionTime = sessionEnd - sessionStart
                    // Adiciona ao tempo acumulado do app
                    appUsageMap[pkg] = (appUsageMap[pkg] ?: 0L) + sessionTime
                }
            }

            // Variável para acumular o tempo total do dia
            var totalTime = 0L
            // Soma todos os tempos de uso dos apps
            appUsageMap.values.forEach { time ->
                totalTime += time
            }

            // Cria um mapa para o resultado principal
            val resultMap = WritableNativeMap()
            // Array para armazenar os dados dos apps
            val appsArray = WritableNativeArray()
            
            // Ordena os apps por tempo de uso (maior primeiro) e percorre
            appUsageMap.entries.sortedByDescending { it.value }.forEach { entry ->
                // Cria um mapa para os dados do app
                val appData = WritableNativeMap()
                // Adiciona o nome do pacote
                appData.putString("packageName", entry.key)
                // Converte o tempo de milissegundos para minutos
                appData.putInt("timeInMinutes", (entry.value / 1000 / 60).toInt())
                
                try {
                    // Obtém o gerenciador de pacotes
                    val pm = reactApplicationContext.packageManager
                    // Obtém informações do app
                    val appInfo = pm.getApplicationInfo(entry.key, 0)
                    // Obtém o nome legível do app
                    val appName = pm.getApplicationLabel(appInfo).toString()
                    appData.putString("appName", appName)
                    
                    // Obtém o ícone do app
                    val icon = pm.getApplicationIcon(entry.key)
                    // Converte o ícone para Base64
                    val iconBase64 = drawableToBase64(icon)
                    // Se a conversão foi bem-sucedida, adiciona ao resultado
                    if (iconBase64 != null) {
                        appData.putString("appIcon", iconBase64)
                    }

                    // Se o Android for Oreo (API 26) ou superior
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        // Obtém o ID da categoria do app
                        val categoryId = appInfo.category
                        // Converte o ID para um nome legível
                        val categoryName = getCategoryName(categoryId)
                        appData.putInt("categoryId", categoryId)
                        appData.putString("category", categoryName)
                    } else {
                        // Para versões antigas, usa valores padrão
                        appData.putInt("categoryId", -1)
                        appData.putString("category", "other")
                    }
                } catch (e: Exception) {
                    // Em caso de erro, usa valores padrão
                    appData.putString("appName", entry.key)
                    appData.putInt("categoryId", -1)
                    appData.putString("category", "other")
                }
                
                // Adiciona os dados do app ao array
                appsArray.pushMap(appData)
            }

            // Cria um novo calendário para formatar a data
            val dayCalendar = Calendar.getInstance()
            // Volta daysAgo dias no passado
            dayCalendar.add(Calendar.DAY_OF_YEAR, -daysAgo)
            // Formata a data no padrão ISO (YYYY-MM-DD)
            val dateString = String.format(
                "%04d-%02d-%02d", // Formato: 4 dígitos ano, 2 dígitos mês, 2 dígitos dia
                dayCalendar.get(Calendar.YEAR), // Ano
                dayCalendar.get(Calendar.MONTH) + 1, // Mês (adiciona 1 pois Calendar.MONTH começa em 0)
                dayCalendar.get(Calendar.DAY_OF_MONTH) // Dia do mês
            )

            // Adiciona a data ao resultado
            resultMap.putString("date", dateString)
            // Adiciona o tempo total do dia em minutos
            resultMap.putInt("totalTimeInMinutes", (totalTime / 1000 / 60).toInt())
            // Adiciona o array de apps
            resultMap.putArray("apps", appsArray)

            // Resolve a promise com o resultado completo
            promise.resolve(resultMap)
        } catch (e: Exception) {
            // Rejeita a promise em caso de erro
            promise.reject("ERROR", e.message)
        }
    }

    // Converte o ID numérico da categoria do app para um nome legível em inglês
    private fun getCategoryName(categoryId: Int): String {
        // Verifica se o Android é Oreo (API 26) ou superior, pois categorias só existem a partir desta versão
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Mapeia cada ID de categoria para um nome legível
            return when (categoryId) {
                ApplicationInfo.CATEGORY_GAME -> "games" // Jogos
                ApplicationInfo.CATEGORY_AUDIO -> "streaming" // Apps de áudio/música
                ApplicationInfo.CATEGORY_VIDEO -> "entertainment" // Apps de vídeo
                ApplicationInfo.CATEGORY_IMAGE -> "photo" // Apps de foto/imagem
                ApplicationInfo.CATEGORY_SOCIAL -> "social" // Redes sociais
                ApplicationInfo.CATEGORY_NEWS -> "news" // Apps de notícias
                ApplicationInfo.CATEGORY_MAPS -> "maps" // Apps de mapas/navegação
                ApplicationInfo.CATEGORY_PRODUCTIVITY -> "productivity" // Produtividade
                else -> "other" // Outras categorias não mapeadas
            }
        }
        // Para versões antigas do Android, retorna sempre "other"
        return "other"
    }
}
