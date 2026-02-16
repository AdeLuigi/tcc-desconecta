import firestore from '@react-native-firebase/firestore'

export interface AppStatistic {
  packageName: string
  appName: string
  timeInMinutes: number
  category: string
}

export interface DayStatistic {
  data: string // YYYY-MM-DD
  tempo_total_minutos: number
  categorias: Record<string, number>
  top_apps: AppStatistic[]
  timestamp: Date
}

export interface StatisticsSummary {
  totalTimeInMinutes: number
  averageTimePerDay: number
  mostUsedApp: AppStatistic | null
  mostUsedCategory: string | null
  dailyStats: DayStatistic[]
  categoryTotals: Record<string, number>
  topApps: AppStatistic[]
}

/**
 * Serviço para buscar e processar estatísticas do Firestore
 */
class StatisticsService {
  /**
   * Busca estatísticas do usuário dos últimos N dias
   * @param userId ID do usuário
   * @param days Número de dias para buscar (padrão: 7)
   */
  async getUserStatistics(userId: string, days: number = 7): Promise<StatisticsSummary> {
    try {
      // Calcular data de início (N dias atrás)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString().split('T')[0]
      
      // Query para buscar estatísticas do usuário
      const querySnapshot = await firestore()
        .collection('estatisticas')
        .where('userId', '==', userId)
        .where('data', '>=', startDateStr)
        .orderBy('data', 'desc')
        .limit(days)
        .get()
      
      const dailyStats: DayStatistic[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        dailyStats.push({
          data: data.data,
          tempo_total_minutos: data.tempo_total_minutos || 0,
          categorias: data.categorias || {},
          top_apps: data.top_apps || [],
          timestamp: data.timestamp?.toDate() || new Date(),
        })
      })
      
      // Calcular estatísticas agregadas
      const summary = this.calculateSummary(dailyStats)
      
      return summary
    } catch (error) {
      console.error("❌ Erro ao buscar estatísticas do usuário:", error)
      throw error
    }
  }

  /**
   * Calcula um resumo das estatísticas agregadas
   */
  private calculateSummary(dailyStats: DayStatistic[]): StatisticsSummary {
    let totalTimeInMinutes = 0
    const categoryTotals: Record<string, number> = {}
    const appTotals: Record<string, AppStatistic> = {}
    
    // Agregar dados de todos os dias
    dailyStats.forEach((day) => {
      totalTimeInMinutes += day.tempo_total_minutos
      
      // Agregar por categoria
      Object.entries(day.categorias).forEach(([category, minutes]) => {
        categoryTotals[category] = (categoryTotals[category] || 0) + minutes
      })
      
      // Agregar apps
      day.top_apps.forEach((app) => {
        if (appTotals[app.packageName]) {
          appTotals[app.packageName].timeInMinutes += app.timeInMinutes
        } else {
          appTotals[app.packageName] = { ...app }
        }
      })
    })
    
    // Calcular média por dia
    const averageTimePerDay = dailyStats.length > 0 
      ? Math.round(totalTimeInMinutes / dailyStats.length)
      : 0
    
    // Encontrar app mais usado
    const topApps = Object.values(appTotals)
      .sort((a, b) => b.timeInMinutes - a.timeInMinutes)
    
    const mostUsedApp = topApps.length > 0 ? topApps[0] : null
    
    // Encontrar categoria mais usada
    const categoryEntries = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
    
    const mostUsedCategory = categoryEntries.length > 0 
      ? categoryEntries[0][0]
      : null
    
    return {
      totalTimeInMinutes,
      averageTimePerDay,
      mostUsedApp,
      mostUsedCategory,
      dailyStats,
      categoryTotals,
      topApps: topApps.slice(0, 10), // Top 10 apps
    }
  }

  /**
   * Formata minutos em formato legível (ex: "2h 30min")
   */
  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) {
      return `${mins}min`
    }
    if (mins === 0) {
      return `${hours}h`
    }
    return `${hours}h ${mins}min`
  }

  /**
   * Formata data para exibição (ex: "20/02")
   */
  formatDate(dateString: string): string {
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}`
  }

  /**
   * Traduz nome de categoria para português
   */
  translateCategory(category: string): string {
    const translations: Record<string, string> = {
      'social': 'Redes Sociais',
      'productivity': 'Produtividade',
      'entertainment': 'Entretenimento',
      'games': 'Jogos',
      'communication': 'Comunicação',
      'photo': 'Foto e Vídeo',
      'music': 'Música',
      'news': 'Notícias',
      'shopping': 'Compras',
      'education': 'Educação',
      'tools': 'Ferramentas',
      'browser': 'Navegador',
      'streaming': 'Streaming',
      'other': 'Outros',
      'others': 'Outros',
    }
    
    return translations[category.toLowerCase()] || category
  }

  /**
   * Retorna cor para uma categoria
   */
  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'social': '#E91E63',
      'productivity': '#2196F3',
      'entertainment': '#FF9800',
      'games': '#9C27B0',
      'communication': '#4CAF50',
      'photo': '#00BCD4',
      'music': '#F44336',
      'news': '#795548',
      'shopping': '#FFC107',
      'education': '#3F51B5',
      'tools': '#607D8B',
      'browser': '#2196F3',
      'streaming': '#E91E63',
      'other': '#9E9E9E',
      'others': '#9E9E9E',
    }
    
    return colors[category.toLowerCase()] || '#9E9E9E'
  }
}

export default new StatisticsService()
