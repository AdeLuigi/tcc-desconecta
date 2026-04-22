import React, { useEffect, useState, useRef } from "react"
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Image, ImageBackground, TouchableOpacity, RefreshControl, AppState } from "react-native"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { useAuth } from "@/context/AuthContext"
import StatisticsService, { type StatisticsSummary, type DayStatistic } from "@/services/statisticsService"
import type { SvgProps } from "react-native-svg"

const FireIcon: React.FC<SvgProps> = require("@assets/images/fire.svg").default
const CheckIcon: React.FC<SvgProps> = require("@assets/images/check.svg").default
const CloseIcon: React.FC<SvgProps> = require("@assets/images/close.svg").default
const EclipseIcon: React.FC<SvgProps> = require("@assets/images/eclipse.svg").default
import ScreenTimeService from "@/services/screenTime"
import { getAppCategory, type AppCategory } from "@/utils/appCategories"

const Logo = require("@assets/images/logo2.png")
const HeaderBackground = require("@assets/images/metas.png")
const RedesSociaisImg = require("@assets/images/redes-sociais.png")
const EntretenimentoImg = require("@assets/images/entreterimento.png")
const ProdutividadeImg = require("@assets/images/produtividade.png")
const FinancasImg = require("@assets/images/financas.png")
const OutrosImg = require("@assets/images/outros.png")

const getCategoryImage = (category: string) => {
  const key = category.toLowerCase()
  if (['social', 'communication'].includes(key)) return RedesSociaisImg
  if (['entertainment', 'streaming', 'games', 'music', 'photo'].includes(key)) return EntretenimentoImg
  if (['productivity', 'education', 'tools', 'browser'].includes(key)) return ProdutividadeImg
  if (['finance', 'shopping', 'maps'].includes(key)) return FinancasImg
  return OutrosImg
}

const getCategoryBgColor = (category: string) => {
  const key = category.toLowerCase()
  if (['social', 'communication'].includes(key)) return '#D2EAFF'
  if (['entertainment', 'streaming', 'games', 'music', 'photo'].includes(key)) return '#F4D9FF'
  if (['productivity', 'education', 'tools', 'browser'].includes(key)) return '#FFECD8'
  if (['finance', 'shopping', 'maps'].includes(key)) return '#DBFEFF'
  return '#D2EAFF'
}

interface EstatisticaPessoalResumidaScreenProps extends AppStackScreenProps<"EstatisticaPessoalResumida"> {}

const screenWidth = Dimensions.get("window").width

// --- Weekly Stacked Bar Chart ---
const STACKED_BAR_HEIGHT = 180
const MAX_CHART_MINUTES = 8 * 60

const CHART_CATEGORY_COLORS: Record<string, string> = {
  social: '#E91E63',
  communication: '#4CAF50',
  entertainment: '#FF9800',
  streaming: '#E91E63',
  games: '#9C27B0',
  music: '#F44336',
  photo: '#00BCD4',
  productivity: '#2196F3',
  education: '#3F51B5',
  tools: '#607D8B',
  browser: '#2196F3',
  finance: '#FFC107',
  shopping: '#FFC107',
  news: '#795548',
  other: '#9E9E9E',
  others: '#9E9E9E',
}

const WEEK_DAY_ABBREVS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const HOUR_LABELS = [14 ,12 ,10 ,8 , 6, 4, 2, 0]

