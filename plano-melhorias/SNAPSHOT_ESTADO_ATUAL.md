# Snapshot — Estado Atual da Arquitetura (Pós-Melhorias)

> Documento gerado em: **2026-06-13**  
> Finalidade: medir a evolução após a aplicação completa dos 11 passos do plano de melhorias.  
> Escopo: código em `app/` (features, services, domain, adapters, ports, useCases). Testes incluídos na análise de testabilidade.

---

## Resumo Executivo

| Dimensão | Score (baseline) | Score (atual) | Evolução |
|---|---|---|---|
| **Acoplamento** | 🔴 30 / 100 | 🟡 **62 / 100** | ➕ **+32 pts** |
| **Coesão** | 🟡 45 / 100 | 🟡 **68 / 100** | ➕ **+23 pts** |
| **Testabilidade** | 🔴 20 / 100 | 🟡 **52 / 100** | ➕ **+32 pts** |

---

## 1. Acoplamento

> **Definição usada:** grau com que um módulo depende diretamente de implementações concretas de outros módulos (Firebase SDK, NativeModules, contextos globais), em vez de depender de contratos/interfaces.

### 1.1 Evidências coletadas

| Evidência | Métrica | % do total |
|---|---|---|
| Screens que importam Firebase SDK diretamente | 7 / 34 screens | **20,6 %** |
| Screens que chamam `useAuth()` (acopladas ao contexto global) | 14 / 34 screens | **41,2 %** |
| Screens que importam algum service diretamente | 11 / 34 screens | **32,4 %** |
| Services acoplados diretamente ao Firebase SDK | 8 / 8 services | **100 %** |
| Credenciais hardcoded no código-fonte | ❌ 0 ocorrências | — |
| Funções utilitárias duplicadas entre services | `formatTime` em `screenTime.ts` e `statisticsService.ts` (remanescente) | — |
| Existência de camada Ports/Adapters | ✅ Criada (`app/ports/`, `app/adapters/`) | — |
| Existência de injeção de dependência | ✅ Parcial — use cases recebem dependências via `app/adapters/index.ts` | — |

### 1.2 Screens ainda problemáticas (acopladas a ≥ 2 camadas concretas)

```
DetalhesDoGrupoScreen.tsx   — Firebase (Firestore + Storage) + useAuth + services
PerfilScreen.tsx            — Firebase (Storage + Auth) + useAuth + services
DesafiosPublicosScreen.tsx  — Firebase (Firestore) + useAuth + services
ParticipantesDoGrupoScreen.tsx — Firebase (Firestore) + useAuth
SelecionarAppsDesafioScreen.tsx — Firebase (Storage) + services
SelecionarCriterioGrupoScreen.tsx — Firebase (Storage) + services
DetalhesDoUsuarioScreen.tsx — Firebase (Firestore) + context
```

### 1.3 Estrutura atual do fluxo de dados (camadas implementadas)

```
Screen
  ├── import { saveLimitConfigUseCase }   ← use case (correto — ConfigurarLimiteScreen)
  ├── import { isDomainError }            ← erros tipados (correto)
  ├── import { Group as DomainGroup }     ← entidade de domínio (correto)
  ├── import groupService / userService   ← ainda presente em screens complexas
  └── import { getFirestore, ... }        ← bypass Firebase (ainda presente em 7 screens)

Use Case
  └── import { userRepository, screenTimeGateway } from "@/adapters"  ← via port

Adapter
  └── implements IUserRepository / IScreenTimeGateway / IGroupRepository / INotificationService

Service (camada legada — ainda em uso pelas telas não migradas)
  └── import firestore from "@react-native-firebase/firestore"   ← acoplado ao SDK
```

### 1.4 Novos artefatos de desacoplamento criados

| Artefato | Localização | Status |
|---|---|---|
| `IUserRepository` | `app/ports/IUserRepository.ts` | ✅ Criado |
| `IGroupRepository` | `app/ports/IGroupRepository.ts` | ✅ Criado |
| `IScreenTimeGateway` | `app/ports/IScreenTimeGateway.ts` | ✅ Criado |
| `INotificationService` | `app/ports/INotificationService.ts` | ✅ Criado |
| `FirestoreUserRepository` | `app/adapters/FirestoreUserRepository.ts` | ✅ Criado |
| `FirestoreGroupRepository` | `app/adapters/FirestoreGroupRepository.ts` | ✅ Criado |
| `NativeScreenTimeGateway` | `app/adapters/NativeScreenTimeGateway.ts` | ✅ Criado |
| `FcmNotificationService` | `app/adapters/FcmNotificationService.ts` | ✅ Criado |

