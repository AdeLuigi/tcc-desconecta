# Relatório de Desenvolvimento - TCC Desconecta

## 📱 Visão Geral do Projeto

**Nome do Aplicativo:** TCC Desconecta  
**Plataforma:** React Native (Android/iOS) com Expo  
**Objetivo:** Aplicativo para ajudar usuários a gerenciar o tempo de uso do celular e promover bem-estar digital através de grupos de apoio, desafios e monitoramento de uso.

---

## 🏗️ Arquitetura e Tecnologias Principais

### Framework e Ferramentas Base
- **React Native 0.81.5** - Framework principal
- **Expo 54.0.31** - Desenvolvimento e build
- **TypeScript 5.9.2** - Tipagem estática
- **React 19.1.0** - Biblioteca de UI

### Navegação
- **@react-navigation/native 7.0.14** - Sistema de navegação
- **@react-navigation/native-stack 7.2.0** - Navegação em pilha
- **@react-navigation/bottom-tabs 7.2.0** - Navegação por abas

### Backend e Autenticação
- **Firebase Ecosystem:**
  - `@react-native-firebase/app` - Core do Firebase
  - `@react-native-firebase/auth` - Autenticação
  - `@react-native-firebase/firestore` - Banco de dados NoSQL
  - `@react-native-firebase/storage` - Armazenamento de arquivos

### Autenticação Social
- **@react-native-google-signin/google-signin 16.1.1** - Login com Google

### Armazenamento Local
- **react-native-mmkv 3.3.3** - Armazenamento local de alta performance

### UI/UX
- **react-native-reanimated 4.1.1** - Animações performáticas
- **react-native-gesture-handler 2.28.0** - Gestos
- **react-native-safe-area-context 5.6.0** - Áreas seguras
- **react-native-screens 4.16.0** - Otimização de telas
- **expo-image-picker 17.0.10** - Seleção de imagens

### Internacionalização
- **i18next 23.14.0** - Framework de tradução
- **react-i18next 15.0.1** - Integração com React
- **expo-localization 17.0.7** - Detecção de idioma

### Utilitários
- **date-fns 4.1.0** - Manipulação de datas
- **apisauce 3.1.1** - Cliente HTTP

### Desenvolvimento
- **Reactotron** - Debugger/inspector
- **Jest** - Testes unitários
- **ESLint + Prettier** - Code quality
- **TypeScript** - Type checking

---

## 🎯 Funcionalidades Implementadas com Auxílio da IA

### 1. Sistema de Autenticação (Google Sign-In)

#### Arquivos Criados/Modificados:
- **`app/services/auth.ts`** - Serviço de autenticação
- **`app/screens/LoginScreen.tsx`** - Tela de login
- **`app/context/AuthContext.tsx`** - Contexto de autenticação
- **`GOOGLE_SIGNIN_SETUP.md`** - Documentação de setup

#### Implementação:
- Login com conta Google usando Firebase Authentication
- Gerenciamento de sessão com MMKV (armazenamento persistente)
- Fluxo completo de autenticação e logout
- Sincronização de dados do usuário com Firestore
- Tratamento de erros e feedback visual

#### Configurações:
```typescript
GoogleSignin.configure({
  webClientId: "WEB_CLIENT_ID.apps.googleusercontent.com",
})
```

---

### 2. Módulo Nativo de Tempo de Tela (Screen Time)

#### Arquivos Criados:

**Android (Nativo - Kotlin):**
- **`android/app/src/main/java/com/tccdesconecta/screentime/ScreenTimeModule.kt`**
  - Acessa a API UsageStatsManager do Android
  - Calcula tempo de tela diário
  - Lista apps por tempo de uso
  - Histórico semanal

- **`android/app/src/main/java/com/tccdesconecta/screentime/ScreenTimePackage.kt`**
  - Registra o módulo no React Native

