# Desconecta

> Aplicativo mobile para bem-estar digital — TCC de Ciência da Computação (UFRJ)

O **Desconecta** é um aplicativo desenvolvido como Trabalho de Conclusão de Curso na UFRJ. A proposta central é ajudar as pessoas a reduzir o uso excessivo do celular de forma colaborativa e gamificada, promovendo uma relação mais saudável com a tecnologia.

## Ideia e Motivação

O uso excessivo de dispositivos móveis é um problema crescente em diversas faixas etárias. O Desconecta surge como uma alternativa lúdica e social para enfrentar esse desafio: em vez de simplesmente bloquear o acesso a apps, o aplicativo cria um ambiente de apoio mútuo onde amigos e grupos se motivam a consumir menos tela juntos.

A ideia central é transformar a redução do tempo de tela em um hábito positivo, reforçado por desafios, estatísticas pessoais, rankings e uma rede de apoio social.

## Funcionalidades

### Monitoramento de Tempo de Tela
- Leitura do tempo de uso real do dispositivo via módulo nativo Android (`UsageStatsManager`)
- Visualização do tempo total de tela do dia e histórico semanal
- Detalhamento por aplicativo e por categoria (redes sociais, entretenimento, utilitários etc.)
- Comparação com a semana anterior e acompanhamento de evolução pessoal

### Grupos de Apoio
- Criação e participação em grupos de amigos
- Entrada em grupos via código de convite único
- Feed social dentro de cada grupo para compartilhar atividades e progresso
- Ranking mensal de pontos entre os membros do grupo
- Bate-papo integrado por grupo
- Gerenciamento de membros com papéis de administrador e membro

### Desafios
- Desafios públicos mensais disponíveis para todos os usuários
- Desafios de grupo específicos para cada comunidade
- Inscrição e acompanhamento de progresso nos desafios ativos
- Premiação com colecionáveis digitais ao concluir desafios

### Modo Foco
- Ativação de um modo restrito que limita o acesso às funcionalidades do app
- No modo foco, apenas o feed dos grupos e estatísticas resumidas ficam disponíveis

### Controles de Uso
- Definição de limite diário de tempo de tela
- Limite de uso por aplicativo individual
- Bloqueio de apps por horário

### Estatísticas e Gamificação
- Streak de dias com meta cumprida
- Prêmios mensais colecionáveis
- Perfil pessoal com histórico de conquistas

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework mobile | React Native + Expo |
| Linguagem | TypeScript |
| Navegação | React Navigation (stack + bottom tabs) |
| Backend/DB | Firebase (Firestore, Auth, Storage) |
| Autenticação | Google Sign-In + Firebase Auth |
| Módulo nativo | Kotlin (Android `UsageStatsManager`) |
| Armazenamento local | react-native-mmkv |
| Animações | react-native-reanimated |
| Build/Deploy | EAS (Expo Application Services) |

## Estrutura do Projeto

```
tcc-desconecta/
├── app/
│   ├── components/       # Componentes reutilizáveis (Button, Card, Text…)
│   ├── screens/          # Telas do aplicativo
│   ├── navigators/       # Configuração de rotas e abas
│   ├── services/         # Integrações (Firebase, tempo de tela, grupos…)
│   ├── context/          # Contextos globais (autenticação)
│   ├── theme/            # Cores, tipografia e estilos
│   ├── i18n/             # Internacionalização
│   └── config/           # Configurações de ambiente (dev/prod)
├── android/              # Projeto Android nativo (módulo de tempo de tela)
├── ios/                  # Projeto iOS nativo
├── functions/            # Firebase Cloud Functions
├── assets/               # Imagens e ícones
└── test/                 # Testes automatizados
```

## Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+
- Yarn ou npm
- Android Studio (para emulador Android) ou Xcode (para iOS)
- Conta no Firebase com projeto configurado

### 1. Instalar dependências

```bash
yarn install
```

### 2. Configurar o Firebase

Adicione os arquivos de configuração do Firebase nas pastas corretas:

- `android/app/google-services.json` — obtido no console do Firebase (Android)
- `ios/tccdesconecta/GoogleService-Info.plist` — obtido no console do Firebase (iOS)

### 3. Iniciar o servidor de desenvolvimento

```bash
yarn start
```

### 4. Rodar no dispositivo ou emulador

**Android:**
```bash
yarn android
```

**iOS:**
```bash
yarn ios
```

> **Atenção:** O módulo de tempo de tela funciona apenas no Android, pois utiliza a API nativa `UsageStatsManager`. No iOS, as estatísticas de uso retornam valores vazios.

> **Nota:** Na primeira execução no Android, o sistema solicitará permissão de acesso ao uso dos aplicativos (`PACKAGE_USAGE_STATS`). Essa permissão é necessária para o monitoramento de tempo de tela funcionar.

### 5. Build para distribuição

Use o EAS para gerar builds para simulador ou dispositivo físico:

```bash
# Android
yarn build:android:sim      # simulador
yarn build:android:device   # dispositivo físico

# iOS
yarn build:ios:sim          # simulador
yarn build:ios:device       # dispositivo físico
```

Consulte o arquivo `eas.json` para ver os perfis de build disponíveis (development, preview, production).

## Testes

```bash
yarn test
```

## Documentação Complementar

- `CONFIGURACAO_NOTIFICACOES.md` — setup de notificações push
- `GOOGLE_SIGNIN_SETUP.md` — configuração do login com Google
- `FIRESTORE_RULES.md` — regras de segurança do Firestore
- `FIREBASE_STORAGE_RULES.md` — regras de segurança do Storage
- `SCREEN_TIME_MODULE.md` — documentação do módulo nativo de tempo de tela
- `RELATORIO_DESENVOLVIMENTO.md` — relatório completo do desenvolvimento

## Autores

Trabalho de Conclusão de Curso — DCC/UFRJ  
Desenvolvido por Ademario Santana e Felipe
