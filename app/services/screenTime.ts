import { NativeModules, Platform } from 'react-native';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit } from "@react-native-firebase/firestore"
import type { AppCategory } from '@/utils/appCategories';

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
   */
  async saveScreenTimeData(
    userId: string, 
    tempoTotal: number, 
    apps: (AppUsage & { category: AppCategory })[]
  ): Promise<void> {
    try {
      const db = getFirestore();
      const hoje = new Date();
      const dataFormatada = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Verificar se já existe registro para hoje
      const tempoTelaRef = collection(db, "estatisticas");
      const q = query(
        tempoTelaRef, 
        where("userId", "==", userId),
        where("data", "==", dataFormatada),
        limit(1)
      );
      
      const existingDocs = await getDocs(q);
      
      // Se já existe, não salva novamente (evita duplicatas)
      if (!existingDocs.empty) {
        console.log('Dados de tempo de tela já salvos para hoje');
        return;
      }
      
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
      
      // Criar documento
      const screenTimeData: ScreenTimeData = {
        userId,
        data: dataFormatada,
        tempo_total_minutos: tempoTotal,
        categorias,
        top_apps: topApps,
        timestamp: new Date(),
      };
      
      await addDoc(tempoTelaRef, screenTimeData);
      console.log('Dados de tempo de tela salvos com sucesso para', dataFormatada);
    } catch (error) {
      console.error('Erro ao salvar dados de tempo de tela:', error);
      throw error;
    }
  }
}

export default new ScreenTimeService();
