import { NativeModules, Platform } from 'react-native';
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, getDocs, orderBy, limit } from "@react-native-firebase/firestore"
import { getAppCategory, type AppCategory } from '@/utils/appCategories';

const { ScreenTimeModule } = NativeModules;

export interface AppUsage {
  packageName: string;
  appName: string;
  timeInMinutes: number;
  appIcon?: string; // Base64 string do ícone
  categoryId?: number; // ID nativo do Android (API 26+)
  category?: string; // Nome amigável da categoria
}

export interface DailyScreenTime {
  date: string;
  timeInMinutes: number;
}

export interface SpecificDayScreenTime {
  date: string; // formato: YYYY-MM-DD
  totalTimeInMinutes: number;
  apps: AppUsage[];
}

export interface ScreenTimeData {
  userId: string;
  data: string; // formato: YYYY-MM-DD
  tempo_total_minutos: number;
  categorias: Record<string, number>; // categoria -> minutos
  top_apps: {
    packageName: string;
    appName: string;
    timeInMinutes: number;
    category: string;
  }[];
  timestamp: Date;
}

/**
 * Serviço para capturar dados de tempo de tela no Android
 */
class ScreenTimeService {
  /**
   * Verifica se o app tem permissão para acessar estatísticas de uso
   */
  async hasPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      return await ScreenTimeModule.hasUsageStatsPermission();
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Abre as configurações do sistema para solicitar permissão de estatísticas de uso
   */
  requestPermission(): void {
    if (Platform.OS !== 'android') {
      return;
    }
    try {
      ScreenTimeModule.requestUsageStatsPermission();
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    }
  }