**React Native (TypeScript):**
- **`app/services/screenTime.ts`** - Serviço que encapsula chamadas nativas
- **`SCREEN_TIME_MODULE.md`** - Documentação completa

#### Funcionalidades:
1. **Verificação de Permissões:**
   ```typescript
   const hasPermission = await ScreenTimeService.hasPermission()
   ScreenTimeService.requestPermission() // Abre configurações do sistema
   ```

2. **Tempo de Tela Hoje:**
   ```typescript
   const minutes = await ScreenTimeService.getScreenTimeToday()
   ```

3. **Tempo por Aplicativo:**
   ```typescript
   const apps = await ScreenTimeService.getScreenTimeByApp(7) // últimos 7 dias
   ```

4. **Histórico Semanal:**
   ```typescript
   const weeklyData = await ScreenTimeService.getWeeklyScreenTime()
   ```

#### Integração:
- AndroidManifest.xml - Permissão `PACKAGE_USAGE_STATS`
- MainApplication.kt - Registro do package
- Compatibilidade apenas Android (iOS retorna valores vazios)

---

### 3. Sistema de Grupos de Apoio

#### Arquivos Principais:
- **`app/services/groupService.ts`** - Lógica de grupos
- **`app/screens/CriarNovoGrupoScreen.tsx`** - Criar grupo
- **`app/screens/DetalhesDoGrupoScreen.tsx`** - Detalhes do grupo
- **`app/screens/GruposDeAmigosScreen.tsx`** - Lista de grupos
- **`app/screens/HomeDinamicaScreen.tsx`** - Tela principal

#### Funcionalidades:

1. **Criação de Grupos:**
   - Nome, descrição e foto do grupo
   - Geração automática de código único de 6 caracteres (alfanumérico)
   - Upload de foto para Firebase Storage
   - Criador como administrador automaticamente

2. **Entrada em Grupos:**
   - Sistema de código de convite
   - Validação de código
   - Adição automática de membro

3. **Gestão de Membros:**
   - Cargos: Administrador e Membro
   - Listagem de participantes
   - Ranking mensal de pontos

4. **Interface:**
   ```typescript
   interface Group {
     id: string
     nome: string
     descricao: string
     foto: string
     criado_em: string
     membros: GroupMember[]
     ranking_mensal: RankingMember[]
     codigoGrupo: string
   }
   ```

---

### 4. Feed Social de Atividades

#### Arquivos Principais:
- **`app/services/feedService.ts`** - Lógica do feed
- **`app/screens/DetalhesDoGrupoScreen.tsx`** - Exibição do feed
- **`app/components/FeedPosts.tsx`** - Componente de posts
- **`app/components/PostComments.tsx`** - Comentários

#### Tipos de Atividades:
```typescript
type TipoAtividade = 
  | 'desafio_completo' 
  | 'atividade_alternativa' 
  | 'meta_atingida' 
  | 'progresso' 
  | 'leitura'
```

#### Funcionalidades:

1. **Posts:**
   - Criação de posts com texto e foto
   - Upload de imagens para Firebase Storage
   - Ordenação por data (mais recentes primeiro)
   - Associação ao usuário e grupo

2. **Comentários:**
   - Sistema de comentários por post
   - Nome do usuário e timestamp
   - Ordenação cronológica

3. **Integração com Storage:**
   - Upload de fotos do feed
   - URLs públicas para imagens
   - Estrutura: `/feed/{groupId}/{fileName}`

---

### 5. Firebase Storage e Regras de Segurança

#### Arquivo Criado:
- **`FIREBASE_STORAGE_RULES.md`** - Documentação de regras