### 1.5 Score detalhado de acoplamento

| Critério | Peso | Baseline | Atual |
|---|---|---|---|
| Screens sem acesso direto ao Firebase | 30 pts | 8 pts | 18 pts (7/34 violam = 79,4% ok) |
| Camada de abstração (Ports/Adapters) existe | 25 pts | 0 pts | **20 pts** (criada, adoção parcial) |
| Sem credenciais hardcoded | 15 pts | 10 pts | **15 pts** (100% em env) |
| Services usam interfaces, não SDKs concretos | 20 pts | 0 pts | 4 pts (use cases usam; services legados não) |
| Funções utilitárias sem duplicação | 10 pts | 7 pts | 5 pts (`formatTime` ainda duplicada) |
| **TOTAL** | **100 pts** | **~30 pts** | **~62 pts** |

---

## 2. Coesão

> **Definição usada:** grau com que um módulo tem **uma única razão para mudar** (SRP). Alta coesão = módulo faz só uma coisa bem.

### 2.1 Evidências coletadas

| Evidência | Detalhe |
|---|---|
| Tela mais longa | `DetalhesDoGrupoScreen.tsx` — **2.696 linhas**, 30 hooks, 72 `async`/`await`, 2 chamadas diretas ao Firebase (mesma tela do baseline — não migrada) |
| Services com múltiplas responsabilidades | `screenTime.ts` (512 linhas): bridge nativo, persistência Firestore, formatação, configuração de bloqueio — ainda god object |
| | `statisticsService.ts` (412 linhas): busca Firestore, agregação, formatação, paleta de cores — ainda god object |
| | `groupService.ts` (420 linhas): reduzido de 678 → 420 após extração de GroupCode |
| Use cases criados | `saveLimitConfigUseCase.ts` (78 linhas), `deleteLimitConfigUseCase.ts` (36 linhas), `signInWithGoogleUseCase.ts` (39 linhas) |
| Entidades de domínio extraídas | `Group.ts` (97 linhas), `LimiteConfig.ts` (65 linhas), `GroupCode.ts` (31 linhas), `PackageName.ts` (20 linhas) |
| Screens sem nenhuma dependência externa | 19 / 34 (55,9%) — stubs ainda não implementados |
| Custom hooks de negócio | `useGoogleLogin.ts`, `useAppForeground.ts` — 2 hooks com lógica extraída |
| Pasta `app/useCases/` | ✅ Existe com 2 subpastas (`auth/`, `limits/`) |
| Interfaces de domínio separadas | ✅ Definidas em `app/domain/` e `app/ports/` |
| Estrutura por feature | ✅ `app/features/` com 6 features: `auth`, `grupos`, `limites`, `desafios`, `perfil`, `screen-time` |
| Cloud Functions extraídas do cliente | ✅ `sendGroupNotification`, `onActivityRegistered`, `onChallengeCompleted` movidos para `functions/` |

### 2.2 Mapeamento de responsabilidades por arquivo (comparativo)

| Arquivo | Responsabilidades | Qtd (antes) | Qtd (atual) |
|---|---|---|---|
| `screenTime.ts` | Bridge nativo, permissão, persistência Firestore, formatação, bloqueio | 5 | 5 (não migrado) |
| `statisticsService.ts` | Fetch Firestore, cálculo, formatação, tradução de categoria, paleta, delete | 6 | 6 (não migrado) |
| `groupService.ts` | Criar, listar, buscar, membros, admin, foto, nome, sair/remover | 8+ | 6 (GroupCode extraído) |
| `saveLimitConfigUseCase.ts` | Validar, persistir user, configurar bloqueio | — | 3 |
| `Group.ts` (entidade) | Membros, expiração, admin, código | — | 4 |
| `DetalhesDoGrupoScreen.tsx` | UI, fetch, upload, membros, ranking, feed, loading, navegação | 8+ | 8+ (não migrada) |
| `feedService.ts` | Feed de grupos, notificação via Cloud Function | 2+ | 2 (notificação delegada) |

