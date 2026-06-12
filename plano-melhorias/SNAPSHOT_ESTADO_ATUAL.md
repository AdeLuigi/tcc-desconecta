# Snapshot — Estado Atual da Arquitetura (Baseline)

> Documento gerado em: **2026-06-11**  
> Finalidade: servir de **baseline** para medir a evolução após a aplicação do plano de melhorias.  
> Escopo: código em `app/` (screens, services, context, components, utils). Testes ignorados intencionalmente.

---

## Resumo Executivo

| Dimensão | Score (estado atual) | Interpretação |
|---|---|---|
| **Acoplamento** | 🔴 **30 / 100** | Alto acoplamento — Firebase e infraestrutura vazam para as telas |
| **Coesão** | 🟡 **45 / 100** | Coesão média-baixa — arquivos com múltiplas responsabilidades |
| **Testabilidade** | 🔴 **20 / 100** | Muito difícil de testar — singletons, side-effects e sem injeção de dependência |

---

## 1. Acoplamento

> **Definição usada:** grau com que um módulo depende diretamente de implementações concretas de outros módulos (Firebase SDK, NativeModules, contextos globais), em vez de depender de contratos/interfaces.

### 1.1 Evidências coletadas

| Evidência | Métrica | % do total |
|---|---|---|
| Screens que importam Firebase SDK diretamente | 8 / 37 screens | **21,6 %** |
| Screens que chamam `useAuth()` (acopladas ao contexto global) | 15 / 37 screens | **40,5 %** |
| Screens que importam algum service diretamente | 12 / 37 screens | **32,4 %** |
| Services acoplados diretamente ao Firebase SDK | 8 / 8 services | **100 %** |
| Credenciais hardcoded no código-fonte | 1 ocorrência (`webClientId` em `auth.ts`) | — |
| Funções utilitárias duplicadas entre services | `formatTime` em `screenTime.ts` e `statisticsService.ts` | — |
| Existência de camada Ports/Adapters | ❌ Não existe | — |
| Existência de injeção de dependência | ❌ Não existe | — |

### 1.2 Screens problemáticas (acopladas a ≥ 2 camadas concretas)

```
DetalhesDoGrupoScreen.tsx  — Firebase (Firestore + Storage) + useAuth + services
PerfilScreen.tsx           — Firebase (Storage + Auth) + useAuth + services
DesafiosPublicosScreen.tsx — Firebase (Firestore) + useAuth + services
ParticipantesDoGrupoScreen.tsx — Firebase (Firestore) + useAuth
CriarNovoGrupoScreen.tsx   — Firebase (Storage) + services
SelecionarAppsDesafioScreen.tsx — Firebase (Storage) + services
SelecionarCriterioGrupoScreen.tsx — Firebase (Storage) + services
DetalhesDoUsuarioScreen.tsx — Firebase (Firestore) + context
```

### 1.3 Estrutura atual do fluxo de dados

```
Screen
  ├── import { getFirestore, getDocs, updateDoc } from "@react-native-firebase/firestore"  ← bypass do service
  ├── import groupService / userService                                                     ← correto
  ├── import { useAuth }                                                                    ← ok, mas largamente usado inline
  └── lógica de negócio inline (operações assíncronas na própria tela)
```

### 1.4 Score detalhado de acoplamento

| Critério | Peso | Pontuação atual |
|---|---|---|
| Screens sem acesso direto ao Firebase | 30 pts | 8 pts (8/37 violam = 78,4% ok → ~25 pts penalizados) |
| Camada de abstração (Ports/Adapters) existe | 25 pts | 0 pts |
| Sem credenciais hardcoded | 15 pts | 10 pts (1 arquivo com problema) |
| Services usam interfaces, não SDKs concretos | 20 pts | 0 pts (100% acoplados) |
| Funções utilitárias sem duplicação | 10 pts | 7 pts (2 duplicatas) |
| **TOTAL** | **100 pts** | **~30 pts** |

---

## 2. Coesão

> **Definição usada:** grau com que um módulo tem **uma única razão para mudar** (SRP). Alta coesão = módulo faz só uma coisa bem.

### 2.1 Evidências coletadas

