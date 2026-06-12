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

    it("retorna 'other' para package completamente desconhecido", () => {
      expect(getAppCategory("com.app.completamente.desconhecido.xyz")).toBe("other")
    })

    it("retorna 'other' para string vazia", () => {
      expect(getAppCategory("")).toBe("other")
    })
  })

  describe("override com nativeCategory", () => {
    it("usa nativeCategory quando é válida e diferente de 'other'", () => {
      expect(getAppCategory("com.unknown.app", "games")).toBe("games")
    })

    it("ignora nativeCategory 'other' e usa lookup pelo package name", () => {
      expect(getAppCategory("com.instagram.android", "other")).toBe("social")
    })

    it("ignora nativeCategory inválida e usa lookup pelo package name", () => {
      expect(getAppCategory("com.instagram.android", "invalid_category_xyz")).toBe("social")
    })

    it("retorna nativeCategory válida mesmo para package desconhecido", () => {
      expect(getAppCategory("com.unknown.app.xyz", "productivity")).toBe("productivity")
    })

    it("ignora nativeCategory quando é undefined e usa lookup", () => {
      expect(getAppCategory("com.whatsapp", undefined)).toBe("social")
    })
  })

  describe("consistência dos resultados", () => {
    it("retorna o mesmo resultado para chamadas repetidas com o mesmo input", () => {
      const first = getAppCategory("com.instagram.android")
      const second = getAppCategory("com.instagram.android")
      expect(first).toBe(second)
    })

    it("categorias retornadas são strings não-vazias", () => {
      const result = getAppCategory("com.instagram.android")
      expect(typeof result).toBe("string")
      expect(result.length).toBeGreaterThan(0)
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

  it("retorna string não-vazia para todas as categorias conhecidas", () => {
    const knownCategories = [
      "social",
      "entertainment",
      "streaming",
      "games",
      "productivity",
      "education",
      "photo",
      "news",
      "maps",
      "shopping",
      "other",
    ] as const

    knownCategories.forEach((cat) => {
      const label = getCategoryLabel(cat)
      expect(typeof label).toBe("string")
      expect(label.length).toBeGreaterThan(0)
    })
  })

  it("retorna 'Outros' para categoria inexistente", () => {
    expect(getCategoryLabel("nonexistent_category" as any)).toBe("Outros")
  })
})
