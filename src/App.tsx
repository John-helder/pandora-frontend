import {
  ChangeEvent,
  DragEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  Dataset,
  ColumnMatch,
  DatasetMetadata,
  DatasetProfile,
  ConfirmedJoinAssociation,
  DatasetJoinResponse,
  JoinKind,
  Operation,
  ProcessingSession,
  StepId,
  ValueMatchingResponse,
} from "./types";

import {
  ApiError,
  analyzeColumnMatches,
  createSession,
  deleteSession,
  executeDatasetJoin,
  getDatasets,
  getDatasetProfile,
  matchColumnValues,
  uploadFiles,
} from "./services/api";

type IconName =
  | "arrow"
  | "back"
  | "check"
  | "chevron"
  | "columns"
  | "download"
  | "file"
  | "filter"
  | "grid"
  | "info"
  | "link"
  | "lock"
  | "plus"
  | "refresh"
  | "rows"
  | "search"
  | "settings"
  | "sparkle"
  | "trash"
  | "upload"
  | "warning"
  | "x";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    back: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
    check: <path d="m5 12 4 4L19 7" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    columns: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    filter: <path d="M4 5h16l-6 7v5l-4 2v-7Z" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: <><path d="M20 7h-6V1" /><path d="M4 17h6v6" /><path d="M20 7a9 9 0 0 0-15.5-3M4 17a9 9 0 0 0 15.5 3" /></>,
    rows: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="2" cy="6" r=".5" /><circle cx="2" cy="12" r=".5" /><circle cx="2" cy="18" r=".5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    sparkle: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4Z" /><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7Z" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    warning: <><path d="M12 3 2.8 20h18.4Z" /><path d="M12 9v4M12 17h.01" /></>,
    x: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const steps: { id: StepId; short: string; label: string }[] = [
  { id: "import", short: "1", label: "Adicionar arquivos" },
  { id: "inspect", short: "2", label: "Conferir os dados" },
  { id: "relate", short: "3", label: "Relacionar colunas" },
  { id: "join", short: "4", label: "Cruzar tabelas" },
  { id: "transform", short: "5", label: "Organizar resultado" },
  { id: "review", short: "6", label: "Conferir resultado" },
  { id: "export", short: "7", label: "Baixar planilha" },
];

const customers: Dataset = {
  id: "clientes-demo",
  name: "clientes_abril.xlsx",
  sheet: "Clientes",
  rows: 248,
  columns: [
    { name: "ID_CLIENTE", type: "Texto", missing: 0 },
    { name: "NOME", type: "Texto", missing: 0 },
    { name: "CIDADE", type: "Texto", missing: 3 },
    { name: "UF", type: "Texto", missing: 0 },
    { name: "SEGMENTO", type: "Texto", missing: 8 },
  ],
  sample: [
    ["CLI-001", "Mercado Horizonte", "Campinas", "SP", "Varejo"],
    ["CLI-002", "Café do Centro", "São Paulo", "SP", "Alimentação"],
    ["CLI-003", "Papelaria Aurora", "Curitiba", "PR", "Varejo"],
    ["CLI-004", "Studio Norte", "Belo Horizonte", "MG", "Serviços"],
    ["CLI-005", "Casa Verde", "Florianópolis", "SC", "Varejo"],
  ],
};

const orders: Dataset = {
  id: "pedidos-demo",
  name: "pedidos_abril.csv",
  rows: 391,
  columns: [
    { name: "COD_CLIENTE", type: "Texto", missing: 2 },
    { name: "PEDIDO", type: "Texto", missing: 0 },
    { name: "DATA", type: "Data", missing: 0 },
    { name: "VALOR", type: "Número decimal", missing: 0 },
    { name: "STATUS", type: "Texto", missing: 0 },
  ],
  sample: [
    ["CLI-001", "PV-1048", "03/04/2025", "R$ 1.249,90", "Entregue"],
    ["CLI-002", "PV-1051", "04/04/2025", "R$ 480,00", "Entregue"],
    ["CLI-003", "PV-1058", "05/04/2025", "R$ 2.780,50", "Em trânsito"],
    ["CLI-001", "PV-1062", "08/04/2025", "R$ 329,90", "Entregue"],
    ["CLI-008", "PV-1070", "09/04/2025", "R$ 890,00", "Pendente"],
  ],
};

const result: Dataset = {
  id: "resultado-demo",
  name: "resultado_consolidado",
  rows: 389,
  columns: [
    { name: "Cliente", type: "Texto", missing: 0 },
    { name: "Cidade", type: "Texto", missing: 3 },
    { name: "UF", type: "Texto", missing: 0 },
    { name: "Pedido", type: "Texto", missing: 0 },
    { name: "Data", type: "Data", missing: 0 },
    { name: "Valor", type: "Número decimal", missing: 0 },
    { name: "Status", type: "Texto", missing: 0 },
  ],
  sample: [
    ["Mercado Horizonte", "Campinas", "SP", "PV-1048", "03/04/2025", "R$ 1.249,90", "Entregue"],
    ["Café do Centro", "São Paulo", "SP", "PV-1051", "04/04/2025", "R$ 480,00", "Entregue"],
    ["Papelaria Aurora", "Curitiba", "PR", "PV-1058", "05/04/2025", "R$ 2.780,50", "Em trânsito"],
    ["Mercado Horizonte", "Campinas", "SP", "PV-1062", "08/04/2025", "R$ 329,90", "Entregue"],
  ],
};

const initialOperations: Operation[] = [
  { id: "op-1", type: "Selecionar colunas", detail: "7 colunas escolhidas" },
  { id: "op-2", type: "Renomear colunas", detail: "NOME → Cliente · PEDIDO → Pedido" },
  { id: "op-3", type: "Ordenar dados", detail: "Data, mais recente primeiro" },
];

