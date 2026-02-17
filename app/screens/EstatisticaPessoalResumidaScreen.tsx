import React, { useEffect, useState } from "react"
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Image, ImageBackground, TouchableOpacity } from "react-native"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { useAuth } from "@/context/AuthContext"
import StatisticsService, { type StatisticsSummary } from "@/services/statisticsService"

const Logo = require("@assets/images/logo2.png")
const HeaderBackground = require("@assets/images/9ae8f9136d5d3212c5b60df64ba4f3eec8172563.png")

interface EstatisticaPessoalResumidaScreenProps extends AppStackScreenProps<"EstatisticaPessoalResumida"> {}

const screenWidth = Dimensions.get("window").width

export const EstatisticaPessoalResumidaScreen: React.FC<EstatisticaPessoalResumidaScreenProps> = ({ navigation }) => {
  const { theme } = useAppTheme()
  const { userData } = useAuth()
  const [statistics, setStatistics] = useState<StatisticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<7 | 30>(7)

  useEffect(() => {
    loadStatistics()
  }, [period])

  const loadStatistics = async () => {
    if (!userData?.uid) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const stats = await StatisticsService.getUserStatistics(userData.uid, period)
      setStatistics(stats)
    } catch (error) {
      console.error("❌ Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

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
            <Icon icon="view" size={24} color="#322D70" />
            <Text style={styles.pageTitle}>Estatísticas Pessoais</Text>
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

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

          {/* Seletor de período */}
          <View style={styles.periodSelector}>
            <TouchableOpacity 
              style={[styles.periodButton, period === 7 && styles.periodButtonActive]}
              onPress={() => setPeriod(7)}
            >
              <Text style={[styles.periodButtonText, period === 7 && styles.periodButtonTextActive]}>7 dias</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.periodButton, period === 30 && styles.periodButtonActive]}
              onPress={() => setPeriod(30)}
            >
              <Text style={[styles.periodButtonText, period === 30 && styles.periodButtonTextActive]}>30 dias</Text>
            </TouchableOpacity>
          </View>

        {/* Cards de resumo */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tempo Total</Text>
            <Text preset="heading" style={styles.summaryValue}>
              {StatisticsService.formatTime(statistics.totalTimeInMinutes)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Média Diária</Text>
            <Text preset="heading" style={styles.summaryValue}>
              {StatisticsService.formatTime(statistics.averageTimePerDay)}
            </Text>
          </View>
        </View>

        {statistics.mostUsedApp && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>App Mais Usado</Text>
            <Text preset="subheading" style={styles.infoValue}>
              {statistics.mostUsedApp.appName}
            </Text>
            <Text style={styles.infoSubValue}>
              {StatisticsService.formatTime(statistics.mostUsedApp.timeInMinutes)}
            </Text>
          </View>
        )}

        {statistics.mostUsedCategory && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Categoria Mais Usada</Text>
            <Text preset="subheading" style={styles.infoValue}>
              {StatisticsService.translateCategory(statistics.mostUsedCategory)}
            </Text>
            <Text style={styles.infoSubValue}>
              {StatisticsService.formatTime(statistics.categoryTotals[statistics.mostUsedCategory])}
            </Text>
          </View>
        )}

        {/* Gráfico de linha - Tempo de tela diário */}
        <View style={styles.chartCard}>
          <Text preset="subheading" style={styles.chartTitle}>
            Tempo de Tela Diário (minutos)
          </Text>
          <LineChart
            data={{
              labels: dailyLabels,
              datasets: [{ data: dailyData }],
            }}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withDots={true}
            withShadow={false}
            fromZero={true}
          />
        </View>

        {/* Gráfico de barras - Top Apps */}
        {topAppsForChart.length > 0 && (
          <View style={styles.chartCard}>
            <Text preset="subheading" style={styles.chartTitle}>
              Apps Mais Usados (minutos)
            </Text>
            <BarChart
              data={{
                labels: appLabels,
                datasets: [{ data: appData }],
              }}
              width={screenWidth - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.chart}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              fromZero={true}
              showValuesOnTopOfBars={true}
            />
          </View>
        )}

        {/* Gráfico de pizza - Categorias */}
        {categoryData.length > 0 && (
          <View style={styles.chartCard}>
            <Text preset="subheading" style={styles.chartTitle}>
              Distribuição por Categoria
            </Text>
            <PieChart
              data={categoryData}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
          </View>
        )}

        {/* Lista detalhada de apps */}
        <View style={styles.listCard}>
          <Text preset="subheading" style={styles.listTitle}>
            Todos os Apps
          </Text>
          {statistics.topApps.map((app, index) => (
            <View key={`${app.packageName}-${index}`} style={styles.appItem}>
              <View style={styles.appInfo}>
                <Text style={styles.appRank}>{index + 1}</Text>
                <View style={styles.appDetails}>
                  <Text style={styles.appName}>{app.appName}</Text>
                  <Text style={styles.appCategory}>
                    {StatisticsService.translateCategory(app.category)}
                  </Text>
                </View>
              </View>
              <Text style={styles.appTime}>
                {StatisticsService.formatTime(app.timeInMinutes)}
              </Text>
            </View>
          ))}
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
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  periodButtonActive: {
    backgroundColor: "#72C3E0",
    borderColor: "#72C3E0",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  periodButtonTextActive: {
    color: "#FFFFFF",
  },
  summaryCards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
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
    opacity: 0.7,
    marginBottom: 8,
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
})