### 2.3 Score detalhado de coesão

| Critério | Peso | Baseline | Atual |
|---|---|---|---|
| Sem "God Objects" (arquivos > 500 linhas com múltiplas responsabilidades) | 30 pts | 5 pts | 15 pts (reduzido de 3+ para 2 god objects: `screenTime.ts` e `statisticsService.ts`) |
| Lógica de negócio fora das screens | 25 pts | 10 pts | 18 pts (use cases cobrem limites e auth; grupos/desafios ainda com lógica na tela) |
| Use cases / camada de orquestração existe | 20 pts | 0 pts | **15 pts** (criada, cobertura parcial) |
| Utilitários centralizados (sem duplicação de helpers) | 15 pts | 10 pts | 10 pts (`formatTime` ainda duplicada) |
| Screens com responsabilidade única (UI apenas) | 10 pts | 7 pts | 10 pts (19/34 são stubs; as telas implementadas têm lógica inline) |
| **TOTAL** | **100 pts** | **~45 pts** | **~68 pts** |

---

## 3. Testabilidade

> **Definição usada:** facilidade de escrever testes unitários e de integração isolados, sem precisar de Firebase real, de dispositivo Android ou de contextos globais.

### 3.1 Evidências coletadas

| Evidência | Situação atual | Impacto |
|---|---|---|
| `ScreenTimeService` — singleton | ✅ Parcialmente corrigido: `screenTimeGateway` via `IScreenTimeGateway` nos use cases | Use cases testáveis com mock |
| `StatisticsService` — singleton (`export default new StatisticsService()`) | ❌ Ainda singleton | Impossível substituir por mock |
| `screenTime.ts` importa `NativeModules` no top-level | ✅ Encapsulado em `NativeScreenTimeGateway.ts` (mas `screenTime.ts` ainda importa diretamente para os services legados) | Parcial |
| Services acoplados ao Firebase SDK | ❌ Ainda 8/8 services — não usam as interfaces de `app/ports/` | Testes precisam mockar SDK |
| Erros tipados e propagados | ✅ 47 ocorrências de `DomainError`/`NetworkError`/`NotFoundError`/`ConflictError`/`isDomainError` em produção | Testável via `catch` |
| Retornos silenciosos (`return null / false / []`) | ⚠️ Ainda 41 ocorrências nos services legados | Erros silenciosos remanescentes |
| Sem injeção de dependência nas screens | ❌ Ainda presente nas telas não migradas | Requer render completo |
| Use cases com injeção via adapters | ✅ `saveLimitConfigUseCase`, `deleteLimitConfigUseCase`, `signInWithGoogleUseCase` usam interfaces | Testáveis com mock |
| Testes de serviço existentes | ✅ 4 suites: `feedService`, `groupService`, `screenTime`, `userService` | Cobertura básica |
| Entidades de domínio puras | ✅ `Group`, `LimiteConfig`, `GroupCode`, `PackageName` — sem dependências externas | Facilmente testáveis |
| Cloud Functions server-side | ✅ Tokens FCM nunca expostos ao cliente — lógica de servidor isolável | Mais seguro e testável |

### 3.2 Fluxo de dependências nos use cases (novo padrão)

```
ConfigurarLimiteScreen
  └── saveLimitConfigUseCase(data, uid)
        ├── userRepository.update(uid, limites)   ← IUserRepository (mockável)
        └── screenTimeGateway.configureBlocking() ← IScreenTimeGateway (mockável)
```

```
LoginScreen
  └── useGoogleLogin()
        └── signInWithGoogleUseCase()
              ├── GoogleSignin.signIn()
              └── throws NetworkError (tipado)
```

### 3.3 Score detalhado de testabilidade

| Critério | Peso | Baseline | Atual |
|---|---|---|---|
| Services sem singletons (instâncias injetáveis) | 25 pts | 0 pts | 12 pts (use cases usam interfaces; services legados ainda são singletons) |
| Sem acesso direto a NativeModules nos services | 20 pts | 0 pts | 12 pts (`NativeScreenTimeGateway` encapsula; `screenTime.ts` ainda acessa diretamente para uso legado) |
| Erros tipados e propagados (não swallowed) | 20 pts | 5 pts | **14 pts** (47 usos de erros tipados; 41 retornos silenciosos remanescentes) |
| Lógica de negócio extraída em hooks/use cases puros | 20 pts | 5 pts | **10 pts** (3 use cases + 2 hooks; screens complexas ainda inline) |
| Componentes de UI recebem dados via props | 15 pts | 10 pts | **4 pts** (redução: screens complexas ainda buscam diretamente) |
| **TOTAL** | **100 pts** | **~20 pts** | **~52 pts** |