function Button({ children, icon, variant = "primary", disabled, onClick, type = "button", className = "" }: {
  children: ReactNode; icon?: IconName; variant?: "primary" | "secondary" | "ghost" | "danger"; disabled?: boolean; onClick?: () => void; type?: "button" | "submit"; className?: string;
}) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant} ${className}`}>{icon && <Icon name={icon} />}{children}</button>;
}

function Notice({ tone = "info", title, children }: { tone?: "info" | "warning" | "success"; title: string; children: ReactNode }) {
  return <div className={`notice notice-${tone}`}><span className="notice-icon"><Icon name={tone === "warning" ? "warning" : tone === "success" ? "check" : "info"} /></span><div><strong>{title}</strong><p>{children}</p></div></div>;
}

function Header({ onHome, demo }: { onHome: () => void; demo: boolean }) {
  return <header className="app-header">
    <button className="brand" onClick={onHome} aria-label="Voltar à página inicial"><span className="brand-mark"><span /></span><span>Pandora</span></button>
    <div className="header-meta">
      {demo && <span className="demo-badge"><Icon name="sparkle" size={14} /> Modo demonstração</span>}
      <span className="privacy"><Icon name="lock" size={15} /> Sessão temporária</span>
    </div>
  </header>;
}

function Home({
  onStart,
  onDemo,
  error,
}: {
  onStart: () => void;
  onDemo: () => void;
  error?: string;
}) {
  return <div className="home">
    <Header onHome={() => undefined} demo={false} />
    <main>
      {error && <Notice tone="warning" title="Não foi possível encerrar a sessão">{error}</Notice>}
      <section className="hero">
        <div className="eyebrow"><span /> Dados organizados, decisões mais claras</div>
        <h1>Suas planilhas,<br /><em>finalmente conectadas.</em></h1>
        <p>Importe arquivos, relacione informações e construa um resultado confiável — sem fórmulas complexas ou trabalho manual.</p>
        <div className="hero-actions">
          <Button icon="plus" onClick={onStart}>Novo processamento</Button>
          <Button variant="secondary" icon="sparkle" onClick={onDemo}>Explorar demonstração</Button>
        </div>
        <div className="formats"><Icon name="file" size={16} /><span>Arquivos CSV e Excel (.xlsx)</span><i /><Icon name="lock" size={16} /><span>Seus arquivos não são armazenados no navegador</span></div>
      </section>
      <section className="workflow-preview" aria-label="Como funciona">
        <div className="section-heading"><span>Um caminho simples</span><h2>Do arquivo ao resultado, passo a passo</h2></div>
        <div className="flow-cards">
          {[
            ["01", "Adicione", "Selecione as planilhas que deseja combinar.", "upload"],
            ["02", "Confira", "Veja a estrutura e identifique possíveis problemas.", "search"],
            ["03", "Relacione", "Confirme como as informações se conectam.", "link"],
            ["04", "Organize", "Escolha colunas, filtros e transformações.", "settings"],
          ].map(([n, title, text, icon]) => <article className="flow-card" key={n}><span className="flow-number">{n}</span><span className="flow-icon"><Icon name={icon as IconName} /></span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>
      <section className="recent">
        <div><h2>Trabalhos recentes</h2><p>Seus processamentos aparecem aqui enquanto a sessão estiver ativa.</p></div>
        <div className="empty-inline"><span><Icon name="rows" /></span><div><strong>Nenhum trabalho nesta sessão</strong><p>Os processamentos são temporários e não ficam salvos após o encerramento.</p></div></div>
      </section>
    </main>
  </div>;
}

function Stepper({ current, onGo }: { current: StepId; onGo: (id: StepId) => void }) {
  const currentIndex = steps.findIndex((step) => step.id === current);
  return <aside className="stepper">
    <div className="stepper-title">Seu processamento</div>
    <nav aria-label="Etapas do processamento">
      {steps.map((step, index) => {
        const status = index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
        return <button key={step.id} onClick={() => index <= currentIndex && onGo(step.id)} disabled={index > currentIndex} className={`step ${status}`}>
          <span className="step-dot">{status === "complete" ? <Icon name="check" size={14} /> : step.short}</span>
          <span>{step.label}</span>
        </button>;
      })}
    </nav>
    <div className="stepper-help"><Icon name="info" size={17} /><p>Você pode voltar às etapas concluídas sem perder suas configurações.</p></div>
  </aside>;
}

function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="page-title"><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>;
}

function FileCard({ name, meta, state, onRemove }: { name: string; meta: string; state: "ready" | "waiting"; onRemove?: () => void }) {
  return <div className="file-card"><span className="file-type">{name.endsWith(".csv") ? "CSV" : "XLS"}</span><div className="file-main"><strong>{name}</strong><span>{meta}</span></div><span className={`file-state ${state}`}>{state === "ready" ? <><Icon name="check" size={14} /> Pronto</> : "Aguardando API"}</span>{onRemove && <button className="icon-button" onClick={onRemove} aria-label={`Remover ${name}`}><Icon name="trash" /></button>}</div>;
}

function ImportPage({
  demo,
  onNext,
  session,
  onSessionChange,
}: {
  demo: boolean;
  onNext: () => void;
  session: ProcessingSession | null;
  onSessionChange: (session: ProcessingSession | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [invalid, setInvalid] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const uploaded = session?.upload_complete ?? false;
  const uploadedDatasets =
    session?.datasets.filter((dataset) => !dataset.is_derived) ?? [];
  const uploadLocked =
    uploaded || uploadedDatasets.length > 0;

  function receive(list: FileList | null) {
    if (!list || loading || uploadLocked) return;

    const next = Array.from(list);
    const bad = next.find(
      (file) => !/\.(csv|xlsx)$/i.test(file.name),
    );

    if (bad) {
      setInvalid(`"${bad.name}" não é um arquivo CSV ou XLSX.`);
      return;
    }

    setInvalid("");
    setError("");
    setSuccess("");

    setFiles((current) => {
      const existing = new Set(
        current.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
      );

      const unique = next.filter(
        (file) =>
          !existing.has(
            `${file.name}:${file.size}:${file.lastModified}`,
          ),
      );

      return [...current, ...unique];
    });
  }

  async function handleUpload() {
    if (files.length === 0 || loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let activeSession = session;
      if (!activeSession) {
        const created = await createSession();
        activeSession = {
          ...created,
          datasets: [],
          upload_complete: false,
        };
        onSessionChange(activeSession);
      }

      if (!activeSession.upload_complete) {
        try {
          await uploadFiles(activeSession.session_id, files);
        } catch (uploadError) {
          const currentDatasets = await getDatasets(activeSession.session_id);
          const uploadWasAccepted =
            currentDatasets.datasets.length === files.length &&
            files.every((file) =>
              currentDatasets.datasets.some(
                (dataset) =>
                  dataset.name === file.name && dataset.size === file.size,
              ),
            );

          if (!uploadWasAccepted) {
            if (currentDatasets.datasets.length > 0) {
              onSessionChange({
                ...activeSession,
                datasets: currentDatasets.datasets,
              });
              throw new ApiError({
                status: 409,
                code: "UPLOAD_STATE_MISMATCH",
                message:
                  "A sessão contém arquivos diferentes dos selecionados. Volte ao início para encerrar esta sessão antes de tentar novamente.",
              });
            }

            throw uploadError;
          }
        }

        activeSession = { ...activeSession, upload_complete: true };
        onSessionChange(activeSession);
      }

      const response = await getDatasets(activeSession.session_id);
      activeSession = { ...activeSession, datasets: response.datasets };
      onSessionChange(activeSession);

      setSuccess(
        `${response.datasets.length} conjunto(s) de dados identificado(s). ` +
        "O envio foi concluído e os metadados foram recebidos da API.",
      );
      if (!demo) onNext();
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "SESSION_NOT_FOUND" || err.code === "SESSION_EXPIRED")
      ) {
        onSessionChange(null);
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar os arquivos. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="Etapa 1 de 7"
        title="Adicione seus arquivos"
        description="Escolha duas ou mais planilhas que você deseja relacionar. Os arquivos originais permanecem intactos."
      />

      {demo ? (
        <Notice
          tone="info"
          title="Você está explorando uma demonstração"
        >
          Usamos dois arquivos fictícios para apresentar o fluxo.
          Nenhum dado real foi enviado.
        </Notice>
      ) : (
        <Notice
          tone="info"
          title="Importação de arquivos"
        >
          Selecione arquivos CSV ou XLSX. Eles serão enviados para
          uma sessão temporária do Pandora.
        </Notice>
      )}

      <section
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event: DragEvent) => {
          event.preventDefault();
          setDragging(false);
          receive(event.dataTransfer.files);
        }}
      >
        <input
          ref={input}
          type="file"
          multiple
          accept=".csv,.xlsx"
          disabled={loading || uploadLocked}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            receive(event.target.files);
            event.target.value = "";
          }}
        />

        <span className="drop-icon">
          <Icon name="upload" size={25} />
        </span>

        <h2>Arraste suas planilhas para cá</h2>
        <p>ou selecione os arquivos no seu computador</p>

        <Button
          variant="secondary"
          disabled={loading || demo || uploadLocked}
          onClick={() => input.current?.click()}
        >
          Escolher arquivos
        </Button>

        <small>
          Formatos aceitos: CSV e XLSX
        </small>
      </section>

      {invalid && (
        <div className="field-error">
          <Icon name="warning" size={16} />
          {invalid}
        </div>
      )}

      {error && (
        <Notice tone="warning" title="Não foi possível importar">
          {error}
        </Notice>
      )}

      {success && (
        <Notice tone="success" title="Importação concluída">
          {success}
        </Notice>
      )}

      <section className="files-section">
        <div className="section-row">
          <div>
            <h2>Arquivos selecionados</h2>
            <p>
              {demo
                ? "2 arquivos demonstrativos"
                : session?.upload_complete && uploadedDatasets.length > 0
                  ? `${uploadedDatasets.length} ${
                      uploadedDatasets.length === 1 ? "arquivo importado" : "arquivos importados"
                    }`
                : `${files.length} ${
                    files.length === 1 ? "arquivo" : "arquivos"
                  }`}
            </p>
          </div>
        </div>

        {demo ? (
          <div className="file-list">
            <FileCard
              name="clientes_abril.xlsx"
              meta="Planilha: Clientes · 248 linhas · dados fictícios"
              state="ready"
            />
            <FileCard
              name="pedidos_abril.csv"
              meta="391 linhas · dados fictícios"
              state="ready"
            />
          </div>
        ) : session?.upload_complete && uploadedDatasets.length > 0 ? (
          <div className="file-list">
            {uploadedDatasets.map((dataset) => (
              <FileCard
                key={dataset.id}
                name={dataset.name}
                meta={`${dataset.sheet_name ? `Planilha: ${dataset.sheet_name} · ` : ""}${dataset.rows} linhas · ${dataset.columns} colunas`}
                state="ready"
              />
            ))}
          </div>
        ) : files.length > 0 ? (
          <div className="file-list">
            {files.map((file, index) => {
              const dataset = session?.datasets.find(
                (item) => item.name === file.name && item.size === file.size,
              );
              const metadata = dataset
                ? `${dataset.rows} linhas · ${dataset.columns} colunas · ${(dataset.size / 1024).toFixed(1)} KB`
                : `${(file.size / 1024).toFixed(1)} KB`;

              return (
                <FileCard
                  key={`${file.name}-${index}`}
                  name={file.name}
                  meta={metadata}
                  state={uploaded ? "ready" : "waiting"}
                  onRemove={
                    loading || uploadLocked
                      ? undefined
                      : () => {
                          setFiles((all) =>
                            all.filter((_, i) => i !== index),
                          );
                          setSuccess("");
                          setError("");
                        }
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="mini-empty">
            Nenhum arquivo selecionado ainda.
          </div>
        )}
      </section>

      <FooterActions>
        <span>
          {demo
            ? "Explore o fluxo com dados fictícios."
            : uploaded
              ? "Importação validada. As próximas etapas serão conectadas aos dados reais."
              : "Selecione os arquivos e envie para validar a conexão."}
        </span>

        {demo ? (
          <Button onClick={onNext}>
            Conferir os dados <Icon name="arrow" />
          </Button>
        ) : (
          <Button
            onClick={handleUpload}
            disabled={
              files.length === 0 ||
              loading ||
              (uploadLocked && uploadedDatasets.length > 0)
            }
          >
            {loading
              ? uploaded
                ? "Atualizando dados..."
                : "Enviando arquivos..."
              : uploaded && uploadedDatasets.length > 0
                ? "Arquivos enviados"
                : uploaded
                  ? "Atualizar dados"
                : "Enviar arquivos"}
            {!loading && <Icon name="arrow" />}
          </Button>
        )}
      </FooterActions>
    </>
  );
}

type DatasetTabItem =
  | Pick<Dataset, "id" | "name" | "sheet" | "rows" | "columns">
  | DatasetMetadata;

function DatasetTabs({
  datasets,
  active,
  onChange,
}: {
  datasets: DatasetTabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="dataset-tabs">
      {datasets.map((dataset) => {
        const columnCount = Array.isArray(dataset.columns)
          ? dataset.columns.length
          : dataset.columns;
        const sheetName = "sheet_name" in dataset
          ? dataset.sheet_name
          : dataset.sheet;

        return (
          <button
            key={dataset.id}
            className={active === dataset.id ? "active" : ""}
            onClick={() => onChange(dataset.id)}
          >
            <Icon name="file" size={16} />
            {sheetName ? `${dataset.name} · ${sheetName}` : dataset.name}
            <span>
              {dataset.rows} linhas · {columnCount} colunas
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DataTable({ dataset }: { dataset: Dataset }) {
  return <div className="table-shell">
    <div className="table-tools"><div className="table-stat"><Icon name="rows" size={16} /><strong>{dataset.rows}</strong> linhas</div><div className="table-stat"><Icon name="columns" size={16} /><strong>{dataset.columns.length}</strong> colunas</div><div className="table-search"><Icon name="search" size={16} /><span>Buscar nesta amostra</span></div><span className="sample-tag">Amostra demonstrativa</span></div>
    <div className="table-scroll"><table><thead><tr>{dataset.columns.map((column) => <th key={column.name}><span>{column.name}</span><small>{column.type}</small></th>)}</tr></thead><tbody>{dataset.sample.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
    <div className="table-footer"><span>Exibindo {dataset.sample.length} linhas de amostra</span><div><button disabled>Anterior</button><strong>1</strong><button disabled>Próxima</button></div></div>
  </div>;
}

function DemoInspectPage({ onNext }: { onNext: () => void }) {
  const [active, setActive] = useState(customers.id);
  const dataset = active === customers.id ? customers : orders;
  return <>
    <PageTitle eyebrow="Etapa 2 de 7" title="Confira a estrutura dos dados" description="Veja como as colunas foram identificadas antes de relacionar as planilhas." />
    <DatasetTabs datasets={[customers, orders]} active={active} onChange={setActive} />
    <DataTable dataset={dataset} />
    <div className="quality-grid">
      <div className="quality-card"><span className="quality-icon good"><Icon name="check" /></span><div><strong>Estrutura reconhecida</strong><p>Os nomes e tipos das colunas foram identificados na demonstração.</p></div></div>
      <div className="quality-card"><span className="quality-icon warn"><Icon name="warning" /></span><div><strong>Valores ausentes</strong><p>{dataset.id === customers.id ? "11 ocorrências em 2 colunas." : "2 ocorrências em COD_CLIENTE."} Verifique antes de continuar.</p></div></div>
      <div className="quality-card muted"><span className="quality-icon"><Icon name="info" /></span><div><strong>Duplicidades</strong><p>Uma análise definitiva depende do perfil calculado pela API.</p></div></div>
    </div>
    <FooterActions><span>Você poderá revisar estas tabelas novamente.</span><Button onClick={onNext}>Relacionar colunas <Icon name="arrow" /></Button></FooterActions>
  </>;
}

function InspectionTable({ dataset }: { dataset: DatasetMetadata }) {
  return (
    <div className="table-shell">
      <div className="table-tools">
        <div className="table-stat">
          <Icon name="rows" size={16} />
          <strong>{dataset.rows}</strong> linhas
        </div>
        <div className="table-stat">
          <Icon name="columns" size={16} />
          <strong>{dataset.columns}</strong> colunas
        </div>
        <span className="sample-tag">Metadados reais</span>
      </div>
      {dataset.column_names.length > 0 ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {dataset.column_names.map((name) => (
                  <th key={name}>
                    <span>{name}</span>
                    <small>{dataset.column_types[name] ?? "Tipo não informado"}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={dataset.column_names.length}>
                  A API não disponibiliza uma amostra de linhas nesta etapa.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mini-empty">
          A API não informou nomes de colunas para este conjunto de dados.
        </div>
      )}
      <div className="table-footer">
        <span>
          {dataset.sheet_name
            ? `Planilha: ${dataset.sheet_name}`
            : `Arquivo ${dataset.format.toUpperCase()}`}
        </span>
      </div>
    </div>
  );
}

function RealInspectPage({
  session,
  onNext,
  preferredDatasetId,
}: {
  session: ProcessingSession | null;
  onNext: () => void;
  preferredDatasetId: string;
}) {
  const [active, setActive] = useState(
    preferredDatasetId || session?.datasets[0]?.id || "",
  );
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const dataset =
    session?.datasets.find((item) => item.id === active) ??
    session?.datasets[0];

  useEffect(() => {
    if (session?.datasets.some((item) => item.id === preferredDatasetId)) {
      setActive(preferredDatasetId);
    }
  }, [preferredDatasetId, session?.datasets]);

  useEffect(() => {
    if (!dataset) {
      setProfile(null);
      setProfileError("");
      setProfileLoading(false);
      return;
    }

    let current = true;
    setProfile(null);
    setProfileError("");
    setProfileLoading(true);

    getDatasetProfile(dataset.id)
      .then((result) => {
        if (current) setProfile(result);
      })
      .catch((error: unknown) => {
        if (!current) return;
        setProfileError(
          error instanceof ApiError
            ? error.message
            : "Não foi possível carregar o perfil das colunas.",
        );
      })
      .finally(() => {
        if (current) setProfileLoading(false);
      });

    return () => {
      current = false;
    };
  }, [dataset?.id, refresh]);

  const nullCount =
    profile?.fields.reduce((total, field) => total + field.nulls, 0) ?? 0;
  const nullColumns =
    profile?.fields.filter((field) => field.nulls > 0).length ?? 0;
  const duplicateCount =
    profile?.fields.reduce((total, field) => total + field.duplicates, 0) ?? 0;
  const duplicateColumns =
    profile?.fields.filter((field) => field.duplicates > 0).length ?? 0;

  if (!session || session.datasets.length === 0) {
    return (
      <>
        <PageTitle
          eyebrow="Etapa 2 de 7"
          title="Confira a estrutura dos dados"
          description="Veja como as colunas foram identificadas antes de relacionar as planilhas."
        />
        <Notice tone="warning" title="Nenhum conjunto de dados nesta sessão">
          Volte à etapa de importação e envie os arquivos novamente.
        </Notice>
        <div className="mini-empty">
          Os metadados dos arquivos não estão disponíveis nesta sessão.
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle
        eyebrow="Etapa 2 de 7"
        title="Confira a estrutura dos dados"
        description="Veja como as colunas foram identificadas antes de relacionar as planilhas."
      />
      <DatasetTabs
        datasets={session.datasets}
        active={dataset?.id ?? ""}
        onChange={setActive}
      />
      {dataset && <InspectionTable dataset={dataset} />}
      {profileLoading && (
        <Notice tone="info" title="Analisando as colunas">
          Carregando o perfil real deste conjunto de dados.
        </Notice>
      )}
      {profileError && (
        <Notice tone="warning" title="Perfil das colunas indisponível">
          {profileError}
          {" "}
          <button
            className="btn btn-secondary"
            onClick={() => setRefresh((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </Notice>
      )}
      {profile && (
        <div className="quality-grid">
          <div className="quality-card">
            <span className="quality-icon good">
              <Icon name="check" />
            </span>
            <div>
              <strong>Estrutura reconhecida</strong>
              <p>
                {profile.rows} linhas e {profile.columns} colunas no perfil da API.
              </p>
            </div>
          </div>
          <div className="quality-card">
            <span className={`quality-icon ${nullCount > 0 ? "warn" : "good"}`}>
              <Icon name={nullCount > 0 ? "warning" : "check"} />
            </span>
            <div>
              <strong>Valores ausentes</strong>
              <p>
                {nullCount === 0
                  ? "Nenhum valor ausente foi identificado."
                  : `${nullCount} valores ausentes em ${nullColumns} colunas.`}
              </p>
            </div>
          </div>
          <div className="quality-card">
            <span className="quality-icon">
              <Icon name={duplicateCount > 0 ? "warning" : "info"} />
            </span>
            <div>
              <strong>Valores duplicados</strong>
              <p>
                {duplicateCount === 0
                  ? "Nenhum valor duplicado foi identificado nas colunas."
                  : `${duplicateCount} ocorrências duplicadas em ${duplicateColumns} colunas.`}
              </p>
            </div>
          </div>
        </div>
      )}
      <FooterActions>
        <span>
          Os metadados e o perfil exibidos foram consultados da API.
        </span>
        <Button onClick={onNext}>
          Relacionar colunas <Icon name="arrow" />
        </Button>
      </FooterActions>
    </>
  );
}

function InspectPage({
  demo,
  session,
  onNext,
  preferredDatasetId,
}: {
  demo: boolean;
  session: ProcessingSession | null;
  onNext: () => void;
  preferredDatasetId: string;
}) {
  return demo
    ? <DemoInspectPage onNext={onNext} />
    : <RealInspectPage
        session={session}
        onNext={onNext}
        preferredDatasetId={preferredDatasetId}
      />;
}

function SelectBox({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: string[]; onChange?: (value: string) => void; disabled?: boolean }) {
  return <label className="select-field"><span>{label}</span><select value={value} disabled={disabled} onChange={(e) => onChange?.(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><Icon name="chevron" size={16} /></label>;
}

const normalizationOptions = [
  { label: "Remover espaços extras", key: "trim" },
  { label: "Reduzir espaços repetidos", key: "normalize_whitespace" },
  { label: "Converter para minúsculas", key: "lowercase" },
  { label: "Ignorar acentuação", key: "remove_accents" },
] as const;

const demoNormalizationLabels: string[] = normalizationOptions.map(({ label }) => label);

function DemoRelatePage({ onNext }: { onNext: () => void }) {
  const [left, setLeft] = useState("ID_CLIENTE");
  const [right, setRight] = useState("COD_CLIENTE");
  const [normalizations, setNormalizations] = useState<string[]>([
    demoNormalizationLabels[0],
  ]);
  function toggle(item: string) {
    setNormalizations((items) =>
      items.includes(item)
        ? items.filter((value) => value !== item)
        : [...items, item],
    );
  }
  return <>
    <PageTitle eyebrow="Etapa 3 de 7" title="Como as tabelas se relacionam?" description="Confirme quais colunas representam a mesma informação nos dois arquivos." />
    <Notice tone="warning" title="Sugestão da demonstração — confirme antes de continuar">Nomes e exemplos parecem compatíveis, mas semelhança não é prova. Esta associação só será usada após sua confirmação.</Notice>
    <section className="relation-card">
      <div className="relation-head"><div><span className="suggestion"><Icon name="sparkle" size={14} /> Sugestão encontrada</span><h2>Identificador do cliente</h2></div><span className="confidence">Demonstração</span></div>
      <div className="relation-builder">
        <div className="source-block"><span className="source-file"><Icon name="file" size={16} /> clientes_abril.xlsx</span><SelectBox label="Coluna da primeira tabela" value={left} options={customers.columns.map((column) => column.name)} onChange={setLeft} /><div className="examples"><span>Exemplos</span><code>CLI-001</code><code>CLI-002</code><code>CLI-003</code></div></div>
        <span className="link-node"><Icon name="link" size={20} /></span>
        <div className="source-block"><span className="source-file"><Icon name="file" size={16} /> pedidos_abril.csv</span><SelectBox label="Coluna da segunda tabela" value={right} options={orders.columns.map((column) => column.name)} onChange={setRight} /><div className="examples"><span>Exemplos</span><code>CLI-001</code><code>CLI-002</code><code>CLI-003</code></div></div>
      </div>
      <div className="evidence"><div><strong>Valores comparáveis</strong><span>Disponível apenas na demonstração</span></div><div><strong>Correspondências</strong><span>O percentual real virá da API</span></div><div><strong>Atenção</strong><span>Há chaves repetidas em pedidos</span></div></div>
    </section>
    <section className="normalization">
      <div><h2>Preparar valores para comparação</h2><p>Estas opções afetam somente a comparação. Os arquivos originais não são alterados.</p></div>
      <div className="check-list">{demoNormalizationLabels.map((item) => <label key={item}><input type="checkbox" checked={normalizations.includes(item)} onChange={() => toggle(item)} /><span><Icon name="check" size={13} /></span>{item}</label>)}</div>
      <div className="preview-transform"><span>Prévia</span><code> CLI-001 </code><Icon name="arrow" size={16} /><code>CLI-001</code></div>
    </section>
    <FooterActions><span>A associação será usada para configurar o cruzamento.</span><Button onClick={onNext}>Confirmar associação <Icon name="arrow" /></Button></FooterActions>
  </>;
}

function displayMatchingValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || typeof value !== "object") return String(value);

  try {
    return JSON.stringify(value);
  } catch {
    return "[valor indisponível]";
  }
}

function matchingStatusLabel(status: string): string {
  switch (status) {
    case "candidate":
      return "Candidata";
    case "insufficient_evidence":
      return "Evidência insuficiente";
    case "incompatible_types":
      return "Tipos incompatíveis";
    default:
      return "Resultado da API";
  }
}

function RealRelatePage({
  session,
  association,
  onAssociationChange,
  onConfirm,
}: {
  session: ProcessingSession | null;
  association: ConfirmedJoinAssociation | null;
  onAssociationChange: (association: ConfirmedJoinAssociation | null) => void;
  onConfirm: (association: ConfirmedJoinAssociation) => void;
}) {
  const datasets = session?.datasets ?? [];
  const [sourceDatasetId, setSourceDatasetId] = useState(
    association?.source_dataset_id ?? datasets[0]?.id ?? "",
  );
  const [targetDatasetId, setTargetDatasetId] = useState(
    association?.target_dataset_id ?? datasets[1]?.id ?? "",
  );
  const sourceDataset =
    datasets.find((dataset) => dataset.id === sourceDatasetId) ?? datasets[0];
  const targetDataset =
    datasets.find((dataset) => dataset.id === targetDatasetId) ?? datasets[1];
  const sourceColumns = sourceDataset?.column_names ?? [];
  const targetColumns = targetDataset?.column_names ?? [];
  const [sourceColumn, setSourceColumn] = useState(
    association?.source_key_column ?? sourceColumns[0] ?? "",
  );
  const [targetColumn, setTargetColumn] = useState(
    association?.target_key_column ?? targetColumns[0] ?? "",
  );
  const [normalizations, setNormalizations] = useState({
    trim: true,
    normalize_whitespace: true,
    lowercase: true,
    remove_accents: true,
  });
  const [comparison, setComparison] = useState<ColumnMatch | null>(null);
  const [comparisonEmpty, setComparisonEmpty] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  const [values, setValues] = useState<ValueMatchingResponse | null>(null);
  const [valuesLoading, setValuesLoading] = useState(false);
  const [valuesError, setValuesError] = useState("");

  function updateSourceDataset(datasetId: string) {
    setSourceDatasetId(datasetId);
    const dataset = datasets.find((item) => item.id === datasetId);
    setSourceColumn(dataset?.column_names[0] ?? "");
    setComparison(null);
    setComparisonEmpty(false);
    setValues(null);
    setComparisonError("");
    setValuesError("");
    onAssociationChange(null);
  }

  function updateTargetDataset(datasetId: string) {
    setTargetDatasetId(datasetId);
    const dataset = datasets.find((item) => item.id === datasetId);
    setTargetColumn(dataset?.column_names[0] ?? "");
    setComparison(null);
    setComparisonEmpty(false);
    setValues(null);
    setComparisonError("");
    setValuesError("");
    onAssociationChange(null);
  }

  function toggleNormalization(key: keyof typeof normalizations) {
    setNormalizations((current) => ({ ...current, [key]: !current[key] }));
    setComparison(null);
    setComparisonEmpty(false);
    setValues(null);
    setComparisonError("");
    setValuesError("");
    onAssociationChange(null);
  }

  async function analyze() {
    if (!session || !sourceDataset || !targetDataset || !sourceColumn || !targetColumn) {
      return;
    }

    setComparison(null);
    setComparisonEmpty(false);
    setValues(null);
    setComparisonError("");
    setValuesError("");
    setComparisonLoading(true);

    try {
      const response = await analyzeColumnMatches(session.session_id, {
        source_dataset_id: sourceDataset.id,
        target_dataset_id: targetDataset.id,
        source_columns: [sourceColumn],
        target_columns: [targetColumn],
        ...normalizations,
      });
      const result = response.comparisons[0] ?? null;
      setComparison(result);
      setComparisonEmpty(result === null);
    } catch (error) {
      setComparisonError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível analisar essas colunas.",
      );
    } finally {
      setComparisonLoading(false);
    }
  }

  async function compareValues() {
    if (!session || !sourceDataset || !targetDataset || !comparison) return;

    setValues(null);
    setValuesError("");
    setValuesLoading(true);

    try {
      const response = await matchColumnValues(session.session_id, {
        source_dataset_id: sourceDataset.id,
        source_column: comparison.source_column,
        target_dataset_id: targetDataset.id,
        target_column: comparison.target_column,
        ...normalizations,
      });
      setValues(response);
    } catch (error) {
      setValuesError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível consultar os valores correspondentes.",
      );
    } finally {
      setValuesLoading(false);
    }
  }

  function confirmAssociation() {
    if (
      !canAnalyze ||
      !comparison?.type_compatible ||
      !sourceDataset ||
      !targetDataset
    ) {
      return;
    }
    onConfirm({
      source_dataset_id: sourceDataset.id,
      target_dataset_id: targetDataset.id,
      source_key_column: sourceColumn,
      target_key_column: targetColumn,
      confirmed: true,
    });
  }

  if (!session || datasets.length === 0) {
    return (
      <>
        <PageTitle
          eyebrow="Etapa 3 de 7"
          title="Como as tabelas se relacionam?"
          description="Selecione colunas dos conjuntos de dados importados para analisar possíveis correspondências."
        />
        <Notice tone="warning" title="Nenhum conjunto de dados disponível">
          Volte à importação e envie pelo menos dois arquivos para comparar
          colunas nesta sessão.
        </Notice>
      </>
    );
  }

  const canAnalyze =
    datasets.length > 1 &&
    sourceDataset !== undefined &&
    targetDataset !== undefined &&
    sourceDataset.id !== targetDataset.id &&
    sourceColumn.length > 0 &&
    targetColumn.length > 0;

  return (
    <>
      <PageTitle
        eyebrow="Etapa 3 de 7"
        title="Como as tabelas se relacionam?"
        description="Selecione colunas para consultar possíveis correspondências calculadas pela API."
      />
      {datasets.length < 2 && (
        <Notice tone="warning" title="É necessário importar outro conjunto">
          A sessão contém apenas um conjunto de dados. Importe pelo menos dois
          arquivos para analisar relações entre colunas.
        </Notice>
      )}
      <section className="relation-card">
        <div className="relation-head">
          <div>
            <span className="suggestion">
              <Icon name="sparkle" size={14} />
              {comparison ? "Resultado da API" : "Análise de colunas"}
            </span>
            <h2>
              {comparison
                ? `${comparison.source_column} ↔ ${comparison.target_column}`
                : "Selecione conjuntos e colunas"}
            </h2>
          </div>
          <span className="confidence">
            {comparison
              ? comparison.recommended
                ? "Recomendada"
                : "Sem recomendação"
              : "Sessão real"}
          </span>
        </div>
        <div className="relation-builder">
          <div className="source-block">
            <span className="source-file">
              <Icon name="file" size={16} />
              {sourceDataset?.name ?? "Conjunto não disponível"}
              {sourceDataset?.sheet_name
                ? ` · ${sourceDataset.sheet_name}`
                : ""}
            </span>
            <label className="select-field">
              <span>Primeiro conjunto de dados</span>
              <select
                value={sourceDataset?.id ?? ""}
                onChange={(event) => updateSourceDataset(event.target.value)}
                disabled={datasets.length === 0 || comparisonLoading || valuesLoading}
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                    {dataset.sheet_name ? ` · ${dataset.sheet_name}` : ""}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={16} />
            </label>
            <SelectBox
              label="Coluna da primeira tabela"
              value={sourceColumns.includes(sourceColumn) ? sourceColumn : ""}
              options={sourceColumns}
              disabled={comparisonLoading || valuesLoading}
              onChange={(value) => {
                setSourceColumn(value);
                setComparison(null);
                setComparisonEmpty(false);
                setValues(null);
                setComparisonError("");
                setValuesError("");
                onAssociationChange(null);
              }}
            />
            {sourceColumn && (
              <div className="examples">
                <span>Tipo</span>
                <code>{sourceDataset?.column_types[sourceColumn] ?? "Não informado"}</code>
              </div>
            )}
          </div>
          <span className="link-node">
            <Icon name="link" size={20} />
          </span>
          <div className="source-block">
            <span className="source-file">
              <Icon name="file" size={16} />
              {targetDataset?.name ?? "Conjunto não disponível"}
              {targetDataset?.sheet_name
                ? ` · ${targetDataset.sheet_name}`
                : ""}
            </span>
            <label className="select-field">
              <span>Segundo conjunto de dados</span>
              <select
                value={targetDataset?.id ?? ""}
                onChange={(event) => updateTargetDataset(event.target.value)}
                disabled={datasets.length < 2 || comparisonLoading || valuesLoading}
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                    {dataset.sheet_name ? ` · ${dataset.sheet_name}` : ""}
                  </option>
                ))}
              </select>
              <Icon name="chevron" size={16} />
            </label>
            <SelectBox
              label="Coluna da segunda tabela"
              value={targetColumns.includes(targetColumn) ? targetColumn : ""}
              options={targetColumns}
              disabled={comparisonLoading || valuesLoading}
              onChange={(value) => {
                setTargetColumn(value);
                setComparison(null);
                setComparisonEmpty(false);
                setValues(null);
                setComparisonError("");
                setValuesError("");
                onAssociationChange(null);
              }}
            />
            {targetColumn && (
              <div className="examples">
                <span>Tipo</span>
                <code>{targetDataset?.column_types[targetColumn] ?? "Não informado"}</code>
              </div>
            )}
          </div>
        </div>
        {comparison && (
          <div className="evidence">
            <div>
              <strong>Valores distintos em comum</strong>
              <span>{comparison.shared_distinct_values}</span>
            </div>
            <div>
              <strong>Sobreposição</strong>
              <span>
                {comparison.overlap_ratio === null
                  ? "Indisponível"
                  : new Intl.NumberFormat("pt-BR", {
                      style: "percent",
                      maximumFractionDigits: 1,
                    }).format(comparison.overlap_ratio)}
              </span>
            </div>
            <div>
              <strong>Evidência</strong>
              <span>{comparison.evidence}</span>
            </div>
          </div>
        )}
      </section>

      <section className="normalization">
        <div>
          <h2>Preparar valores para comparação</h2>
          <p>
            Estas opções são enviadas à API e afetam somente a comparação. Os
            arquivos originais não são alterados.
          </p>
        </div>
        <div className="check-list">
          {normalizationOptions.map(({ label, key }) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={normalizations[key]}
                onChange={() => toggleNormalization(key)}
                disabled={comparisonLoading || valuesLoading}
              />
              <span><Icon name="check" size={13} /></span>
              {label}
            </label>
          ))}
        </div>
        <div className="preview-transform">
          <span>
            A prévia de normalização não é calculada localmente. Os valores
            retornados pela API aparecem após a consulta de correspondências.
          </span>
        </div>
      </section>

      {comparisonLoading && (
        <Notice tone="info" title="Analisando as colunas">
          Consultando correspondências reais entre os conjuntos selecionados.
        </Notice>
      )}
      {comparisonError && (
        <Notice tone="warning" title="Não foi possível analisar as colunas">
          {comparisonError}
        </Notice>
      )}
      {comparisonEmpty && (
        <Notice tone="info" title="Nenhuma correspondência retornada">
          A API não retornou uma comparação para as colunas selecionadas.
        </Notice>
      )}
      {comparison && (
        <section className="normalization">
          <div className="section-row">
            <div>
              <h2>Resultado da comparação</h2>
              <p>
                {comparison.recommended
                  ? "A API recomenda avaliar esta relação com base nas evidências."
                  : `Resultado: ${matchingStatusLabel(comparison.status)}. A API não recomenda confirmar esta relação.`}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={compareValues}
              disabled={valuesLoading}
            >
              {valuesLoading ? "Consultando valores..." : "Consultar valores"}
            </Button>
          </div>
          <p>
            {comparison.source_valid_values} valores válidos no primeiro lado ·{" "}
            {comparison.target_valid_values} no segundo ·{" "}
            {comparison.source_distinct_values} e{" "}
            {comparison.target_distinct_values} valores distintos.
          </p>
          {comparison.warnings.length > 0 && (
            <ul>
              {comparison.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {valuesLoading && (
            <Notice tone="info" title="Consultando valores correspondentes">
              A API está comparando os valores normalizados das colunas.
            </Notice>
          )}
          {valuesError && (
            <Notice tone="warning" title="Valores indisponíveis">
              {valuesError}
            </Notice>
          )}
          {values && (
            <>
              <p>
                {values.matches.length} valores compartilhados retornados
                {values.truncated
                  ? ` (resultado limitado a ${values.max_results})`
                  : ""}
                .
              </p>
              {values.matches.length > 0 && (
                <div className="column-pills">
                  {values.matches.map((match, index) => (
                    <span
                      key={`${displayMatchingValue(match.normalized_value)}-${index}`}
                      title={`Valores originais: ${match.source_original_examples.map(displayMatchingValue).join(", ")} ↔ ${match.target_original_examples.map(displayMatchingValue).join(", ")}`}
                    >
                      <Icon
                        name={match.ambiguous ? "warning" : "check"}
                        size={14}
                      />
                      {displayMatchingValue(match.normalized_value)}
                      {" · "}
                      {match.source_count} / {match.target_count}
                    </span>
                  ))}
                </div>
              )}
              {values.matches.some((match) => match.ambiguous) && (
                <Notice tone="warning" title="Há valores ambíguos">
                  Pelo menos um valor aparece mais de uma vez em um dos lados.
                  A API sinalizou essa condição nas correspondências.
                </Notice>
              )}
            </>
          )}
        </section>
      )}

      <FooterActions>
        <span>
          A confirmação será mantida nesta sessão do navegador; o backend não
          persiste associações.
        </span>
        <div className="hero-actions">
          <Button
            onClick={analyze}
            disabled={!canAnalyze || comparisonLoading || valuesLoading}
          >
            {comparisonLoading ? "Analisando..." : "Analisar colunas"}
          </Button>
          {comparison && (
            <Button
              onClick={confirmAssociation}
              disabled={!canAnalyze || !comparison.type_compatible || comparisonLoading || valuesLoading}
            >
              Confirmar associação <Icon name="arrow" />
            </Button>
          )}
        </div>
      </FooterActions>
      {datasets.length > 1 && sourceDataset?.id === targetDataset?.id && (
        <Notice tone="warning" title="Selecione dois conjuntos diferentes">
          A análise exige dois conjuntos de dados distintos da sessão.
        </Notice>
      )}
    </>
  );
}

function RelatePage({
  demo,
  session,
  association,
  onAssociationChange,
  onConfirm,
  onNext,
}: {
  demo: boolean;
  session: ProcessingSession | null;
  association: ConfirmedJoinAssociation | null;
  onAssociationChange: (association: ConfirmedJoinAssociation | null) => void;
  onConfirm: (association: ConfirmedJoinAssociation) => void;
  onNext: () => void;
}) {
  return demo
    ? <DemoRelatePage onNext={onNext} />
    : <RealRelatePage
        session={session}
        association={association}
        onAssociationChange={onAssociationChange}
        onConfirm={(confirmedAssociation) => {
          onConfirm(confirmedAssociation);
          onNext();
        }}
      />;
}

const joinOptions: { id: JoinKind; title: string; text: string; visual: string }[] = [
  { id: "inner", title: "Somente correspondentes", text: "Mantém apenas registros encontrados nas duas tabelas.", visual: "overlap" },
  { id: "left", title: "Todos da primeira tabela", text: "Mantém todos os clientes, mesmo sem pedidos.", visual: "left" },
  { id: "right", title: "Todos da segunda tabela", text: "Mantém todos os pedidos, mesmo sem cliente.", visual: "right" },
  { id: "full", title: "Todos das duas tabelas", text: "Inclui também registros sem correspondência.", visual: "full" },
];

function DemoJoinPage({ onNext }: { onNext: () => void }) {
  const [kind, setKind] = useState<JoinKind>("left");
  return <>
    <PageTitle eyebrow="Etapa 4 de 7" title="Quais registros devem permanecer?" description="Escolha o tipo de cruzamento de acordo com o resultado que você precisa." />
    <div className="join-context"><div><span>Primeira tabela</span><strong>clientes_abril.xlsx</strong><small>ID_CLIENTE</small></div><span className="join-arrow"><Icon name="link" /></span><div><span>Segunda tabela</span><strong>pedidos_abril.csv</strong><small>COD_CLIENTE</small></div></div>
    <div className="join-grid">{joinOptions.map((option) => <button key={option.id} onClick={() => setKind(option.id)} className={`join-card ${kind === option.id ? "selected" : ""}`}>
      <span className="radio">{kind === option.id && <i />}</span><span className={`venn ${option.visual}`}><i /><i /></span><strong>{option.title}</strong><p>{option.text}</p>{kind === option.id && <small><Icon name="check" size={13} /> Selecionado</small>}
    </button>)}</div>
    <Notice tone="warning" title="Chaves repetidas podem gerar mais linhas">O arquivo de pedidos contém mais de um registro para alguns clientes. No resultado real, a API deverá informar o impacto antes da execução.</Notice>
    <section className="output-columns"><div><h2>Colunas no resultado</h2><p>As colunas poderão ser escolhidas e renomeadas na próxima etapa.</p></div><div className="column-pills">{[...customers.columns.slice(0, 3), ...orders.columns.slice(1)].map((col) => <span key={col.name}><Icon name="columns" size={14} />{col.name}</span>)}</div></section>
    <FooterActions><span>Tipo escolhido: <strong>{joinOptions.find((option) => option.id === kind)?.title}</strong></span><Button onClick={onNext}>Organizar resultado <Icon name="arrow" /></Button></FooterActions>
  </>;
}

function RealJoinPage({
  session,
  association,
  kind,
  onKindChange,
  result,
  onResult,
  onRefreshDatasets,
  onInspectResult,
}: {
  session: ProcessingSession | null;
  association: ConfirmedJoinAssociation | null;
  kind: JoinKind;
  onKindChange: (kind: JoinKind) => void;
  result: DatasetJoinResponse | null;
  onResult: (result: DatasetJoinResponse) => void;
  onRefreshDatasets: () => Promise<void>;
  onInspectResult: (datasetId: string) => void;
}) {
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const source = session?.datasets.find(
    (dataset) => dataset.id === association?.source_dataset_id,
  );
  const target = session?.datasets.find(
    (dataset) => dataset.id === association?.target_dataset_id,
  );
  const resultAvailableForInspection =
    result !== null &&
    (session?.datasets.some(
      (dataset) => dataset.id === result.result_dataset_id,
    ) ??
      false);
  const canJoin =
    Boolean(session) &&
    Boolean(association?.confirmed) &&
    Boolean(source) &&
    Boolean(target) &&
    !joining &&
    !result;

  async function executeJoin() {
    if (!canJoin || !session || !association) return;

    setJoining(true);
    setJoinError("");
    setRefreshError("");

    try {
      const joinResult = await executeDatasetJoin(session.session_id, {
        source_dataset_id: association.source_dataset_id,
        target_dataset_id: association.target_dataset_id,
        source_key_column: association.source_key_column,
        target_key_column: association.target_key_column,
        join_type: kind,
      });
      onResult(joinResult);
      try {
        await onRefreshDatasets();
      } catch {
        setRefreshError(
          "O JOIN foi salvo, mas a lista de datasets não pôde ser atualizada. Tente atualizar os dados da sessão.",
        );
      }
    } catch (error) {
      setJoinError(
        error instanceof ApiError
          ? error.message
          : "Não foi possível executar o JOIN.",
      );
    } finally {
      setJoining(false);
    }
  }

  async function retryDatasetRefresh() {
    setRefreshError("");
    try {
      await onRefreshDatasets();
    } catch {
      setRefreshError(
        "Não foi possível atualizar os datasets. Verifique a sessão e tente novamente.",
      );
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="Etapa 4 de 7"
        title="Quais registros devem permanecer?"
        description="Escolha o tipo de cruzamento para a associação confirmada."
      />
      {!association || !association.confirmed || !source || !target ? (
        <Notice tone="warning" title="Associação confirmada indisponível">
          Volte à etapa de relacionamento e confirme duas colunas de conjuntos
          de dados desta sessão.
        </Notice>
      ) : (
        <>
          <div className="join-context">
            <div>
              <span>Primeiro conjunto</span>
              <strong>{source.name}</strong>
              {source.sheet_name && <small>{source.sheet_name}</small>}
              <small>{association.source_key_column}</small>
            </div>
            <span className="join-arrow"><Icon name="link" /></span>
            <div>
              <span>Segundo conjunto</span>
              <strong>{target.name}</strong>
              {target.sheet_name && <small>{target.sheet_name}</small>}
              <small>{association.target_key_column}</small>
            </div>
          </div>
          <div className="join-grid">
            {joinOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onKindChange(option.id)}
                className={`join-card ${kind === option.id ? "selected" : ""}`}
              >
                <span className="radio">{kind === option.id && <i />}</span>
                <span className={`venn ${option.visual}`}><i /><i /></span>
                <strong>{option.title}</strong>
                <p>{option.text}</p>
                {kind === option.id && <small><Icon name="check" size={13} /> Selecionado</small>}
              </button>
            ))}
          </div>
          <Notice tone="info" title="Configuração pronta para a próxima etapa">
            O tipo <strong>{kind.toUpperCase()}</strong>, os IDs dos conjuntos e
            as colunas confirmadas serão enviados ao backend. O JOIN usa
            igualdade exata nos valores originais; a normalização usada no
            matching não é aplicada ao cruzamento.
          </Notice>
          <Notice tone="warning" title="Duplicidades podem multiplicar linhas">
            Quando a chave se repete nos dois conjuntos, cada ocorrência de um
            lado é combinada com todas as ocorrências do outro. O backend
            verifica o limite de linhas antes de materializar o resultado.
          </Notice>
          {joinError && (
            <Notice tone="warning" title="Não foi possível executar o JOIN">
              {joinError}
            </Notice>
          )}
          {result && (
            <>
              <div className="result-header">
                <div>
                  <span className="result-check"><Icon name="check" /></span>
                  <div>
                    <h2>JOIN concluído: {result.join_type.toUpperCase()}</h2>
                    <p>
                      Dataset derivado {result.result_dataset_id} registrado
                      nesta sessão.
                    </p>
                  </div>
                </div>
                <div className="result-metrics">
                  <span><strong>{result.rows}</strong> linhas</span>
                  <span><strong>{result.columns}</strong> colunas</span>
                </div>
              </div>
              <section className="output-columns">
                <div>
                  <h2>Colunas do resultado</h2>
                  <p>Nomes e tipos retornados pela API.</p>
                </div>
                <div className="column-pills">
                  {result.column_names.map((name) => (
                    <span key={name}>
                      <Icon name="columns" size={14} />
                      {name} · {result.column_types[name] ?? "Tipo não informado"}
                    </span>
                  ))}
                </div>
              </section>
              <div className="table-shell">
                <div className="table-tools">
                  <div className="table-stat">
                    <Icon name="rows" size={16} />
                    <strong>{result.rows}</strong> linhas no resultado
                  </div>
                  <div className="table-stat">
                    <Icon name="columns" size={16} />
                    <strong>{result.columns}</strong> colunas
                  </div>
                  <span className="sample-tag">Prévia real</span>
                </div>
                {result.data.length > 0 ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          {result.column_names.map((name) => (
                            <th key={name}>
                              <span>{name}</span>
                              <small>{result.column_types[name] ?? "Tipo não informado"}</small>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.slice(0, 10).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {result.column_names.map((name) => (
                              <td key={name}>
                                {row[name] === null || row[name] === undefined
                                  ? "—"
                                  : displayMatchingValue(row[name])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mini-empty">
                    O JOIN não encontrou linhas para as chaves selecionadas.
                  </div>
                )}
                <div className="table-footer">
                  <span>
                    Exibindo {Math.min(result.data.length, 10)} de {result.rows} linhas
                  </span>
                </div>
              </div>
              {refreshError && (
                <Notice tone="warning" title="Resultado salvo, lista desatualizada">
                  {refreshError}
                  {" "}
                  <button className="btn btn-secondary" onClick={retryDatasetRefresh}>
                    Atualizar lista
                  </button>
                </Notice>
              )}
              <FooterActions>
                <span>
                  {resultAvailableForInspection
                    ? "O dataset derivado está disponível na inspeção desta sessão."
                    : "Atualize a lista de datasets para inspecionar o resultado."}
                </span>
                <Button
                  disabled={!resultAvailableForInspection}
                  onClick={() => onInspectResult(result.result_dataset_id)}
                >
                  Inspecionar resultado <Icon name="arrow" />
                </Button>
              </FooterActions>
            </>
          )}
          <FooterActions>
            <span>
              {joining
                ? "Executando o cruzamento..."
                : `Limite configurado pelo servidor: ${result?.max_join_rows ?? "consultado durante a execução"} linhas.`}
            </span>
            <Button onClick={executeJoin} disabled={!canJoin}>
              {joining ? "Executando JOIN..." : result ? "JOIN executado" : "Executar JOIN"}
              {!joining && !result && <Icon name="arrow" />}
            </Button>
          </FooterActions>
        </>
      )}
    </>
  );
}

function TransformPage({ onNext }: { onNext: () => void }) {
  const [operations, setOperations] = useState(initialOperations);
  const [adding, setAdding] = useState(false);
  function remove(id: string) { setOperations((ops) => ops.filter((op) => op.id !== id)); }
  function add(type: string) {
    setOperations((ops) => [...ops, { id: `op-${Date.now()}`, type, detail: "Configuração demonstrativa — editar antes de executar" }]);
    setAdding(false);
  }
  return <>
    <PageTitle eyebrow="Etapa 5 de 7" title="Organize o resultado" description="Monte uma sequência de operações. A ordem define como os dados serão tratados." />
    <div className="transform-layout">
      <section className="pipeline">
        <div className="section-row"><div><h2>Sequência de operações</h2><p>{operations.length} de até 100 operações</p></div><Button variant="secondary" icon="plus" onClick={() => setAdding(!adding)}>Adicionar operação</Button></div>
        {adding && <div className="operation-menu"><span>Escolha uma operação</span>{["Filtrar registros", "Remover duplicidades", "Substituir valores", "Converter texto", "Formatar datas", "Arredondar valores"].map((item) => <button key={item} onClick={() => add(item)}><Icon name={item.includes("Filtrar") ? "filter" : "settings"} size={16} />{item}<Icon name="chevron" size={14} /></button>)}</div>}
        <div className="operation-list">{operations.map((operation, index) => <div className="operation" key={operation.id}><span className="drag-handle">⠿</span><span className="operation-number">{index + 1}</span><span className="operation-icon"><Icon name={operation.type.includes("Selecionar") ? "columns" : operation.type.includes("Ordenar") ? "rows" : "settings"} /></span><div><strong>{operation.type}</strong><p>{operation.detail}</p></div><button aria-label={`Editar ${operation.type}`}><Icon name="settings" size={17} /></button><button aria-label={`Remover ${operation.type}`} onClick={() => remove(operation.id)}><Icon name="trash" size={17} /></button></div>)}</div>
        {!operations.length && <div className="mini-empty">Adicione ao menos uma operação para organizar o resultado.</div>}
      </section>
      <aside className="transform-summary"><h3>Estrutura de saída</h3><div><span>Colunas selecionadas</span><strong>7</strong></div><div><span>Operações configuradas</span><strong>{operations.length}</strong></div><hr /><h4>Ordem das colunas</h4>{["Cliente", "Cidade", "UF", "Pedido", "Data", "Valor", "Status"].map((name, index) => <p key={name}><span>{index + 1}</span>{name}</p>)}<small><Icon name="info" size={15} /> A execução real depende do endpoint de pipeline.</small></aside>
    </div>
    <FooterActions><span>Você está editando a configuração. Nenhuma operação real foi executada.</span><Button onClick={onNext} disabled={!operations.length}>Conferir resultado <Icon name="arrow" /></Button></FooterActions>
  </>;
}

function ReviewPage({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return <>
    <PageTitle eyebrow="Etapa 6 de 7" title="Confira antes de finalizar" description="Revise a estrutura e os dados demonstrativos. Em uso real, estas informações virão do processamento da API." />
    <div className="result-header"><div><span className="result-check"><Icon name="check" /></span><div><h2>Prévia demonstrativa preparada</h2><p>Este resultado não foi gerado a partir de arquivos reais.</p></div></div><div className="result-metrics"><span><strong>389</strong> linhas</span><span><strong>7</strong> colunas</span></div></div>
    <DataTable dataset={result} />
    <div className="review-grid">
      <section className="summary-card"><h3>Operações configuradas</h3>{initialOperations.map((op, index) => <div key={op.id}><span><Icon name="check" size={13} /></span><p><strong>{index + 1}. {op.type}</strong><small>{op.detail}</small></p></div>)}</section>
      <section className="summary-card alerts"><h3>Pontos para conferir</h3><div><span className="amber"><Icon name="warning" size={14} /></span><p><strong>3 valores ausentes</strong><small>Na coluna Cidade, em dados demonstrativos.</small></p></div><div><span className="blue"><Icon name="info" size={14} /></span><p><strong>Registros sem correspondência</strong><small>A contagem real ainda não está disponível.</small></p></div></section>
    </div>
    <FooterActions><Button variant="secondary" icon="back" onClick={onBack}>Ajustar operações</Button><Button onClick={onNext}>Continuar para exportação <Icon name="arrow" /></Button></FooterActions>
  </>;
}

function ExportPage() {
  const [format, setFormat] = useState("XLSX");
  return <>
    <PageTitle eyebrow="Etapa 7 de 7" title="Tudo pronto para exportar" description="A exportação permanece desabilitada até que um endpoint real seja confirmado e testado." />
    <section className="export-card">
      <div className="export-art"><span><Icon name="download" size={30} /></span></div>
      <div className="export-content"><span className="demo-label">Resultado demonstrativo</span><h2>resultado_consolidado</h2><p>389 linhas · 7 colunas · dados fictícios</p>
        <div className="format-row"><span>Formato desejado</span><div>{["XLSX", "CSV"].map((item) => <button key={item} className={format === item ? "active" : ""} onClick={() => setFormat(item)}>{item === "XLSX" ? "Excel (.xlsx)" : "CSV (.csv)"}{format === item && <Icon name="check" size={14} />}</button>)}</div></div>
        <label className="name-field"><span>Nome do arquivo</span><div><input value="resultado_consolidado" readOnly /><span>.{format.toLowerCase()}</span></div></label>
        <Button icon="download" disabled className="download-button">Baixar planilha</Button>
        <div className="export-blocked"><Icon name="lock" size={15} />Download indisponível no modo demonstração. Nenhum arquivo real foi produzido.</div>
      </div>
    </section>
    <Notice tone="info" title="O que falta para habilitar a exportação">É necessário confirmar um endpoint de exportação, os formatos aceitos e o comportamento de download no backend FastAPI.</Notice>
  </>;
}

function FooterActions({ children }: { children: ReactNode }) {
  return <div className="footer-actions">{children}</div>;
}

function Workspace({
  demo,
  onHome,
  session,
  onSessionChange,
}: {
  demo: boolean;
  onHome: () => void;
  session: ProcessingSession | null;
  onSessionChange: (session: ProcessingSession | null) => void;
}) {
  const [current, setCurrent] = useState<StepId>("import");
  const [joinAssociation, setJoinAssociation] =
    useState<ConfirmedJoinAssociation | null>(null);
  const [joinKind, setJoinKind] = useState<JoinKind>("left");
  const [joinResult, setJoinResult] = useState<DatasetJoinResponse | null>(null);
  const [inspectionDatasetId, setInspectionDatasetId] = useState("");
  const index = steps.findIndex((step) => step.id === current);
  const next = () => setCurrent(steps[Math.min(index + 1, steps.length - 1)].id);
  const updateJoinAssociation = (association: ConfirmedJoinAssociation | null) => {
    setJoinAssociation(association);
    if (!association) setJoinResult(null);
  };
  const updateJoinKind = (kind: JoinKind) => {
    setJoinKind(kind);
    setJoinResult(null);
  };
  const refreshSessionDatasets = async () => {
    if (!session) throw new Error("Nenhuma sessão ativa.");
    const response = await getDatasets(session.session_id);
    onSessionChange({ ...session, datasets: response.datasets });
  };
  const content = useMemo(() => {
    if (current === "import") return <ImportPage demo={demo} onNext={next} session={session} onSessionChange={onSessionChange} />;
    if (current === "inspect") return <InspectPage demo={demo} session={session} onNext={next} preferredDatasetId={inspectionDatasetId} />;
    if (current === "relate") return <RelatePage
      demo={demo}
      session={session}
      association={joinAssociation}
      onAssociationChange={updateJoinAssociation}
      onConfirm={updateJoinAssociation}
      onNext={next}
    />;
    if (current === "join") return demo
      ? <DemoJoinPage onNext={next} />
      : <RealJoinPage
          session={session}
          association={joinAssociation}
          kind={joinKind}
          onKindChange={updateJoinKind}
          result={joinResult}
          onResult={setJoinResult}
          onRefreshDatasets={refreshSessionDatasets}
          onInspectResult={(datasetId) => {
            setInspectionDatasetId(datasetId);
            setCurrent("inspect");
          }}
        />;
    if (current === "transform") return <TransformPage onNext={next} />;
    if (current === "review") return <ReviewPage onNext={next} onBack={() => setCurrent("transform")} />;
    return <ExportPage />;
  }, [current, demo, session, onSessionChange, joinAssociation, joinKind, joinResult, inspectionDatasetId]);
  return <div className="workspace"><Header onHome={onHome} demo={demo} /><div className="workspace-body"><Stepper current={current} onGo={setCurrent} /><main className="content">{content}</main></div></div>;
}

export default function App() {
  const [view, setView] = useState<"home" | "real" | "demo">("home");
  const [session, setSession] = useState<ProcessingSession | null>(null);
  const [sessionCleanupError, setSessionCleanupError] = useState("");

  async function returnHome() {
    if (session) {
      try {
        await deleteSession(session.session_id);
        setSession(null);
        setSessionCleanupError("");
      } catch (error) {
        setSessionCleanupError(
          error instanceof ApiError
            ? error.message
            : "A sessão temporária não pôde ser encerrada.",
        );
        setSession(null);
        setView("home");
        return;
      }
    }

    setView("home");
  }

  if (view === "home") {
    return (
      <Home
        onStart={() => {
          setSessionCleanupError("");
          setView("real");
        }}
        onDemo={() => setView("demo")}
        error={sessionCleanupError || undefined}
      />
    );
  }

  return (
    <Workspace
      demo={view === "demo"}
      onHome={returnHome}
      session={session}
      onSessionChange={setSession}
    />
  );
}