  /**
   * Retorna o tempo total de tela de hoje em minutos
   */
  async getScreenTimeToday(): Promise<number> {
    if (Platform.OS !== 'android') {
      return 0;
    }
    try {
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        throw new Error('Permissão de estatísticas de uso não concedida');
      }
      return await ScreenTimeModule.getScreenTimeToday();
    } catch (error) {
      console.error('Erro ao obter tempo de tela de hoje:', error);
      return 0;
    }
  }

  /**
   * Retorna uma lista de apps e seu tempo de uso nos últimos N dias
   * @param daysBack Número de dias para trás (padrão: 1)
   */
  async getScreenTimeByApp(daysBack: number = 1): Promise<AppUsage[]> {
    if (Platform.OS !== 'android') {
      return [];
    }
    try {
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        throw new Error('Permissão de estatísticas de uso não concedida');
      }
      return await ScreenTimeModule.getScreenTimeByApp(daysBack);
    } catch (error) {
      console.error('Erro ao obter tempo de tela por app:', error);
      return [];
    }
  }

  /**
   * Retorna o tempo de tela dos últimos 7 dias
   */
  async getWeeklyScreenTime(): Promise<DailyScreenTime[]> {
    if (Platform.OS !== 'android') {
      return [];
    }
    try {
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        throw new Error('Permissão de estatísticas de uso não concedida');
      }
      return await ScreenTimeModule.getWeeklyScreenTime();
    } catch (error) {
      console.error('Erro ao obter tempo de tela semanal:', error);
      return [];
    }
  }

  /**
   * Retorna o tempo de tela e apps de um dia específico
   * @param daysAgo Número de dias atrás (0 = hoje, 1 = ontem, etc)
   */
  async getScreenTimeForSpecificDay(daysAgo: number): Promise<SpecificDayScreenTime | null> {
    if (Platform.OS !== 'android') {
      return null;
    }
    try {
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        throw new Error('Permissão de estatísticas de uso não concedida');
      }
      return await ScreenTimeModule.getScreenTimeForSpecificDay(daysAgo);
    } catch (error) {
      console.error(`Erro ao obter tempo de tela do dia ${daysAgo}:`, error);
      return null;
    }
  }

  /**
   * Formata minutos em formato legível (ex: "2h 30min")
   */
  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}min`;
    }
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}min`;
  }

  /**
   * Salva os dados de tempo de tela no Firestore
   * @param userId ID do usuário
   * @param tempoTotal Tempo total em minutos
   * @param apps Lista de apps com categorias
   * @param dataEspecifica Data específica no formato YYYY-MM-DD (opcional, padrão: hoje)
   */
  async saveScreenTimeData(
    userId: string, 
    tempoTotal: number, 
    apps: (AppUsage & { category: AppCategory })[],
    dataEspecifica?: string
  ): Promise<void> {
    try {
      const db = getFirestore();
      const dataFormatada = dataEspecifica || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Verificar se já existe registro para essa data
      const tempoTelaRef = collection(db, "estatisticas");
      const q = query(
        tempoTelaRef, 
        where("userId", "==", userId),
        where("data", "==", dataFormatada),
        limit(1)
      );
      
      const existingDocs = await getDocs(q);
      
      // Calcular tempo por categoria
      const categorias: Record<string, number> = {};
      apps.forEach(app => {
        const categoria = app.category || 'outros';
        if (categorias[categoria]) {
          categorias[categoria] += app.timeInMinutes;
        } else {
          categorias[categoria] = app.timeInMinutes;
        }
      });
      
      // Preparar top 5 apps
      const topApps = apps.slice(0, 5).map(app => ({
        packageName: app.packageName,
        appName: app.appName,
        timeInMinutes: app.timeInMinutes,
        category: app.category || 'outros',
      }));
      
      // Criar dados de tempo de tela
      const screenTimeData: Omit<ScreenTimeData, 'timestamp'> & { timestamp: Date } = {
        userId,
        data: dataFormatada,
        tempo_total_minutos: tempoTotal,
        categorias,
        top_apps: topApps,
        timestamp: new Date(),
      };
      
      // Se já existe, atualiza o documento existente
      if (!existingDocs.empty) {
        const existingDoc = existingDocs.docs[0];
        await updateDoc(doc(db, "estatisticas", existingDoc.id), screenTimeData);
        console.log('Dados de tempo de tela atualizados com sucesso para', dataFormatada);
      } else {
        // Se não existe, cria um novo documento
        await addDoc(tempoTelaRef, screenTimeData);
        console.log('Dados de tempo de tela salvos com sucesso para', dataFormatada);
      }
    } catch (error) {
      console.error('Erro ao salvar dados de tempo de tela:', error);
      throw error;
    }
  }

  /**
   * Salva dados retroativos dos últimos 7 dias no Firestore
   * Só salva se o documento para aquela data ainda não existir
   * @param userId ID do usuário
   */
  async saveLastSevenDaysData(userId: string): Promise<void> {
    try {
      console.log('Iniciando salvamento de dados retroativos dos últimos 7 dias...');
      
      const savedDays: string[] = [];
      const skippedDays: string[] = [];
      const errorDays: string[] = [];

      // Percorrer os últimos 7 dias (0 = hoje, 1 = ontem, etc)
      for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
        try {
          // Buscar dados do dia específico
          const dayData = await this.getScreenTimeForSpecificDay(daysAgo);
          
          if (!dayData || dayData.totalTimeInMinutes === 0) {
            console.log(`Dia ${dayData?.date || daysAgo}: Sem dados de tempo de tela`);
            skippedDays.push(dayData?.date || `${daysAgo} dias atrás`);
            continue;
          }

          // Verificar se já existe registro para essa data
          const db = getFirestore();
          const tempoTelaRef = collection(db, "estatisticas");
          const q = query(
            tempoTelaRef,
            where("userId", "==", userId),
            where("data", "==", dayData.date),
            limit(1)
          );
          
          const existingDocs = await getDocs(q);
          
          if (!existingDocs.empty) {
            console.log(`Dia ${dayData.date}: Já existe registro, pulando...`);
            skippedDays.push(dayData.date);
            continue;
          }

          // Adicionar categoria aos apps
          const appsWithCategory = dayData.apps.map(app => ({
            ...app,
            category: getAppCategory(app.packageName, app.category),
          }));

          // Salvar dados do dia
          await this.saveScreenTimeData(
            userId,
            dayData.totalTimeInMinutes,
            appsWithCategory,
            dayData.date
          );

          savedDays.push(dayData.date);
          console.log(`Dia ${dayData.date}: Salvos ${dayData.totalTimeInMinutes} minutos com ${dayData.apps.length} apps`);
        } catch (error) {
          console.error(`Erro ao processar dia ${daysAgo}:`, error);
          errorDays.push(`${daysAgo} dias atrás`);
        }
      }

      console.log('=== Resumo do salvamento retroativo ===');
      console.log(`Dias salvos: ${savedDays.length} - ${savedDays.join(', ')}`);
      console.log(`Dias pulados (já existiam ou sem dados): ${skippedDays.length}`);
      console.log(`Dias com erro: ${errorDays.length}`);
      console.log('========================================');
    } catch (error) {
      console.error('Erro ao salvar dados retroativos:', error);
      throw error;
    }
  }
}

export default new ScreenTimeService();