const WeeklyStackedBarChart: React.FC<{ dailyStats: DayStatistic[] }> = ({ dailyStats }) => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const Y_AXIS_WIDTH = 30
  const chartInnerWidth = screenWidth - 32 - Y_AXIS_WIDTH - 16
  const barWidth = Math.floor((chartInnerWidth / 7) * 0.55)

  return (
    <View>
      <View style={{ flexDirection: 'row', height: STACKED_BAR_HEIGHT }}>
        {/* Y-axis labels */}
        <View style={{ width: Y_AXIS_WIDTH, height: STACKED_BAR_HEIGHT, justifyContent: 'space-between' }}>
          {HOUR_LABELS.map(h => (
            <Text key={h} style={{ fontSize: 10, color: '#888', textAlign: 'right', paddingRight: 4, lineHeight: 12, fontWeight:"bold" }}>
              {h > 0 ? `${h}h` : '0'}
            </Text>
          ))}
        </View>

        {/* Chart area */}
        <View style={{ flex: 1, height: STACKED_BAR_HEIGHT, position: 'relative' }}>
          {/* Horizontal grid lines */}
          {HOUR_LABELS.map((h, idx) => (
            <View
              key={`grid-${h}`}
              style={{
                position: 'absolute',
                top: idx * (STACKED_BAR_HEIGHT / (HOUR_LABELS.length - 1)),
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: '#EBEBEB',
              }}
            />
          ))}

          {/* Bars */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {weekDays.map((dateStr, i) => {
              const stat = dailyStats.find(d => d.data === dateStr)
              const isToday = dateStr === todayStr
              const isFuture = dateStr > todayStr
              const totalMinutes = stat?.tempo_total_minutos || 0
              const cats = stat?.categorias || {}

              const clampedMinutes = Math.min(totalMinutes, MAX_CHART_MINUTES)
              const barH = clampedMinutes > 0 ? (clampedMinutes / MAX_CHART_MINUTES) * STACKED_BAR_HEIGHT : 0

              // Sort ascending so the largest segment renders last (visually at the bottom)
              const segments = Object.entries(cats)
                .filter(([, m]) => (m as number) > 0)
                .sort(([, a], [, b]) => (a as number) - (b as number))

              return (
                <View key={dateStr} style={{ width: barWidth, height: STACKED_BAR_HEIGHT, justifyContent: 'flex-end' }}>
                  {!isFuture && barH > 0 && (
                    <View
                      style={{
                        width: barWidth,
                        height: barH,
                        borderRadius: 3,
                        overflow: 'hidden',
                        opacity: isToday ? 0.55 : 1,
                      }}
                    >
                      {segments.map(([cat, mins]) => (
                        <View
                          key={cat}
                          style={{
                            width: '100%',
                            height: Math.max(1, Math.round(((mins as number) / totalMinutes) * barH)),
                            backgroundColor: CHART_CATEGORY_COLORS[cat] ?? '#9E9E9E',
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        </View>
      </View>

      {/* X-axis day labels */}
      <View style={{ flexDirection: 'row', marginLeft: Y_AXIS_WIDTH, marginTop: 4 }}>
        {weekDays.map((dateStr, i) => (
          <View key={dateStr} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 10,
                color: dateStr === todayStr ? '#322D70' : '#888',
                fontWeight: dateStr === todayStr ? '700' : '400',
              }}
            >
              {WEEK_DAY_ABBREVS[i]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export const EstatisticaPessoalResumidaScreen: React.FC<EstatisticaPessoalResumidaScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()
  const { userData } = useAuth()
  const [statistics, setStatistics] = useState<StatisticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<1 | 7>(7)
  const [refreshing, setRefreshing] = useState(false)
  const [previousDayMinutes, setPreviousDayMinutes] = useState<number | null>(null)
  const [streakDailyStats, setStreakDailyStats] = useState<DayStatistic[]>([])
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    loadStatistics()
  }, [period])

  // Recarregar dados quando o app voltar do background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App voltou para foreground, recarregar estatísticas
        loadStatistics()
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [userData, period])

  const loadStatistics = async () => {
    if (!userData?.uid) {
      setLoading(false)
      return
    }

    const t0 = Date.now()
    console.log(`[Stats] loadStatistics iniciado (period=${period})`)

    try {
      setLoading(true)

      if (period === 1) {
        try {
          const tNative = Date.now()
          const apps = await ScreenTimeService.getScreenTimeByApp(0)
          console.log(`[Stats] getScreenTimeByApp(0): ${Date.now() - tNative}ms → ${apps.length} apps`)
          const todayTime = apps.reduce((sum, app) => sum + app.timeInMinutes, 0)
          console.log(`[Stats] Tempo total hoje: ${todayTime}min`)

          const appsWithCategory = apps.map(app => ({
            ...app,
            category: getAppCategory(app.packageName, app.category) as string,
          }))

          if (todayTime > 0) {
            const tSave = Date.now()
            ScreenTimeService.saveScreenTimeData(
              userData.uid,
              todayTime,
              appsWithCategory as any
            )
              .then(() => console.log(`[Stats] saveScreenTimeData (bg): ${Date.now() - tSave}ms`))
              .catch((err) => console.error('[Stats] Erro ao salvar tempo de tela:', err))
          }

          // Calcular categorias a partir dos apps nativos
          const categoryTotals: Record<string, number> = {}
          appsWithCategory.forEach(app => {
            const cat = app.category || 'other'
            categoryTotals[cat] = (categoryTotals[cat] || 0) + app.timeInMinutes
          })

          const topApps = appsWithCategory
            .sort((a, b) => b.timeInMinutes - a.timeInMinutes)
            .slice(0, 10)
            .map(app => ({
              packageName: app.packageName,
              appName: app.appName,
              timeInMinutes: app.timeInMinutes,
              category: app.category || 'other',
              appIcon: app.appIcon,
            }))

          const todayDateStr = new Date().toISOString().split('T')[0]

          const todayStats: StatisticsSummary = {
            totalTimeInMinutes: todayTime,
            averageTimePerDay: todayTime,
            mostUsedApp: topApps.length > 0 ? topApps[0] : null,
            mostUsedCategory: Object.entries(categoryTotals).sort(([,a],[,b]) => b - a)[0]?.[0] || null,
            dailyStats: [{
              data: todayDateStr,
              tempo_total_minutos: todayTime,
              categorias: categoryTotals,
              top_apps: topApps,
              timestamp: new Date(),
            }],
            categoryTotals,
            topApps,
          }
          setStatistics(todayStats)

          try {
            const tFirestore = Date.now()
            const historicalStats = await StatisticsService.getUserStatistics(userData.uid, 7)
            console.log(`[Stats] getUserStatistics(7) para streak/comparação: ${Date.now() - tFirestore}ms → ${historicalStats.dailyStats.length} dias`)
            setStreakDailyStats(historicalStats.dailyStats)
            const yesterdayData = historicalStats.dailyStats.find(d => d.data !== todayDateStr)
            setPreviousDayMinutes(yesterdayData?.tempo_total_minutos ?? null)
          } catch {
            setPreviousDayMinutes(null)
          }
        } catch (nativeError) {
          console.warn('Fallback para Firestore (dados nativos indisponíveis):', nativeError)
          // Fallback: usar Firestore se dados nativos não estiverem disponíveis
          const stats = await StatisticsService.getUserStatistics(userData.uid, period)
          setStatistics(stats)
        }
      } else {
        let nativeIconMap: Record<string, string> = {}
        try {
          const tNative = Date.now()
          const apps = await ScreenTimeService.getScreenTimeByApp(0)
          console.log(`[Stats] getScreenTimeByApp(0) [semanal]: ${Date.now() - tNative}ms → ${apps.length} apps`)
          const todayTime = apps.reduce((sum, app) => sum + app.timeInMinutes, 0)
          apps.forEach(app => {
            if (app.appIcon) nativeIconMap[app.packageName] = app.appIcon
          })
          if (todayTime > 0 && userData?.uid) {
            const appsWithCategory = apps.map(app => ({
              ...app,
              category: getAppCategory(app.packageName, app.category) as string,
            }))
            const tSave = Date.now()
            ScreenTimeService.saveScreenTimeData(
              userData.uid,
              todayTime,
              appsWithCategory as any
            )
              .then(() => console.log(`[Stats] saveScreenTimeData [semanal]: ${Date.now() - tSave}ms`))
              .catch(() => {})
          }
        } catch {
          // Ignorar erros na sincronização nativa
        }

        const tFirestore = Date.now()
        const stats = await StatisticsService.getUserStatistics(userData.uid, period)
        console.log(`[Stats] getUserStatistics(${period}): ${Date.now() - tFirestore}ms → ${stats.dailyStats.length} dias`)
        // Reaproveitamos os dados semanais para o card de streak
        setStreakDailyStats(stats.dailyStats)
        // Enriquecer topApps com ícones nativos (não salvos no Firestore)
        if (Object.keys(nativeIconMap).length > 0) {
          stats.topApps = stats.topApps.map(app => ({
            ...app,
            appIcon: app.appIcon ?? nativeIconMap[app.packageName],
          }))
          if (stats.mostUsedApp && !stats.mostUsedApp.appIcon) {
            stats.mostUsedApp = {
              ...stats.mostUsedApp,
              appIcon: nativeIconMap[stats.mostUsedApp.packageName],
            }
          }
        }
        setStatistics(stats)
      }
    } catch (error) {
      console.error("❌ Erro ao carregar estatísticas:", error)
    } finally {
      console.log(`[Stats] loadStatistics total: ${Date.now() - t0}ms`)
      setLoading(false)
    }
  }

  const formatSelectedDate = () => {
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const now = new Date()
    return `${dias[now.getDay()]} ${now.getDate()}/${now.getMonth() + 1}`
  }

  const getComparison = () => {
    if (previousDayMinutes === null) return { percentage: 0, text: 'sem dados de ontem', color: '#666' }
    if (previousDayMinutes === 0) return { percentage: 100, text: 'mais que ontem', color: '#F44336' }
    const todayMinutes = statistics?.totalTimeInMinutes || 0
    const diff = todayMinutes - previousDayMinutes
    const percentage = Math.abs(Math.round((diff / previousDayMinutes) * 100))
    if (diff < 0) return { percentage, text: 'menos que ontem', color: '#4CAF50' }
    if (diff > 0) return { percentage, text: 'mais que ontem', color: '#F44336' }
    return { percentage: 0, text: 'igual a ontem', color: '#666' }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadStatistics()
    setRefreshing(false)
  }

  // --- Streak helpers ---
  const isStreakFeatureEnabled = Boolean(
    userData?.configuracoes?.limite_tela_ativo
  )

  const getCurrentWeekDays = (): string[] => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0=Dom, 1=Seg, ..., 6=Sab
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - daysFromMonday)
    const days: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }

  const getDayInitial = (dateStr: string): string => {
    const initials = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
    const date = new Date(dateStr + 'T12:00:00')
    return initials[date.getDay()]
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const getDayStatus = (dateStr: string): 'check' | 'close' | 'eclipse' => {
    if (dateStr >= todayStr) return 'eclipse' // hoje ou dias futuros
    const stat = streakDailyStats.find(d => d.data === dateStr)
    if (!stat) return 'eclipse'
    const limitMinutes = userData?.configuracoes?.limite_tela_minutos ?? 60
    return stat.tempo_total_minutos < limitMinutes ? 'check' : 'close'
  }

  const calculateStreakDays = (): number => {
    const limitMinutes = userData?.configuracoes?.limite_tela_minutos ?? 60
    let count = 0
    const today = new Date()
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const stat = streakDailyStats.find(s => s.data === dateStr)
      if (!stat || stat.tempo_total_minutos >= limitMinutes) break
      count++
    }
    return count
  }

  const formatLimitTime = (minutes: number): string => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return m > 0 ? `${h}h${m}min` : `${h}h`
    }
    return `${minutes}min`
  }
  // --- Fim streak helpers ---

  const chartConfig = {
    backgroundColor: "#FFFFFF",
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(114, 195, 224, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(50, 45, 112, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#72C3E0",
    },
  }

  if (loading) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
        <ImageBackground 
          source={HeaderBackground}
          style={styles.headerBanner}
          resizeMode="cover"
        >
          <View style={styles.header}>
            <Image source={Logo} resizeMode="contain" />
            <TouchableOpacity onPress={() => navigation.navigate("Notificacoes")}>
              <Icon icon="notifications" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerBannerOverlay} />
        </ImageBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#72C3E0" />
          <Text style={styles.loadingText}>Carregando estatísticas...</Text>
        </View>
      </Screen>
    )
  }

  if (!statistics || statistics.dailyStats.length === 0) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
        <ImageBackground 
          source={HeaderBackground}
          style={styles.headerBanner}
          resizeMode="cover"
        >
          <View style={styles.header}>
            <Image source={Logo} resizeMode="contain" />
            <TouchableOpacity onPress={() => navigation.navigate("Notificacoes")}>
              <Icon icon="notifications" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerBannerOverlay} />
        </ImageBackground>
        <View style={styles.mainContent}>
          <View style={styles.titleCard}>
            <Icon icon="win" size={24} color="#322D70" />
            <Text style={styles.pageTitle}>Estatísticas Pessoais</Text>
          </View>

          {/* Seletor de período */}
          <View style={styles.periodSelector}>
            <TouchableOpacity 
              style={[styles.periodButton, period === 1 && styles.periodButtonActive]}
              onPress={() => setPeriod(1)}
            >
              <Text style={[styles.periodButtonText, period === 1 && styles.periodButtonTextActive]}>Hoje</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.periodButton, period === 7 && styles.periodButtonActive]}
              onPress={() => setPeriod(7)}
            >
              <Text style={[styles.periodButtonText, period === 7 && styles.periodButtonTextActive]}>Semanal</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Ainda não há dados de uso registrados. Use o aplicativo por alguns dias para ver suas estatísticas.
            </Text>
          </View>
        </View>
      </Screen>
    )
  }

  // Preparar dados para os gráficos
  const dailyLabels = [...statistics.dailyStats].reverse().map(day => 
    StatisticsService.formatDate(day.data)
  )
  const dailyData = [...statistics.dailyStats].reverse().map(day => day.tempo_total_minutos)

  // Preparar dados para gráfico de pizza (categorias)
  const categoryData = Object.entries(statistics.categoryTotals)
    .filter(([, minutes]) => minutes > 0)
    .map(([category, minutes]) => ({
      name: StatisticsService.translateCategory(category),
      population: minutes,
      color: StatisticsService.getCategoryColor(category),
      legendFontColor: "#322D70",
      legendFontSize: 12,
    }))

  // Preparar dados para gráfico de barras (top apps)
  const topAppsForChart = statistics.topApps.slice(0, 5)
  const appLabels = topAppsForChart.map(app => 
    app.appName.length > 10 ? app.appName.substring(0, 10) + '...' : app.appName
  )
  const appData = topAppsForChart.map(app => app.timeInMinutes)

  const comparison = period === 1 ? getComparison() : null

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#322D70"]}
            tintColor="#322D70"
          />
        }
      >
        <ImageBackground 
          source={HeaderBackground}
          style={styles.headerBanner}
          resizeMode="cover"
        >
          <View style={styles.header}>
            <Image source={Logo} resizeMode="contain" />
            <TouchableOpacity onPress={() => navigation.navigate("Notificacoes")}>
              <Icon icon="notifications" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerBannerOverlay} />
        </ImageBackground>
        

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Title Card */}
          <View style={styles.titleCard}>
            <Icon icon="view" size={24} color="#322D70" />
            <Text style={styles.pageTitle}>Estatísticas Pessoais</Text>
          </View>

                    {/* Card de Streak */}
          {isStreakFeatureEnabled && (
            <View style={styles.streakCard}>
              <View style={styles.streakHeader}>
                <FireIcon width={30} height={30} />
                <View>
                  <Text style={styles.streakLabel}>Seu streak</Text>
                  <Text style={styles.streakCount}>{calculateStreakDays()} dias</Text>
                </View>
                <View style={styles.streakDays}>
                  {getCurrentWeekDays().map(dateStr => {
                    const status = getDayStatus(dateStr)
                    return (
                      <View key={dateStr} style={styles.streakDayItem}>
                         <Text style={styles.streakDayLabel}>{getDayInitial(dateStr)}</Text>
                        {status === 'check' && <CheckIcon width={20} height={20} />}
                        {status === 'close' && <CloseIcon width={20} height={20} />}
                        {status === 'eclipse' && <EclipseIcon width={20} height={20} />}
                       
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>
          )}
          {isStreakFeatureEnabled && <Text style={styles.streakDescription}>
          Você está a {calculateStreakDays()} dias com tempo de tela diário inferior a{" "}
          {formatLimitTime(userData?.configuracoes?.limite_tela_minutos ?? 60)}
        </Text>}

          {/* Seletor de período */}
          <Text style={styles.sectionTitle}>Detalhes do uso</Text>   
          <View style={styles.periodSelector}>
            <TouchableOpacity 
              style={[styles.periodButton, period === 1 && styles.periodButtonActive]}
              onPress={() => setPeriod(1)}
            >
              <Text style={[styles.periodButtonText, period === 1 && styles.periodButtonTextActive]}>Hoje</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.periodButton, period === 7 && styles.periodButtonActive]}
              onPress={() => setPeriod(7)}
            >
              <Text style={[styles.periodButtonText, period === 7 && styles.periodButtonTextActive]}>Semanal</Text>
            </TouchableOpacity>
          </View>   
            <View style={styles.dateNavigator}>
              <TouchableOpacity>
                <Icon icon="caretLeft" size={20} color="#322D70" />
              </TouchableOpacity>
              <Text style={styles.dateText}>{formatSelectedDate()}</Text>
              <TouchableOpacity>
                <Icon icon="caretRight" size={20} color="#322D70" />
              </TouchableOpacity>
            </View>
          

          {/* Tempo de tela do dia */}
          <Text style={styles.sectionTitle}>Dados de hoje</Text>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Text preset="heading" style={styles.summaryValueCyan}>
                {StatisticsService.formatTime(statistics.totalTimeInMinutes)}
              </Text>
              <Text style={styles.summaryLabel}>de tempo de tela</Text>
            </View>
            {period === 1 && comparison ? (
              <View style={styles.summaryCard}>
                <Text preset="heading" style={[styles.summaryValueCyan, { color: comparison.color }]}>
                  {comparison.percentage}%
                </Text>
                <Text style={styles.summaryLabel}>{comparison.text}</Text>
              </View>
            ) : period === 7 ? (
              <View style={styles.summaryCard}>
                <Text preset="heading" style={styles.summaryValueCyan}>
                  {StatisticsService.formatTime(statistics.averageTimePerDay)}
                </Text>
                <Text style={styles.summaryLabel}>Média Diária</Text>
              </View>
            ) : null}
          </View>

          {/* Gráfico de StackedBar - Tempo semanal */}
          {period === 7 && (
            <View style={styles.chartCard}>
              <Text preset="subheading" style={styles.chartTitle}>Uso por categoria na semana</Text>
              <WeeklyStackedBarChart dailyStats={statistics.dailyStats} />
            </View>
          )}

          {/* Categorias mais usadas */}
          <Text style={styles.sectionTitle}>Categorias mais usadas {period === 1 ? 'hoje' : 'na semana'}</Text>
          <View style={styles.categoriesCard}>
            {Object.entries(statistics.categoryTotals).length > 0 ? (
              Object.entries(statistics.categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([category, minutes]) => (
                  <View key={category} style={[styles.categoryRow, { backgroundColor: getCategoryBgColor(category) }]}>
                    <Image source={getCategoryImage(category)} style={styles.categoryIcon} />
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{StatisticsService.translateCategory(category)}</Text>
                      <Text style={styles.categoryTime}>{StatisticsService.formatTime(minutes)}</Text>
                    </View>
                  </View>
                ))
            ) : (
              <Text style={styles.emptySection}>Dados detalhados por categoria ainda não disponíveis.</Text>
            )}
          </View>

          {/* Apps mais usados */}
          <Text style={styles.sectionTitle}>Apps mais usados {period === 1 ? 'hoje' : 'na semana'}</Text>
          <View style={styles.appsCard}>
            {statistics.topApps.length > 0 ? (
              statistics.topApps.map((app, index) => (
                <View key={`${app.packageName}-${index}`} style={styles.appRow}>
                  {app.appIcon ? (
                    <Image source={{ uri: app.appIcon.startsWith('data:') ? app.appIcon : `data:image/png;base64,${app.appIcon}` }} style={styles.appIconSmall} />
                  ) : (
                    <Image source={getCategoryImage(app.category)} style={styles.appIconSmall} />
                  )}
                  <View style={styles.appRowInfo}>
                    <Text style={styles.appRowName}>{app.appName}</Text>
                    <Text style={styles.appRowCategory}>{StatisticsService.translateCategory(app.category)}</Text>
                  </View>
                  <Text style={styles.appRowTime}>{StatisticsService.formatTime(app.timeInMinutes)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptySection}>Dados detalhados por app ainda não disponíveis.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scrollContent: {
    flex: 1,
  },
  headerBanner: {
    width: "100%",
    height: 200,
  },
  headerBannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(50, 45, 112, 0.2)",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -14,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  titleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    color: "#322D70",
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#322D70",
    lineHeight: 24,
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#C3CDE3",
    padding: 5,
    borderTopEndRadius: 8,
    borderTopStartRadius: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#72C3E0",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#666",
  },
  periodButtonTextActive: {
    
  },
  summaryCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    marginTop: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "700",
    color: "#322D70",
  },
  summaryValue: {
    fontSize: 24,
    color: "#72C3E0",
    fontWeight: "bold",
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
    color: "#322D70",
  },
  infoValue: {
    fontSize: 20,
    marginBottom: 4,
    color: "#322D70",
    fontWeight: "bold",
  },
  infoSubValue: {
    fontSize: 16,
    opacity: 0.8,
    color: "#72C3E0",
    fontWeight: "600",
  },
  chartCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: "center",
    color: "#322D70",
    fontWeight: "bold",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  listCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: "#322D70",
    fontWeight: "bold",
  },
  appItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  appInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appRank: {
    fontSize: 16,
    fontWeight: "bold",
    width: 30,
    color: "#72C3E0",
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
    color: "#322D70",
  },
  appCategory: {
    fontSize: 12,
    opacity: 0.6,
    color: "#666",
  },
  appTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#72C3E0",
  },
  dateNavigator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#322D70",
    marginBottom: 12,
  },
  summaryValueCyan: {
    fontSize: 24,
    color: "#72C3E0",
    fontWeight: "bold",
  },
  categoriesCard: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#322D70",
  },
  categoryTime: {
    fontSize: 13,
    color: "#72C3E0",
    fontWeight: "600",
  },
  appsCard: {
    marginBottom: 16,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  appRowInfo: {
    flex: 1,
  },
  appRowName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#322D70",
  },
  appRowCategory: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6881BA",
  },
  appRowTime: {
    fontSize: 15,
    fontWeight: "700",
    color: "#322D70",
  },
  emptySection: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 16,
  },
  streakCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    paddingVertical: 4,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  streakLabel: {
    fontSize: 16,
    color: "#322D70",
    fontWeight: "bold",
  },
  streakCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#322D70",
  },
  streakDays: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  streakDayItem: {
    alignItems: "center",
    gap: 4,
  },
  streakDayLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#322D70",
  },
  streakDescription: {
    fontSize: 12,
    color: "#322D70",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 16,
  },
})
