import { NativeModules, Platform } from 'react-native';

const { ScreenTimeModule } = NativeModules;

export interface AppUsage {
  packageName: string;
  appName: string;
  timeInMinutes: number;
  appIcon?: string; // Base64 string do ícone
}

export interface DailyScreenTime {
  date: string;
  timeInMinutes: number;
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
}

export default new ScreenTimeService();
