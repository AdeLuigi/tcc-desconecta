# Commit T02 — Testes de Funções Utilitárias

**Mensagem de commit:** `test: add unit tests for utility functions`

---

## Objetivo

Cobrir as funções utilitárias puras (sem dependências externas) com testes unitários. Estas são as mais simples de testar e fornecem cobertura imediata.

---

## Arquivos a Criar

- `app/utils/__tests__/appCategories.test.ts`
- `app/utils/__tests__/formatDate.test.ts`

---

## `app/utils/__tests__/appCategories.test.ts`

```typescript
import { getAppCategory, getCategoryLabel } from "@/utils/appCategories"

describe("getAppCategory", () => {
  describe("categorias conhecidas pelo package name", () => {
    it("classifica Instagram como social", () => {
      expect(getAppCategory("com.instagram.android")).toBe("social")
    })
    it("classifica Facebook como social", () => {
      expect(getAppCategory("com.facebook.katana")).toBe("social")
    })
    it("classifica WhatsApp como social", () => {
      expect(getAppCategory("com.whatsapp")).toBe("social")
    })
    it("classifica Netflix como entertainment", () => {
      expect(getAppCategory("com.netflix.mediaclient")).toBe("entertainment")
    })
    it("retorna 'other' para package desconhecido", () => {
      expect(getAppCategory("com.app.completamente.desconhecido.xyz")).toBe("other")
    })
    it("retorna 'other' para string vazia", () => {
      expect(getAppCategory("")).toBe("other")
    })
  })

  describe("override com nativeCategory", () => {
    it("usa nativeCategory quando válida e diferente de 'other'", () => {
      expect(getAppCategory("com.unknown.app", "games")).toBe("games")
    })
    it("ignora nativeCategory 'other' e usa lookup por package", () => {
      expect(getAppCategory("com.instagram.android", "other")).toBe("social")
    })
    it("ignora nativeCategory inválida e usa lookup por package", () => {
      expect(getAppCategory("com.instagram.android", "invalid_category")).toBe("social")
    })
    it("retorna nativeCategory válida mesmo para package desconhecido", () => {
      expect(getAppCategory("com.unknown.app.xyz", "productivity")).toBe("productivity")
    })
  })
})

describe("getCategoryLabel", () => {
  it("retorna label para 'social'", () => {
    expect(getCategoryLabel("social")).toBe("Redes Sociais")
  })
  it("retorna label para 'entertainment'", () => {
    expect(getCategoryLabel("entertainment")).toBe("Entretenimento")
  })
  it("retorna label para 'games'", () => {
    expect(typeof getCategoryLabel("games")).toBe("string")
    expect(getCategoryLabel("games").length).toBeGreaterThan(0)
  })
  it("retorna 'Outros' para categoria inexistente", () => {
    expect(getCategoryLabel("nonexistent_category" as any)).toBe("Outros")
  })
})
```

---

## `app/utils/__tests__/formatDate.test.ts`

Verificar a existência de `formatDate.ts` antes de implementar:

```bash
cat app/utils/formatDate.ts
```

Se exportar funções de formatação, implementar testes similares:

```typescript
import { formatDate } from "@/utils/formatDate"

describe("formatDate", () => {
  it("formata data no padrão dd/MM/yyyy", () => {
    const date = new Date("2025-05-26T12:00:00Z")
    // ajustar conforme a assinatura real da função
    expect(typeof formatDate(date.toISOString())).toBe("string")
  })
})
```

---

## Verificação

```bash
npx jest app/utils/__tests__/appCategories.test.ts --verbose
```

Saída esperada:
```
PASS app/utils/__tests__/appCategories.test.ts
  getAppCategory
    categorias conhecidas pelo package name
      ✓ classifica Instagram como social
      ✓ classifica Facebook como social
      ✓ classifica WhatsApp como social
      ✓ classifica Netflix como entertainment
      ✓ retorna 'other' para package desconhecido
      ✓ retorna 'other' para string vazia
    override com nativeCategory
      ✓ usa nativeCategory quando válida e diferente de 'other'
      ...
```

---

## Resultado Esperado

- 100% dos casos de `getAppCategory` cobertos.
- Confirmar que a lógica de fallback (nativeCategory → package lookup → 'other') está correta.
- Estes testes sobreviverão ao commit 08 (Strategy Pattern para categorização).
