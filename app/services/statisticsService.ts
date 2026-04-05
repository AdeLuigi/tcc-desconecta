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

  /**
   * Deleta todas as estatísticas de um usuário (sem limite de data)
   * @param userId ID do usuário
   * @returns Promise<number> número de estatísticas deletadas, ou -1 em caso de erro
   */
  async deleteAllUserStatistics(userId: string): Promise<number> {
    try {
      const BATCH_SIZE = 500 // Limite do Firestore por batch
      let totalDeleted = 0
      
      // Loop para deletar em batches até não haver mais documentos
      while (true) {
        // Query para buscar estatísticas do usuário (limitado a BATCH_SIZE)
        const querySnapshot = await firestore()
          .collection('estatisticas')
          .where('userId', '==', userId)
          .limit(BATCH_SIZE)
          .get()
        
        // Se não houver mais documentos, termina o loop
        if (querySnapshot.empty) {
          break
        }

        // Criar batch para deletar os documentos encontrados
        const batch = firestore().batch()
        
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref)
        })
        
        // Executar o batch
        await batch.commit()
        
        totalDeleted += querySnapshot.size
        
        // Se deletou menos que BATCH_SIZE, significa que acabou
        if (querySnapshot.size < BATCH_SIZE) {
          break
        }
      }
      
      return totalDeleted
    } catch (error) {
      console.error("❌ Erro ao deletar estatísticas do usuário:", error)
      return -1
    }
  }

  /**
   * Calcula a média de tempo de uso de todos os membros de um grupo por dia
   * @param groupId ID do grupo
   * @param days Array de datas no formato YYYY-MM-DD
   * @returns Promise com objeto contendo média, usuários com dados e total de usuários por dia
   */
  async getGroupAverageByDays(
    groupId: string, 
    days: string[]
  ): Promise<Record<string, { average: number, usersWithData: number, totalUsers: number }>> {
    try {
      console.log('\n🔍 Iniciando busca de média do grupo...')
      console.log(`   GroupId: ${groupId}`)
      console.log(`   Dias solicitados: ${days.join(', ')}`)
      
      // Buscar membros do grupo
      const groupDoc = await firestore()
        .collection('grupos')
        .doc(groupId)
        .get()
      
      if (!groupDoc.exists) {
        console.log('❌ Grupo não encontrado!')
        throw new Error('Grupo não encontrado')
      }

      const groupData = groupDoc.data()
      console.log(`\n✅ Grupo encontrado:`, groupData?.nome || 'Sem nome')
      
      const membros = groupData?.membros || []
      const userIds = membros.map((m: any) => m.userId)
      
      console.log(`👥 Total de membros no grupo: ${userIds.length}`)
      console.log(`   UserIds:`, userIds)
      
      // DEBUG: Buscar alguns exemplos de estatísticas do primeiro usuário para ver formato
      if (userIds.length > 0) {
        console.log(`\n🔍 Verificando estatísticas disponíveis do primeiro usuário...`)
        const sampleStats = await firestore()
          .collection('estatisticas')
          .where('userId', '==', userIds[0])
          .orderBy('data', 'desc')
          .limit(5)
          .get()
        
        if (!sampleStats.empty) {
          console.log(`   ✅ Encontradas ${sampleStats.size} estatísticas. Exemplos de datas:`)
          sampleStats.forEach((doc) => {
            const data = doc.data()
            console.log(`      - data: "${data.data}" | tempo: ${data.tempo_total_minutos} min`)
          })
        } else {
          console.log(`   ⚠️ Nenhuma estatística encontrada para o usuário ${userIds[0].substring(0, 8)}...`)
        }
      }
      
      const result: Record<string, { average: number, usersWithData: number, totalUsers: number }> = {}

      // Para cada dia, calcular a média

      for (const day of days) {
        console.log(`\n📅 Processando dia: ${day}`)
        let totalTime = 0
        let usersWithData = 0
        const userTimes: Record<string, number> = {}

        // Para cada membro, buscar estatísticas do dia
        for (const userId of userIds) {
          let querySnapshot = await firestore()
            .collection('estatisticas')
            .where('userId', '==', userId)
            .where('data', '==', day)
            .get()

          let tempoMinutos = 0
          let dataFound = false

          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data()
            tempoMinutos = data.tempo_total_minutos || 0
            dataFound = true
          }

          // Se o tempo for menor que 15 minutos, buscar o dia anterior
          if (dataFound && tempoMinutos < 15) {
            // Calcular o dia anterior
            const [ano, mes, diaNum] = day.split('-').map(Number)
            const dataObj = new Date(ano, mes - 1, diaNum)
            dataObj.setDate(dataObj.getDate() - 1)
            const prevDay = dataObj.toISOString().split('T')[0]

            const prevQuery = await firestore()
              .collection('estatisticas')
              .where('userId', '==', userId)
              .where('data', '==', prevDay)
              .get()
            if (!prevQuery.empty) {
              const prevData = prevQuery.docs[0].data()
              const prevTempo = prevData.tempo_total_minutos || 0
              if (prevTempo >= 15) {
                tempoMinutos = prevTempo
                console.log(`   ↩️  User ${userId.substring(0, 8)}...: substituído por dia anterior (${prevDay}): ${prevTempo} min`)
              } else {
                console.log(`   ↩️  User ${userId.substring(0, 8)}...: dia anterior (${prevDay}) também < 15 min (${prevTempo} min)`)
              }
            } else {
              console.log(`   ↩️  User ${userId.substring(0, 8)}...: sem dados no dia anterior (${prevDay})`)
            }
          }

          if (dataFound) {
            totalTime += tempoMinutos
            usersWithData++
            userTimes[userId.substring(0, 8)] = tempoMinutos
            console.log(`   ✓ User ${userId.substring(0, 8)}...: ${tempoMinutos} min`)
          } else {
            console.log(`   ✗ User ${userId.substring(0, 8)}...: sem dados`)
          }
        }

        const average = usersWithData > 0 ? Math.round(totalTime / usersWithData) : 0

        result[day] = {
          average,
          usersWithData,
          totalUsers: userIds.length,
        }

        console.log(`   📊 Resumo do dia ${day}:`)
        console.log(`      Total acumulado: ${totalTime} min`)
        console.log(`      Usuários com dados: ${usersWithData}/${userIds.length}`)
        console.log(`      Média: ${average} min`)
      }

      console.log('\n📊 ===== RESULTADO FINAL =====')
      Object.entries(result).forEach(([day, stats]) => {
        console.log(`  ${day}: ${stats.average} min (${stats.usersWithData}/${stats.totalUsers} usuários)`)
      })
      console.log('==============================\n')

      return result
    } catch (error) {
      console.error("❌ Erro ao calcular média do grupo:", error)
      throw error
    }
  }
}

export default new StatisticsService()