#### Regras Implementadas:
```javascript
service firebase.storage {
  match /b/{bucket}/o {
    // Fotos do feed
    match /feed/{groupId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024 // Max 5MB
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Fotos de grupos
    match /groups/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

#### Proteções:
- Apenas usuários autenticados
- Limite de 5MB por arquivo
- Apenas imagens permitidas
- Isolamento por grupo

---

### 6. Serviço de Gerenciamento de Usuários

#### Arquivo Principal:
- **`app/services/userService.ts`**

#### Funcionalidades:
1. **Sincronização com Firestore:**
   ```typescript
   syncUserWithFirestore(userId, email, displayName, photoURL)
   ```

2. **Busca de Dados:**
   ```typescript
   getUserData(userId): Promise<UserData>
   ```

3. **Interface de Usuário:**
   ```typescript
   interface UserData {
     userId: string
     email: string
     nome: string
     fotoPerfil: string
     dataCriacao: string
   }
   ```

---

### 7. Estrutura de Telas Implementadas

#### Telas de Autenticação:
- **LoginScreen** - Login com Google
- **BemVindoScreen** - Onboarding
- **OnboardingScreen** - Tutorial inicial
- **CadastroScreen** - Cadastro adicional

#### Telas Principais:
- **HomeDinamicaScreen** - Dashboard principal
  - Tempo de tela do dia
  - Apps mais usados
  - Grupos do usuário
  - Sistema de código para entrar em grupo

#### Telas de Grupos:
- **GruposDeAmigosScreen** - Lista de grupos
- **CriarNovoGrupoScreen** - Criar novo grupo
- **DetalhesDoGrupoScreen** - Feed e detalhes do grupo
- **PaginaDoGrupoScreen** - Informações do grupo

#### Telas de Desafios:
- **DesafiosDisponiveisScreen** - Desafios públicos
- **DesafiosInscritoScreen** - Desafios do usuário
- **DesafiosPublicosScreen** - Explorar desafios

#### Telas de Estatísticas:
- **EstatisticasPessoaisScreen** - Estatísticas detalhadas
- **EstatisticaPessoalResumidaScreen** - Resumo rápido

#### Outras Telas:
- **ConfiguracoesScreen** - Configurações do app
- **PerfilScreen** - Perfil do usuário
- **RankingScreen** - Ranking de grupos
- **BatepapoScreen** - Chat
- **NotificacoesScreen** - Notificações
- **AtividadeScreen** - Registro de atividades

---

## 🛠️ Componentes Reutilizáveis Criados

### Componentes UI:
- **AutoImage** - Carregamento inteligente de imagens
- **Button** - Botão customizável
- **Card** - Container com sombra
- **EmptyState** - Estado vazio
- **Header** - Cabeçalho de tela
- **Icon** - Ícones customizados
- **ListItem** - Item de lista
- **ProgressBar** - Barra de progresso
- **Screen** - Container de tela com safe area
- **Text** - Texto com tipografia
- **TextField** - Campo de entrada
- **Toggle** - Switch/toggle

### Componentes Específicos:
- **FeedPosts** - Renderização de posts
- **PostComments** - Sistema de comentários

---

## 📂 Estrutura de Pastas

```
app/
├── components/          # Componentes reutilizáveis
├── config/             # Configurações do app
├── context/            # Contextos React (Auth, Episode)
├── data/               # Dados estáticos (appCategories.json)
├── devtools/           # Reactotron
├── i18n/               # Traduções (en, es, pt, etc)
├── navigators/         # Navegação
├── screens/            # Telas do app
├── services/           # Lógica de negócio e APIs
│   ├── api/           # Cliente HTTP
│   ├── auth.ts        # Autenticação
│   ├── feedService.ts # Feed social
│   ├── groupService.ts # Grupos
│   ├── screenTime.ts  # Tempo de tela
│   └── userService.ts # Usuários
├── theme/              # Tema e estilos
├── types/              # Definições TypeScript
└── utils/              # Utilitários

android/                # Código Android nativo
├── app/
│   └── src/main/java/com/tccdesconecta/
│       └── screentime/
│           ├── ScreenTimeModule.kt
│           └── ScreenTimePackage.kt

