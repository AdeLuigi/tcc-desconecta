# Módulo de Tempo de Tela (Screen Time)

## Funcionalidades Implementadas

Este módulo permite capturar estatísticas de uso do dispositivo Android, incluindo:

- ✅ Tempo total de tela do dia atual
- ✅ Tempo de tela por aplicativo (últimos 7 dias)
- ✅ Tempo de tela dos últimos 7 dias (histórico diário)
- ✅ Solicitação e verificação de permissões

## Arquivos Criados/Modificados

### Android (Nativo)
1. **ScreenTimeModule.kt** - Módulo nativo que acessa a API UsageStatsManager do Android
   - Localização: `android/app/src/main/java/com/tccdesconecta/screentime/ScreenTimeModule.kt`

2. **ScreenTimePackage.kt** - Package que registra o módulo no React Native
   - Localização: `android/app/src/main/java/com/tccdesconecta/screentime/ScreenTimePackage.kt`

3. **AndroidManifest.xml** - Adicionada permissão PACKAGE_USAGE_STATS

4. **MainApplication.kt** - Registrado o ScreenTimePackage

### React Native/TypeScript
1. **screenTime.ts** - Serviço TypeScript que encapsula as chamadas ao módulo nativo
   - Localização: `app/services/screenTime.ts`

2. **ScreenTimeExampleScreen.tsx** - Tela de exemplo mostrando como usar o serviço
   - Localização: `app/screens/ScreenTimeExampleScreen.tsx`

## Como Usar

### 1. Verificar e Solicitar Permissões

```typescript
import ScreenTimeService from '../services/screenTime';

// Verificar se tem permissão
const hasPermission = await ScreenTimeService.hasPermission();

// Solicitar permissão (abre as configurações do sistema)
if (!hasPermission) {
  ScreenTimeService.requestPermission();
}
```

### 2. Obter Tempo de Tela de Hoje

```typescript
const todayMinutes = await ScreenTimeService.getScreenTimeToday();
console.log(`Tempo de tela hoje: ${ScreenTimeService.formatTime(todayMinutes)}`);
```

### 3. Obter Tempo de Tela por Aplicativo

```typescript
const apps = await ScreenTimeService.getScreenTimeByApp(7); // últimos 7 dias
apps.forEach(app => {
  console.log(`${app.appName}: ${ScreenTimeService.formatTime(app.timeInMinutes)}`);
});
```

### 4. Obter Histórico Semanal

```typescript
const weeklyData = await ScreenTimeService.getWeeklyScreenTime();
weeklyData.forEach(day => {
  console.log(`${day.date}: ${ScreenTimeService.formatTime(day.timeInMinutes)}`);
});
```

## API do Serviço

### `ScreenTimeService.hasPermission(): Promise<boolean>`
Verifica se o app tem permissão para acessar estatísticas de uso.

### `ScreenTimeService.requestPermission(): void`
Abre as configurações do sistema para o usuário conceder a permissão.

### `ScreenTimeService.getScreenTimeToday(): Promise<number>`
Retorna o tempo total de tela de hoje em minutos.

### `ScreenTimeService.getScreenTimeByApp(daysBack: number): Promise<AppUsage[]>`
Retorna uma lista de aplicativos e seus tempos de uso.

**Parâmetros:**
- `daysBack` (opcional, padrão: 1): Número de dias para consultar

**Retorna:**
```typescript
interface AppUsage {
  packageName: string;
  appName: string;
  timeInMinutes: number;
}
```

### `ScreenTimeService.getWeeklyScreenTime(): Promise<DailyScreenTime[]>`
Retorna o tempo de tela dos últimos 7 dias.

**Retorna:**
```typescript
interface DailyScreenTime {
  date: string;
  timeInMinutes: number;
}
```

### `ScreenTimeService.formatTime(minutes: number): string`
Formata minutos em formato legível (ex: "2h 30min").

## Integração no Navegador

Para adicionar a tela de exemplo ao seu navegador:

```typescript
import { ScreenTimeExampleScreen } from "./screens/ScreenTimeExampleScreen"

// No seu stack navigator:
<Stack.Screen 
  name="ScreenTimeExample" 
  component={ScreenTimeExampleScreen}
  options={{ title: "Tempo de Tela" }}
/>
```

## Observações Importantes

1. **Apenas Android**: Este módulo funciona apenas no Android. No iOS, retorna valores vazios/zero.

2. **Permissão Especial**: A permissão `PACKAGE_USAGE_STATS` é uma permissão especial que o usuário deve conceder manualmente nas configurações do sistema. O app não pode solicitá-la via dialog comum.

3. **Dados Históricos**: As estatísticas de uso são limitadas pelo sistema Android. Geralmente, dados de até 7-30 dias estão disponíveis.

4. **Performance**: Consultar estatísticas de uso pode ser uma operação custosa. Use com moderação e considere cache se necessário.

## Próximos Passos Sugeridos

1. Integrar o serviço nas telas de estatísticas existentes (EstatisticasPessoaisScreen.tsx)
2. Adicionar persistência local para histórico mais longo
3. Criar gráficos visuais para exibir os dados
4. Implementar notificações baseadas no tempo de uso
5. Adicionar metas de tempo de tela

## Build e Teste

Após as modificações, faça o rebuild do app Android:

```bash
cd android
./gradlew clean
cd ..
npm run android
```

Ou use o EAS Build:

```bash
npm run build:android:device
```
