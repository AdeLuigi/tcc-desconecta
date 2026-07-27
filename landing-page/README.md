# Desconecta — Landing Page

Landing page do aplicativo Desconecta, desenvolvida em React + Vite.

## Pré-requisitos

- Node.js 18+
- npm ou yarn

## Instalação

```bash
cd landing-page
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173)

## Build para produção

```bash
npm run build
```

Os arquivos estáticos ficam em `dist/`. Pode ser hospedado em qualquer CDN ou serviço de hospedagem estática (Netlify, Vercel, GitHub Pages, Firebase Hosting etc.).

## Preview da build

```bash
npm run preview
```

## Estrutura

```
src/
├── main.jsx            # Ponto de entrada React
├── index.css           # Todos os estilos globais + variáveis CSS
├── App.jsx             # Componente raiz com todas as seções
└── components/
    ├── Navbar.jsx      # Navegação fixa com menu hamburger
    ├── Hero.jsx        # Seção hero com mockup de telefone
    ├── Features.jsx    # Grade de 6 funcionalidades
    ├── HowItWorks.jsx  # 4 passos de uso
    ├── Stats.jsx       # Resultados e avaliação do teste piloto
    ├── Screenshots.jsx # Mockups CSS das 4 telas do app
    ├── Download.jsx    # CTA de download
    ├── About.jsx       # Sobre o projeto e equipe
    ├── Contact.jsx     # Informações de contato
    └── Footer.jsx      # Rodapé com links
```

## Links relevantes

- **APK Android**: https://drive.google.com/file/d/18fTsQKklQliBatZ4C3pdckIpQ0L-OiJn/view
- **GitHub**: https://github.com/adeLuigi/tcc-desconecta
- **Contato**: {felipejac, adeluigi, silvana}@ic.ufrj.br
