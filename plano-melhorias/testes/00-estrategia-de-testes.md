# Estratégia de Testes — Desconecta

> Os testes devem ser escritos **antes** de aplicar as melhorias arquiteturais. Eles servem como rede de segurança: qualquer refatoração que quebre o comportamento existente será detectada imediatamente.

---

## Sequência de Commits (testes)

| Arquivo | Commit | Foco |
|---|---|---|
| [01-infra-e-mocks.md](./01-infra-e-mocks.md) | `test: setup jest infrastructure and Firebase mocks` | jest.config + mocks |
| [02-testes-utils.md](./02-testes-utils.md) | `test: add unit tests for utility functions` | Funções puras |
| [03-testes-services.md](./03-testes-services.md) | `test: add unit tests for services` | Services (Firebase mockado) |
| [04-testes-screens.md](./04-testes-screens.md) | `test: add component tests for key screens` | React Testing Library |

---

## Pirâmide de Testes

```
        ┌───────────────┐
        │  E2E / Maestro │  (já configurado: .maestro/)
        ├───────────────┤
        │  Screens/Hooks │  → React Testing Library
        ├───────────────┤
        │   Services    │  → Jest + Firebase mock
        ├───────────────┤
        │     Utils     │  → Jest puro (sem mocks)
        └───────────────┘
```

---

## Cobertura Alvo

| Camada | Meta | Prioridade |
|---|---|---|
| `app/utils/` | 90%+ (funções puras) | Alta |
| `app/services/` | 70%+ (lógica de negócio) | Alta |
| `app/screens/` (key screens) | 50%+ (fluxos críticos) | Média |
| `app/context/` | 80%+ (AuthContext) | Média |
| `app/navigators/` | 30% (smoke test) | Baixa |

---

## Princípios

1. **Testar comportamento, não implementação** — os testes devem sobreviver a refatorações internas.
2. **Mocks mínimos** — mockar apenas o que é externo ao sistema (Firebase, NativeModules, Platform).
3. **Nomenclatura descritiva** — `describe("getUserGroups")` + `it("retorna grupos onde usuário é membro")`.
4. **Arrange / Act / Assert** — estrutura clara em cada test case.
5. **Testes independentes** — cada teste limpa seu próprio estado; sem dependência de ordem.

---

## Relação com o Plano Arquitetural

```
Commit de testes → Commit arquitetural (verificação)
─────────────────────────────────────────────────
02 (utils tests) → 08 (domain entities)  
   getAppCategory → LimiteConfig.isActiveToday

03 (service tests) → 02 (array-contains query)
   getUserGroups   → refatoração do Firestore query

03 (service tests) → 06 (extract use cases)
   handleSave logic → saveLimitConfigUseCase

04 (screen tests) → 06 (extract use cases)
   LoginScreen.login → useGoogleLogin hook
```

---

## Como executar

```bash
# Todos os testes
npm test

# Watch mode (durante desenvolvimento)
npm run test:watch

# Com cobertura
npx jest --coverage --coverageDirectory=coverage

# Um arquivo específico
npx jest app/services/__tests__/groupService.test.ts

# Todos os testes de services
npx jest app/services/
```