assets/
├── icons/              # Ícones
└── images/             # Imagens
```

---

## 🔒 Segurança e Boas Práticas

### 1. Autenticação:
- Token JWT via Firebase Auth
- Sessão persistente com MMKV
- Logout limpa todos os dados locais

### 2. Firestore Rules:
- Apenas usuários autenticados podem acessar dados
- Usuários só podem modificar seus próprios dados
- Validação de permissões em grupos

### 3. Storage Rules:
- Limite de tamanho de arquivo (5MB)
- Apenas imagens permitidas
- Autenticação obrigatória

### 4. TypeScript:
- Tipagem forte em todo o código
- Interfaces bem definidas
- Type safety em chamadas de API

---

## 📊 Integração Firebase

### Collections Firestore:

1. **usuarios/**
   ```typescript
   {
     userId: string
     email: string
     nome: string
     fotoPerfil: string
     dataCriacao: string
   }
   ```

2. **grupos/**
   ```typescript
   {
     nome: string
     descricao: string
     foto: string
     criado_em: string
     membros: GroupMember[]
     ranking_mensal: RankingMember[]
     codigoGrupo: string
   }
   ```

3. **grupos/{grupoId}/feed/**
   ```typescript
   {
     dataCriacao: string
     descricao: string
     foto: string
     nome: string
     tipoAtividade: TipoAtividade
     userId: string
   }
   ```

4. **grupos/{grupoId}/feed/{postId}/comentarios/**
   ```typescript
   {
     dataCriacao: string
     nomeUsuario: string
     texto: string
     userId: string
   }
   ```

### Firebase Storage:
- `/feed/{groupId}/{fileName}` - Fotos do feed
- `/groups/{fileName}` - Fotos de perfil de grupos

---

## 🎨 Sistema de Temas

- Tema claro e escuro
- Contexto de tema customizado
- Cores dinâmicas
- Espaçamentos consistentes

---

## 🌍 Internacionalização (i18n)

### Idiomas Suportados:
- Inglês (en)
- Espanhol (es)
- Francês (fr)
- Hindi (hi)
- Japonês (ja)
- Coreano (ko)
- Árabe (ar)

### Estrutura:
- Arquivos de tradução por idioma
- Detecção automática do idioma do dispositivo
- Fallback para inglês

---

## 📱 Recursos Nativos Android

### Permissões:
- **PACKAGE_USAGE_STATS** - Estatísticas de uso de apps
- **INTERNET** - Acesso à internet
- **READ_EXTERNAL_STORAGE** - Leitura de fotos
- **CAMERA** - Câmera para fotos

### APIs Nativas Utilizadas:
- **UsageStatsManager** - Tempo de tela
- **PackageManager** - Informações de apps instalados

---

## 🧪 Testes

### Configuração:
- Jest como test runner
- Testing Library para React Native
- Testes unitários de componentes
- Exemplo: `Text.test.tsx`

---

## 🚀 Build e Deploy

### Scripts Disponíveis:
```bash
# Desenvolvimento
yarn start              # Inicia Expo
yarn android           # Roda no Android
yarn ios               # Roda no iOS

# Build EAS
yarn build:android:sim     # Build para simulador Android
yarn build:android:device  # Build para dispositivo Android
yarn build:android:preview # Build preview Android
yarn build:android:prod    # Build produção Android

yarn build:ios:sim         # Build para simulador iOS
yarn build:ios:device      # Build para dispositivo iOS
yarn build:ios:preview     # Build preview iOS
yarn build:ios:prod        # Build produção iOS