| Evidência | Detalhe |
|---|---|
| Tela mais longa | `DetalhesDoGrupoScreen.tsx` — **2.705 linhas**, 30 hooks (`useState`/`useEffect`/`useCallback`/`useMemo`), 72 ocorrências de `async`/`await`, 8 chamadas diretas ao Firestore |
| Serviços com múltiplas responsabilidades | `screenTime.ts` (503 linhas): bridge nativo, persistência Firestore, formatação de tempo, configuração de bloqueio |
| | `statisticsService.ts` (412 linhas): busca no Firestore, agregação matemática, formatação, tradução de categorias, paleta de cores |
| | `groupService.ts` (678 linhas): CRUD, ranking, papéis de admin, foto, código de convite |
| Screens sem nenhuma dependência externa | 22 / 37 (59,5%) — maioria são telas não implementadas (stubs) |
| Custom hooks extraídos | 3 utilitários em `app/utils/` (`useHeader`, `useIsMounted`, `useSafeAreaInsetsStyle`) — nenhum extrai lógica de negócio |
| Pasta `app/useCases/` | ❌ Não existe |
| Interfaces de domínio separadas | ❌ Definidas inline dentro dos próprios services |

### 2.2 Mapeamento de responsabilidades por arquivo

| Arquivo | Responsabilidades identificadas | Qtd |
|---|---|---|
| `screenTime.ts` | Bridge nativo, permissão, persistência Firestore, formatação de tempo, bloqueio de apps | 5 |
| `statisticsService.ts` | Fetch Firestore, cálculo de resumo, formatação, tradução de categoria, paleta de cores, delete em batch | 6 |
| `groupService.ts` | Criar grupo, listar grupos, buscar por código, membros, admin, foto, nome, descrição, sair/remover | 8+ |
| `DetalhesDoGrupoScreen.tsx` | UI, busca de dados, upload de foto, gerenciamento de membros, ranking, feed, estado de loading, navegação | 8+ |
| `AuthContext.tsx` | Autenticação, persistência MMKV, validação de email, logout | 4 |

### 2.3 Score detalhado de coesão

| Critério | Peso | Pontuação atual |
|---|---|---|
| Sem "God Objects" (arquivos > 500 linhas com múltiplas responsabilidades) | 30 pts | 5 pts (3+ God Objects identificados) |
| Lógica de negócio fora das screens | 25 pts | 10 pts (8 screens com Firestore inline) |
| Use cases / camada de orquestração existe | 20 pts | 0 pts |
| Utilitários centralizados (sem duplicação de helpers) | 15 pts | 10 pts (duplicação parcial de formatTime/formatDate) |
| Screens com responsabilidade única (UI apenas) | 10 pts | 7 pts (a maioria das screens é ainda stub) |
| **TOTAL** | **100 pts** | **~45 pts** |

---

## 3. Testabilidade

> **Definição usada:** facilidade de escrever testes unitários e de integração isolados, sem precisar de Firebase real, de um dispositivo Android real ou de contextos globais.

### 3.1 Evidências coletadas

| Evidência | Impacto |
|---|---|
| `ScreenTimeService` exportado como singleton (`export default new ScreenTimeService()`) | Impossível substituir por mock |
| `StatisticsService` exportado como singleton (`export default new StatisticsService()`) | Impossível substituir por mock |
| `screenTime.ts` importa `NativeModules` no top-level | Qualquer import do módulo exige mock do NativeModules |
| Todos os 8 services importam Firebase SDK diretamente | Testes de unidade precisam mockar o SDK inteiro |
| Tratamento de erro via `return null / false / []` | Erros silenciosos — testes não conseguem verificar caminhos de falha |
| Ausência de erros de domínio tipados | Somente `ErrorBoundary` (componente React) — sem `DomainError` / `AppError` |
| Sem injeção de dependência nas screens | Screen cria suas próprias dependências — impossível substituí-las em teste |
| Sem camada de use cases | Lógica misturada com UI → teste de lógica exige renderizar a tela inteira |
| Custom hooks de negócio | ❌ 0 hooks extraindo lógica testável |

### 3.2 Fluxo de dependências que bloqueiam os testes