---

## 4. Inventário Geral do Código

```
app/features/          34 telas  11.731 linhas totais
  auth/                7 screens + 1 hook + 1 useCase
  screen-time/         4 screens
  limites/             5 screens + 2 useCases
  grupos/              11 screens
  desafios/            5 screens
  perfil/              2 screens
app/services/          8 arquivos    2.245 linhas totais   (↓ 346 linhas vs baseline)
app/domain/            5 arquivos    256 linhas totais      (criado do zero)
app/ports/             4 arquivos    (interfaces de contrato)
app/adapters/          5 arquivos    (implementações concretas)
app/useCases/          2 subpastas   (auth/, limits/)
app/shared/hooks/      1 arquivo     (useAppForeground.ts)
app/context/           1 arquivo     (AuthContext.tsx)
app/components/        18 arquivos   (componentes reutilizáveis)
app/navigators/        4 arquivos    (tipagem de rotas)
app/data/              1 arquivo     (excludedSystemPackages.json — lista de sistema)
functions/src/         3 Cloud Functions (triggers + callable)
```

---

## 5. Pontos Positivos Mantidos

- **Tipagem TypeScript** presente em todas as screens (`StackScreenProps` / `NativeStackScreenProps`)
- **Camada de services** preservada e ainda em uso — base sólida para migração incremental
- **`AuthContext`** com persistência MMKV e `useAuth()` — padrão de acesso centralizado mantido
- **Componentes reutilizáveis** bem isolados (18 componentes, incluindo `Button`, `Screen`, `Card`)
- **Nenhum NativeModule é importado diretamente nas screens** — bridge nativo encapsulado
- **Erros tipados** (`DomainError` e subtipos) adotados em 47 pontos do código
- **Cloud Functions** isolam lógica de servidor (ranking, notificações, status de desafios)
- **Entidades de domínio** com regras de negócio encapsuladas (expiração de grupo, validação de limite, geração segura de código)

---

## 6. O Que Ainda Pode Evoluir (Dívida Técnica Remanescente)

| Item | Impacto | Esforço estimado |
|---|---|---|
| Migrar `DetalhesDoGrupoScreen` (2.696 linhas) para use cases + hooks | Alto | Alto |
| Migrar `screenTime.ts` e `statisticsService.ts` para usar ports/adapters | Alto | Médio |
| Remover duplicação de `formatTime` entre os dois services acima | Baixo | Baixo |
| Migrar screens de grupos/desafios para consumir use cases | Alto | Médio |
| Eliminar `export default new StatisticsService()` (singleton) | Médio | Baixo |
| Aumentar cobertura de testes nos use cases e entidades de domínio | Alto | Médio |

---

## 7. Comparativo Final

| Dimensão | Baseline (2026-06-11) | Atual (2026-06-13) | Meta do Plano | Atingiu? |
|---|---|---|---|---|
| **Acoplamento** | 🔴 30 / 100 | 🟡 **62 / 100** | 🟢 75 / 100 | Parcial (83% da meta) |
| **Coesão** | 🟡 45 / 100 | 🟡 **68 / 100** | 🟢 80 / 100 | Parcial (85% da meta) |
| **Testabilidade** | 🔴 20 / 100 | 🟡 **52 / 100** | 🟢 70 / 100 | Parcial (74% da meta) |

> **Observação**: As metas do plano eram ambiciosas e assumiam migração completa de todas as telas. As telas mais complexas (`DetalhesDoGrupoScreen`, `EstatisticaPessoalResumidaScreen`, `HomeDinamicaScreen`) são candidatas naturais para uma próxima rodada de refatoração — a infraestrutura de ports, adapters, domain e use cases já está em vigor para recebê-las.

---

*Próximo snapshot recomendado: após a migração das telas complexas de grupos e screen-time para o padrão use cases + adapters.*
