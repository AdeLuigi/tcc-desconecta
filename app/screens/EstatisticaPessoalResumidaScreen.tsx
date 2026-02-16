import React, { useEffect, useState } from "react"
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from "react-native"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { useAuth } from "@/context/AuthContext"
import StatisticsService, { type StatisticsSummary } from "@/services/statisticsService"

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
      console.log('❌ Nenhum userData.uid disponível')
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
    backgroundColor: theme.colors.background,
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: theme.colors.tint,
    },
  }

  if (loading) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.tint} />
        <Text style={styles.loadingText}>Carregando estatísticas...</Text>
      </Screen>
    )
  }

  if (!statistics || statistics.dailyStats.length === 0) {
    return (
      <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={styles.container}>
        <View style={styles.emptyContent}>
          <Text preset="heading" style={styles.title}>
            Estatísticas Pessoais
          </Text>
          <Text style={styles.emptyText}>
            Ainda não há dados de uso registrados. Use o aplicativo por alguns dias para ver suas estatísticas.
          </Text>
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
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    }))

  // Preparar dados para gráfico de barras (top apps)
  const topAppsForChart = statistics.topApps.slice(0, 5)
  const appLabels = topAppsForChart.map(app => 
    app.appName.length > 10 ? app.appName.substring(0, 10) + '...' : app.appName
  )
  const appData = topAppsForChart.map(app => app.timeInMinutes)

  return (
    <Screen preset="scroll" safeAreaEdges={["top", "bottom"]}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text preset="heading" style={styles.title}>
            Estatísticas Pessoais
          </Text>
          
          {/* Seletor de período */}
          <View style={styles.periodSelector}>
            <Button
              text="7 dias"
              onPress={() => setPeriod(7)}
              preset={period === 7 ? "default" : "filled"}
              style={styles.periodButton}
            />
            <Button
              text="30 dias"
              onPress={() => setPeriod(30)}
              preset={period === 30 ? "default" : "filled"}
              style={styles.periodButton}
            />
          </View>
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

        {/* Botão voltar */}
        <View style={styles.buttonContainer}>
          <Button
            text="Voltar"
            onPress={() => navigation.navigate("AppModoFoco")}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyContent: {
    width: "100%",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  periodButton: {
    flex: 1,
    maxWidth: 120,
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
    backgroundColor: "#fff",
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
    color: "#333",
  },
  summaryValue: {
    fontSize: 24,
    color: "#000",
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
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
    color: "#333",
  },
  infoValue: {
    fontSize: 20,
    marginBottom: 4,
    color: "#000",
  },
  infoSubValue: {
    fontSize: 16,
    opacity: 0.8,
    color: "#333",
  },
  chartCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
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
    color: "#000",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  listCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
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
    color: "#000",
  },
  appItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
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
    opacity: 0.5,
    color: "#333",
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
    color: "#000",
  },
  appCategory: {
    fontSize: 12,
    opacity: 0.6,
    color: "#666",
  },
  appTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    width: "100%",
  },
})