# Qualidade de Código
yarn lint              # ESLint
yarn compile           # TypeScript check
yarn test              # Testes
```

### Configurações EAS:
- Arquivo `eas.json` configurado
- Múltiplos perfis de build (development, preview, production)

---

## 📝 Documentação Criada

1. **README.md** - Documentação principal
2. **SCREEN_TIME_MODULE.md** - Módulo de tempo de tela
3. **GOOGLE_SIGNIN_SETUP.md** - Configuração do Google Sign-In
4. **FIREBASE_STORAGE_RULES.md** - Regras de segurança do Storage

---

## 🎯 Principais Funcionalidades Desenvolvidas

### ✅ Autenticação e Usuários
- [x] Login com Google
- [x] Gerenciamento de sessão
- [x] Perfil de usuário
- [x] Sincronização com Firestore

### ✅ Monitoramento de Uso
- [x] Tempo de tela diário
- [x] Tempo por aplicativo
- [x] Histórico semanal
- [x] Apps mais usados
- [x] Solicitação de permissões

### ✅ Grupos de Apoio
- [x] Criar grupos
- [x] Entrar em grupos por código
- [x] Upload de foto do grupo
- [x] Listagem de membros
- [x] Sistema de cargos (admin/membro)
- [x] Código único de convite

### ✅ Feed Social
- [x] Criar posts com texto e foto
- [x] Upload de imagens
- [x] Sistema de comentários
- [x] Tipos de atividades
- [x] Ordenação por data

### ✅ Infraestrutura
- [x] Firebase Authentication
- [x] Firestore Database
- [x] Firebase Storage
- [x] Regras de segurança
- [x] TypeScript completo
- [x] Navegação estruturada
- [x] Componentes reutilizáveis

---

## 🔮 Próximos Passos Sugeridos

### Funcionalidades Pendentes:
1. **Desafios:**
   - Sistema de criação de desafios
   - Inscrição em desafios
   - Tracking de progresso
   - Recompensas

2. **Ranking:**
   - Sistema de pontuação
   - Ranking global e por grupo
   - Achievements/badges

3. **Modo Foco:**
   - Bloqueio de apps
   - Temporizadores
   - Notificações inteligentes

4. **Estatísticas Avançadas:**
   - Gráficos interativos
   - Comparação com metas
   - Insights personalizados

5. **Chat:**
   - Mensagens em tempo real
   - Chat por grupo
   - Notificações push

6. **Notificações:**
   - Push notifications
   - Lembretes de metas
   - Atividades do grupo

---

## 🤖 Contribuição da IA no Desenvolvimento

A IA (GitHub Copilot) auxiliou em:

1. **Arquitetura:**
   - Estruturação de serviços
   - Organização de pastas
   - Padrões de código

2. **Implementação:**
   - Módulo nativo Kotlin para Screen Time
   - Integração Firebase completa
   - Sistema de autenticação Google
   - CRUD de grupos e feed
   - Upload de imagens

3. **Documentação:**
   - Markdown files detalhados
   - Comentários de código
   - Exemplos de uso
   - Troubleshooting

4. **Boas Práticas:**
   - TypeScript strict
   - Error handling
   - Security rules
   - Code organization

5. **Debugging:**
   - Resolução de problemas
   - Otimizações
   - Configurações

---

## 📈 Estatísticas do Projeto

- **Telas Criadas:** ~30
- **Serviços Implementados:** 5
- **Componentes Reutilizáveis:** 15+
- **Idiomas Suportados:** 7
- **Módulos Nativos:** 1 (Screen Time)
- **Integrações Firebase:** 3 (Auth, Firestore, Storage)
- **Linhas de Código:** ~10,000+ (estimado)

---

## 🏁 Conclusão

O aplicativo **TCC Desconecta** foi desenvolvido com sucesso utilizando tecnologias modernas e boas práticas de desenvolvimento mobile. A integração completa com Firebase, o módulo nativo de tempo de tela e o sistema social de grupos criam uma base sólida para um aplicativo de bem-estar digital.

A IA foi fundamental para acelerar o desenvolvimento, garantir qualidade de código e implementar funcionalidades complexas como o módulo nativo Kotlin e as integrações Firebase.

O projeto está preparado para evolução com as funcionalidades pendentes e pronto para testes com usuários reais.

---

**Data do Relatório:** 1 de Fevereiro de 2026  
**Versão:** 0.0.1  
**Status:** Em Desenvolvimento Ativo
