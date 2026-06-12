# Commit T01 — Infraestrutura de Testes e Mocks

**Mensagem de commit:** `test: setup jest infrastructure and Firebase mocks`

---

## Objetivo

Preparar a infraestrutura de testes para que os testes de services e telas possam rodar sem instalar dependências nativas. Os módulos Firebase, NativeModules e plataforma Android são mockados globalmente.

---

## Arquivos Afetados

- **Modificar:** `jest.config.js`
- **Modificar:** `test/setup.ts`

---

## Passos de Execução

### Passo 1 — Atualizar `jest.config.js`

```javascript
/** @type {import('@jest/types').Config.ProjectConfig} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/test/setup.ts"],

  // Resolve o alias @/ usado em todo o app
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/app/$1",
    "^@assets/(.*)$": "<rootDir>/assets/$1",
  },

  // Permite que jest-expo transforme os pacotes Firebase e outros pacotes nativos
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@react-native-firebase/.*))",
  ],
}
```

### Passo 2 — Adicionar mocks ao `test/setup.ts`

Adicionar ao final do arquivo existente:

```typescript
// ─── Firebase Firestore ──────────────────────────────────────────────────────
jest.mock("@react-native-firebase/firestore", () => {
  const mockDocRef = {
    id: "mock-doc-id",
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  const mockCollectionRef = {
    add: jest.fn(),
    doc: jest.fn(() => mockDocRef),
    get: jest.fn(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  }

  return {
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(() => mockCollectionRef),
    doc: jest.fn(() => mockDocRef),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    addDoc: jest.fn(),
    deleteDoc: jest.fn(),
    arrayUnion: jest.fn((...args) => ({ _type: "arrayUnion", elements: args })),
    arrayRemove: jest.fn((item) => ({ _type: "arrayRemove", element: item })),
    query: jest.fn((ref) => ref),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    writeBatch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
    serverTimestamp: jest.fn(() => new Date()),
    Timestamp: {
      now: jest.fn(() => ({ toDate: () => new Date(), seconds: 0, nanoseconds: 0 })),
      fromDate: jest.fn((date) => ({ toDate: () => date, seconds: 0, nanoseconds: 0 })),
    },
  }
})

// ─── Firebase Auth ───────────────────────────────────────────────────────────
jest.mock("@react-native-firebase/auth", () => {
  return () => ({
    currentUser: null,
    signInWithCredential: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
  })
})

// ─── Firebase Storage ────────────────────────────────────────────────────────
jest.mock("@react-native-firebase/storage", () => {
  return () => ({
    ref: jest.fn(() => ({
      putFile: jest.fn().mockResolvedValue({}),
      getDownloadURL: jest.fn().mockResolvedValue("https://mock-storage.example.com/image.jpg"),
      delete: jest.fn().mockResolvedValue(undefined),
    })),
  })
})

// ─── Firebase Messaging ──────────────────────────────────────────────────────
jest.mock("@react-native-firebase/messaging", () => {
  return () => ({
    getToken: jest.fn().mockResolvedValue("mock-fcm-token"),
    requestPermission: jest.fn().mockResolvedValue(1),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn().mockResolvedValue(null),
  })
})

// ─── Google Sign-In ──────────────────────────────────────────────────────────
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn().mockResolvedValue(false),
    getTokens: jest.fn().mockResolvedValue({ idToken: "mock-id-token", accessToken: "" }),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  },
}))

// ─── NativeModules.ScreenTimeModule ──────────────────────────────────────────
jest.mock("react-native/Libraries/Utilities/Platform", () => ({
  OS: "android",
  select: jest.fn((obj) => obj.android),
}))

// O mock de react-native já existe no setup, aqui adicionamos o ScreenTimeModule
// Se o mock de react-native já estiver definido acima no arquivo, use:
//   jest.doMock("react-native", () => { ... NativeModules: { ScreenTimeModule: {...} } })
// Caso contrário, adicionar ao objeto NativeModules do mock existente:
Object.assign(require("react-native").NativeModules, {
  ScreenTimeModule: {
    hasUsageStatsPermission: jest.fn().mockResolvedValue(true),
    requestUsageStatsPermission: jest.fn(),
    openUsageSettings: jest.fn(),
    getTodayAppUsage: jest.fn().mockResolvedValue([]),
    setBackgroundSyncUser: jest.fn().mockResolvedValue(true),
    startBackgroundTracking: jest.fn().mockResolvedValue(true),
    stopBackgroundTracking: jest.fn().mockResolvedValue(true),
    configureAppBlocking: jest.fn().mockResolvedValue(undefined),
    setExcludedPackages: jest.fn(),
  },
})

// ─── expo-constants ──────────────────────────────────────────────────────────
jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        googleWebClientId: "mock-client-id.apps.googleusercontent.com",
      },
    },
  },
}))
```

---

## Verificação

```bash
# Confirmar que os testes existentes ainda passam após as mudanças
npm test

# Saída esperada: test/i18n.test.ts PASS (e nenhum erro de import)
```

---

## Resultado Esperado

- `@/` funciona nos imports de todos os arquivos de teste.
- Firebase não causa "Cannot find native module" nos testes.
- `NativeModules.ScreenTimeModule` está acessível com valores mockados.
- Os testes do boilerplate (`i18n.test.ts`) continuam passando.
