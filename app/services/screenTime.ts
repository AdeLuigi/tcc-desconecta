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
  all_apps?: {
    packageName: string;
    appName: string;
    timeInMinutes: number;
    category: string;
  }[];
  timestamp: Date;
}

export interface BackgroundTrackingStatus {
  enabled: boolean;
  lastSyncAt: number;
  lastMinutesToday: number;
}

export interface AppBlockingConfig {
  limitMinutes: number;
  activeDays: string[];
}

export interface AppBlockingStatus {
  accessibilityServiceEnabled: boolean;
  blockingEnabled: boolean;
  blockedAppsCount: number;
  blockedApps: string[];
}

/**
 * Serviço para capturar dados de tempo de tela no Android
 */
class ScreenTimeService {
  private _permissionCache: { value: boolean; ts: number } | null = null;
  private readonly PERMISSION_CACHE_TTL_MS = 30_000; // 30 segundos

  /**
   * Verifica se o app tem permissão para acessar estatísticas de uso.
   * Resultado cacheado por 30s para evitar round-trips nativos repetidos.
   */
  async hasPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    const now = Date.now();
    if (this._permissionCache && (now - this._permissionCache.ts) < this.PERMISSION_CACHE_TTL_MS) {
      return this._permissionCache.value;
    }
    try {
      const value = await ScreenTimeModule.hasUsageStatsPermission();
      this._permissionCache = { value, ts: now };
      return value;
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
      this._permissionCache = null; // Invalida o cache para re-verificar após o usuário conceder
      ScreenTimeModule.requestUsageStatsPermission();
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    }
  }

  /**
   * Define o usuário utilizado pelo sync nativo em background para envio ao Firestore
   */
  async configureBackgroundSyncUser(userId?: string): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      return await ScreenTimeModule.setBackgroundSyncUser(userId || null);
    } catch (error) {
      console.error('Erro ao configurar usuário do sync em background:', error);
      return false;
    }
  }

  /**
   * Ativa monitoramento contínuo em background (Android foreground service)
   */
  async startBackgroundTracking(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      const hasPermission = await this.hasPermission();
      if (!hasPermission) {
        throw new Error('Permissão de estatísticas de uso não concedida');
      }
      return await ScreenTimeModule.startBackgroundTracking();
    } catch (error) {
      console.error('Erro ao iniciar monitoramento em background:', error);
      return false;
    }
  }

  /**
   * Desativa monitoramento contínuo em background
   */
  async stopBackgroundTracking(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      return await ScreenTimeModule.stopBackgroundTracking();
    } catch (error) {
      console.error('Erro ao parar monitoramento em background:', error);
      return false;
    }
  }

  /**
   * Retorna status do monitoramento contínuo no Android
   */
  async getBackgroundTrackingStatus(): Promise<BackgroundTrackingStatus> {
    if (Platform.OS !== 'android') {
      return { enabled: false, lastSyncAt: 0, lastMinutesToday: 0 };
    }
    try {
      return await ScreenTimeModule.getBackgroundTrackingStatus();
    } catch (error) {
      console.error('Erro ao obter status de background tracking:', error);
      return { enabled: false, lastSyncAt: 0, lastMinutesToday: 0 };
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

      // Preparar todos os apps (para filtragem por grupo com screenTimeForApps)
      const allApps = apps.map(app => ({
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
        all_apps: allApps,
        timestamp: new Date(),
      };
      
      // Se já existe, atualiza o documento existente
      if (!existingDocs.empty) {
        const existingDoc = existingDocs.docs[0];
        await updateDoc(doc(db, "estatisticas", existingDoc.id), screenTimeData);
      } else {
        // Se não existe, cria um novo documento
        await addDoc(tempoTelaRef, screenTimeData);
      }
    } catch (error) {
      console.error('Erro ao salvar dados de tempo de tela:', error);
      throw error;
    }
  }

  // =============================================
  // BLOQUEIO DE APPS
  // =============================================

  /**
   * Configura o bloqueio de apps com limites individuais por app.
   * @param appConfigs Mapa de packageName -> { limitMinutes, activeDays }
   * @param enabled Se o bloqueio está ativo
   */
  async configureAppBlocking(
    appConfigs: Record<string, AppBlockingConfig>,
    enabled: boolean,
  ): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      console.log('[screenTime] configureAppBlocking chamado, apps:', Object.keys(appConfigs).length, 'enabled:', enabled);
      const t0 = Date.now();
      const result = await ScreenTimeModule.configureAppBlocking(appConfigs, enabled);
      console.log('[screenTime] configureAppBlocking retornou:', result, 'em', Date.now() - t0, 'ms');
      return result;
    } catch (error) {
      console.error('[screenTime] Erro configureAppBlocking:', error);
      return false;
    }
  }

  /**
   * Verifica se o AccessibilityService está ativo.
   */
  async isAccessibilityServiceEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }
    try {
      console.log('[screenTime] isAccessibilityServiceEnabled chamado');
      const t0 = Date.now();
      const result = await ScreenTimeModule.isAccessibilityServiceEnabled();
      console.log('[screenTime] isAccessibilityServiceEnabled retornou:', result, 'em', Date.now() - t0, 'ms');
      return result;
    } catch (error) {
      console.error('[screenTime] Erro isAccessibilityServiceEnabled:', error);
      return false;
    }
  }

  /**
   * Abre as configurações de acessibilidade para o usuário ativar o serviço.
   */
  requestAccessibilityPermission(): void {
    if (Platform.OS !== 'android') {
      return;
    }
    try {
      ScreenTimeModule.requestAccessibilityPermission();
    } catch (error) {
      console.error('Erro ao solicitar permissão de acessibilidade:', error);
    }
  }

  /**
   * Retorna o status atual do bloqueio de apps.
   */
  async getAppBlockingStatus(): Promise<AppBlockingStatus> {
    if (Platform.OS !== 'android') {
      return {
        accessibilityServiceEnabled: false,
        blockingEnabled: false,
        blockedAppsCount: 0,
        blockedApps: [],
      };
    }
    try {
      return await ScreenTimeModule.getAppBlockingStatus();
    } catch (error) {
      console.error('Erro ao obter status de bloqueio:', error);
      return {
        accessibilityServiceEnabled: false,
        blockingEnabled: false,
        blockedAppsCount: 0,
        blockedApps: [],
      };
    }
  }

  /**
   * Salva dados retroativos dos últimos 7 dias no Firestore
   * Só salva se o documento para aquela data ainda não existir
   * @param userId ID do usuário
   */
  async saveLastSevenDaysData(userId: string): Promise<void> {
    try {
      const savedDays: string[] = [];
      const skippedDays: string[] = [];
      const errorDays: string[] = [];

      // Percorrer os últimos 7 dias (1 = ontem, até 7 dias atrás)
      // Começamos do dia 1 para não duplicar o salvamento de hoje
      for (let daysAgo = 1; daysAgo <= 7; daysAgo++) {
        try {
          // Calcular a data do dia
          const d = new Date();
          d.setDate(d.getDate() - daysAgo);
          const dateKey = d.toISOString().split('T')[0];

          // Verificar no Firestore ANTES de qualquer chamada nativa
          // Dias passados já computados não precisam ser recalculados
          const db = getFirestore();
          const existingDocs = await getDocs(query(
            collection(db, "estatisticas"),
            where("userId", "==", userId),
            where("data", "==", dateKey),
            limit(1)
          ));

          if (!existingDocs.empty) {
            skippedDays.push(dateKey);
            continue;
          }

          // Só acessa o módulo nativo se não houver dado salvo
          const dayData = await this.getScreenTimeForSpecificDay(daysAgo);
          
          if (!dayData || dayData.totalTimeInMinutes === 0) {
            skippedDays.push(dateKey);
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
        } catch (error) {
          console.error(`Erro ao processar dia ${daysAgo}:`, error);
          errorDays.push(`${daysAgo} dias atrás`);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar dados retroativos:', error);
      throw error;
    }
  }
}

export default new ScreenTimeService();