```
DetalhesDoGrupoScreen
  └── import { getFirestore, updateDoc } from "@react-native-firebase/firestore"
        └── requer Firebase inicializado (ou jest mock extenso)
  └── import storage from "@react-native-firebase/storage"
        └── idem
  └── import { useAuth }
        └── requer AuthProvider envolvendo o componente no teste
```

### 3.3 Score detalhado de testabilidade

| Critério | Peso | Pontuação atual |
|---|---|---|
| Services sem singletons (instâncias injetáveis) | 25 pts | 0 pts (2 singletons) |
| Sem acesso direto a NativeModules nos services | 20 pts | 0 pts |
| Erros tipados e propagados (não swallowed) | 20 pts | 5 pts (padrão inconsistente) |
| Lógica de negócio extraída em hooks/use cases puros | 20 pts | 5 pts (3 hooks utilitários sem lógica de negócio) |
| Componentes de UI recebem dados via props (não buscam direto) | 15 pts | 10 pts (componentes menores são razoáveis; screens não) |
| **TOTAL** | **100 pts** | **~20 pts** |

---

## 4. Inventário Geral do Código

```
app/screens/       37 arquivos   12.611 linhas totais
app/services/       8 arquivos    2.596 linhas totais
app/context/        2 arquivos      221 linhas totais
app/components/    17 arquivos   (componentes reutilizáveis — bem estruturados)
app/navigators/     5 arquivos   (tipagem de rotas presente em 32/37 screens)
app/utils/          ~12 arquivos  (utilitários, 3 hooks simples)
app/useCases/       ❌ não existe
app/hooks/          ❌ não existe
app/domain/         ❌ não existe
```

---

## 5. Pontos Positivos (não regredir)

- **Tipagem TypeScript** presente em 32/37 screens (`StackScreenProps` / `NativeStackScreenProps`)
- **Camada de services** existe e é usada pela maioria das screens (apenas 8 bypassam)
- **Componentes reutilizáveis** bem isolados (17 componentes, incluindo `Button`, `Screen`, `Card`, `ListItem`, `TextField`)
- **AuthContext** com persistência MMKV e `useAuth()` hook — padrão de acesso centralizado
- **`groupService.ts`** centraliza toda a lógica de grupos sem que as screens precisem saber do Firestore (exceto `DetalhesDoGrupoScreen`)
- **Nenhum NativeModule é importado diretamente nas screens** — bridge nativo está encapsulado em `screenTime.ts`

---

## 6. Mapa de Impacto do Plano de Melhorias

| Melhoria | Impacto em Acoplamento | Impacto em Coesão | Impacto em Testabilidade |
|---|---|---|---|
| 01 — Remove Ignite boilerplate | ➕ baixo | ➕ baixo | ➕ baixo |
| 02 — Fix getUserGroups query | ➕ baixo | ➕ baixo | ➕ baixo |
| 03 — Extract useAppForeground | ➕ baixo | ➕➕ médio | ➕➕ médio |
| 04 — Move credentials to env | ➕➕ médio | neutro | ➕ baixo |
| 05 — Standardize error handling | ➕ baixo | ➕➕ médio | ➕➕➕ alto |
| **06 — Extract use cases** | **➕➕ médio** | **➕➕➕ alto** | **➕➕➕ alto** |
| **07 — Ports/Adapters layer** | **➕➕➕ alto** | **➕➕ médio** | **➕➕➕ alto** |
| 08 — Rich domain entities | ➕ baixo | ➕➕ médio | ➕➕ médio |
| 09 — Restructure by feature | ➕ baixo | ➕➕ médio | ➕ baixo |
| 10 — Cloud Functions backend | ➕➕ médio | ➕➕ médio | ➕ baixo |
| 11 — Minor tech debt | ➕ baixo | ➕ baixo | ➕ baixo |

---

## 7. Meta Esperada Pós-Melhorias

> Valores-alvo após execução completa do plano (commits 01–11):

| Dimensão | Baseline (hoje) | Meta |
|---|---|---|
| Acoplamento | 🔴 30 / 100 | 🟢 **75 / 100** |
| Coesão | 🟡 45 / 100 | 🟢 **80 / 100** |
| Testabilidade | 🔴 20 / 100 | 🟢 **70 / 100** |

---

*Próximo passo: aplicar os commits do plano de melhorias e atualizar este documento com um novo snapshot para comparação.*
