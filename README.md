# Pandora - Frontend

Interface web do **Pandora**, uma aplicação desenvolvida para simplificar a análise, a associação e o cruzamento de dados de arquivos CSV e XLSX.

O projeto busca reduzir tarefas manuais realizadas em planilhas, oferecendo uma interface para visualizar dados, configurar operações e consultar resultados antes da exportação.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- pnpm

## Desenvolvimento da interface

A interface inicial foi criada com o auxílio do **Figma Make** e posteriormente ajustada diretamente no código-fonte.

O frontend utiliza React e TypeScript e foi organizado para se comunicar com a API do backend do Pandora, responsável pelo processamento dos arquivos e pelas operações de dados.

## Funcionalidades

A interface contempla o fluxo de trabalho do Pandora, incluindo:

- Seleção e envio de arquivos CSV e XLSX;
- Visualização e análise dos dados carregados;
- Identificação e associação de colunas entre arquivos;
- Configuração de operações de cruzamento de dados;
- Visualização prévia dos resultados;
- Preparação dos dados para exportação.

A disponibilidade de cada operação depende da implementação atual do frontend e da integração com o backend.

## Requisitos

Antes de executar o projeto, tenha instalado:

- Node.js — versão compatível com a configuração do projeto;
- pnpm — gerenciador de pacotes utilizado no projeto;
- Backend do Pandora — necessário para utilizar as funcionalidades que dependem da API.

O arquivo `.mise.toml` contém a configuração de versão das ferramentas do ambiente de desenvolvimento.

## Instalação

Clone o repositório e acesse a pasta do projeto:

```bash
git clone <URL_DO_REPOSITORIO>
cd frontend_pandora
```

Instale as dependências:

```bash
pnpm install
```

Substitua `<URL_DO_REPOSITORIO>` pelo endereço real do repositório Git.

## Configuração

Configure a URL da API do backend conforme o ambiente de execução.

Se o projeto utilizar a variável `VITE_API_BASE_URL`, crie um arquivo `.env` na raiz do frontend:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

A URL acima é um exemplo para execução local. Ajuste-a conforme a configuração real do backend.

**Importante:** confira no código-fonte qual variável de ambiente é utilizada antes de criar ou alterar essa configuração. Não inclua credenciais, tokens ou outros segredos no repositório.

## Execução em desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

O terminal exibirá o endereço local para acessar a aplicação no navegador.

## Build de produção

Para verificar a compilação e gerar os arquivos de produção:

```bash
pnpm build
```

Os arquivos gerados ficam no diretório `dist/`, conforme a configuração do Vite.

Para visualizar a versão compilada localmente:

```bash
pnpm preview
```

## Verificação de tipos

Para verificar os tipos TypeScript, caso o projeto esteja configurado com o compilador TypeScript:

```bash
pnpm exec tsc --noEmit
```

## Integração com o backend

O frontend depende do backend do Pandora para realizar as operações de processamento e cruzamento dos dados.

Para utilizar o fluxo completo da aplicação:

1. Configure e inicie o backend.
2. Configure a URL da API no frontend.
3. Inicie o frontend em modo de desenvolvimento.
4. Acesse a aplicação pelo navegador e teste o fluxo de trabalho.

Consulte a documentação do backend para obter instruções de instalação, configuração e execução da API.

## Estrutura do projeto

A estrutura pode variar conforme a evolução do projeto. Os principais arquivos e diretórios incluem:

- `src/` — código-fonte da interface;
- `public/` — arquivos públicos, quando utilizados;
- `.figma/make/` — arquivos de configuração e integração utilizados pelo ambiente Figma Make;
- `package.json` — dependências e scripts;
- `pnpm-lock.yaml` — registro das versões resolvidas das dependências;
- `vite.config.ts` — configuração do Vite;
- `.mise.toml` — configuração do ambiente de desenvolvimento;
- `.env.example` — exemplo de variáveis de ambiente, quando disponibilizado.

## Segurança

- Não versione arquivos `.env` que contenham configurações privadas ou credenciais.
- Mantenha o `.env.example` sem valores secretos.
- Não exponha tokens, senhas ou chaves de API no código-fonte.
- Utilize HTTPS e configurações apropriadas ao ambiente ao publicar a aplicação.

## Status do projeto

O Pandora está em desenvolvimento. A interface e suas integrações são validadas progressivamente conforme a implementação das funcionalidades do backend e do frontend.
