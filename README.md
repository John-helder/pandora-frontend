# Pandora - Frontend

Interface web do **Pandora**, uma aplicação desenvolvida para simplificar a análise, a associação e o cruzamento de dados de arquivos CSV e XLSX.

O objetivo é reduzir tarefas manuais em planilhas, permitindo que o usuário configure operações de dados e visualize os resultados antes de exportá-los.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- npm
- Node.js 22

## Desenvolvimento da interface

A interface inicial foi criada com o auxílio do **Figma Make** e posteriormente ajustada diretamente no código-fonte.

O frontend utiliza React e TypeScript e se comunica com o backend do Pandora por meio de uma API, responsável pelo processamento dos arquivos e pelas operações de dados.

## Funcionalidades

A interface foi desenvolvida para contemplar o fluxo de trabalho do Pandora, incluindo:

- Envio de arquivos CSV e XLSX;
- Visualização e análise dos dados carregados;
- Identificação e associação de colunas entre arquivos;
- Configuração de operações de cruzamento de dados;
- Pré-visualização dos resultados;
- Preparação dos dados para exportação.

A disponibilidade das funcionalidades depende da implementação atual e da integração com o backend.

## Requisitos

Antes de executar o projeto, instale:

- [Node.js 22](https://nodejs.org/)
- npm, incluído na instalação do Node.js;
- Backend do Pandora, necessário para utilizar as funcionalidades que dependem da API.

## Instalação

Clone o repositório:

```bash
git clone <URL_DO_REPOSITORIO>
```

Entre na pasta do projeto:

```bash
cd frontend_pandora
```

Instale as dependências:

```bash
npm install
```

Substitua `<URL_DO_REPOSITORIO>` pelo endereço real do repositório.

## Configuração

Configure a URL da API do backend conforme o ambiente de execução.

Se o código utilizar a variável `VITE_API_BASE_URL`, crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

O endereço acima é um exemplo para execução local. Ajuste-o conforme a configuração real do backend.

**Importante:** confirme no código-fonte qual variável de ambiente a aplicação utiliza. Não inclua senhas, tokens ou chaves privadas no repositório.

## Executar em desenvolvimento

Inicie o servidor local:

```bash
npm run dev
```

O terminal exibirá o endereço para acessar a aplicação pelo navegador.

## Build de produção

Gere os arquivos de produção:

```bash
npm run build
```

Os arquivos compilados serão gerados no diretório `dist/`, conforme a configuração do Vite.

Para visualizar localmente a versão compilada:

```bash
npm run preview
```

## Verificação de tipos

Para verificar os tipos TypeScript, caso o compilador esteja disponível nas dependências do projeto:

```bash
npx tsc --noEmit
```

## Integração com o backend

O frontend depende do backend do Pandora para executar as operações de processamento e cruzamento de dados.

Para testar a aplicação completa:

1. Instale e inicie o backend.
2. Configure a URL da API no frontend.
3. Inicie o frontend com `npm run dev`.
4. Acesse a aplicação pelo navegador.
5. Teste o fluxo de carregamento, associação e visualização dos dados.

Consulte a documentação do backend para obter as instruções de instalação, configuração e execução da API.

## Estrutura do projeto

Principais arquivos e diretórios:

- `src/` — código-fonte da interface;
- `src/App.tsx` — componente principal da aplicação;
- `src/services/api.ts` — comunicação com a API;
- `src/types.ts` — definições de tipos TypeScript;
- `public/` — arquivos públicos;
- `.figma/make/` — arquivos de configuração e integração do ambiente Figma Make;
- `package.json` — dependências e scripts do projeto;
- `package-lock.json` — registro das versões resolvidas das dependências;
- `vite.config.ts` — configuração do Vite;
- `tsconfig.json` — configuração do TypeScript;
- `.mise.toml` — configuração do ambiente de desenvolvimento, se utilizada.

## Segurança

- Não versione arquivos `.env` que contenham informações privadas.
- Mantenha o `.env.example` livre de credenciais reais.
- Não exponha tokens, senhas ou chaves de API no código-fonte.
- Utilize configurações apropriadas para o ambiente de produção.

## Status do projeto

O Pandora está em desenvolvimento. As funcionalidades e integrações são validadas progressivamente durante a implementação do frontend e do backend.

## Licença

A licença do projeto deverá ser definida conforme a estratégia de distribuição do Pandora.