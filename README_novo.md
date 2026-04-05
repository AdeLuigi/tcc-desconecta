# TCC Desconecta

> Aplicativo mobile para apoio ao TCC de Desconecta (UFRJ)

## Sobre o Projeto

Este projeto é um aplicativo React Native desenvolvido para auxiliar no controle de tempo de tela, foco e atividades, além de funcionalidades sociais como bate-papo e desafios. Utiliza Expo, Firebase e segue arquitetura modularizada.

## Instalação

1. **Clone o repositório:**

```bash
git clone <url-do-repositorio>
cd tcc-desconecta
```

2. **Instale as dependências:**

```bash
yarn install
# ou
npm install
```

3. **Configuração do Firebase:**

Adicione os arquivos `google-services.json` (Android) e `GoogleService-Info.plist` (iOS) nas pastas corretas conforme instruções do Firebase. Veja exemplos em `android/app/` e `ios/`.

4. **Configuração de ambiente:**

Edite os arquivos em `app/config/` conforme necessário para ambiente de desenvolvimento ou produção.

5. **Executando o app:**

```bash
yarn start
# ou
npm start
```

Abra o app no Expo Go (Android/iOS) ou rode em um simulador:

```bash
yarn android
yarn ios
```

## Build para Produção

Utilize o EAS para builds de produção:

```bash
yarn eas build -p android
yarn eas build -p ios
```

Consulte o arquivo `eas.json` para configurações de build.

## Estrutura do Projeto

- `app/` - Código-fonte principal do app
  - `components/` - Componentes reutilizáveis
  - `screens/` - Telas principais
  - `navigators/` - Navegação
  - `context/` - Contextos globais (ex: autenticação)
  - `services/` - Integrações externas (ex: Firebase)
  - `theme/` - Temas e estilos
  - `i18n/` - Internacionalização
  - `config/` - Configurações de ambiente
- `assets/` - Imagens e ícones
- `functions/` - Funções serverless (Firebase Functions)
- `test/` - Testes automatizados

## Testes

Execute os testes com:

```bash
yarn test
```

## Documentação

Consulte os arquivos `.md` na raiz do projeto para guias rápidos, regras de segurança e integrações.

## Contato

Para dúvidas ou contribuições, entre em contato com o responsável pelo projeto ou abra uma issue.
