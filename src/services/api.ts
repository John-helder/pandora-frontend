import type {
  ApiErrorShape,
  ColumnMatchingResponse,
  DatasetCollectionResponse,
  DatasetJoinRequest,
  DatasetJoinResponse,
  DatasetProfile,
  MatchingOptions,
  ProcessingSession,
  SessionResponse,
  UploadFilesResponse,
  ValueMatchingResponse,
} from "../types"

function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  const baseUrl =
    configuredUrl || (import.meta.env.DEV ? "http://127.0.0.1:8000/api/v1" : "")

  if (!baseUrl) {
    throw new Error(
      "Configure VITE_API_BASE_URL com a URL pública da API, incluindo /api/v1.",
    )
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(baseUrl)
  } catch {
    throw new Error("VITE_API_BASE_URL deve ser uma URL absoluta válida.")
  }

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error(
      "VITE_API_BASE_URL deve usar HTTP(S) e não pode conter credenciais, query ou fragmento.",
    )
  }

  if (
    !import.meta.env.DEV &&
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    parsedUrl.protocol !== "https:"
  ) {
    throw new Error(
      "Uma aplicação HTTPS precisa usar uma VITE_API_BASE_URL também em HTTPS.",
    )
  }

  return parsedUrl.toString().replace(/\/+$/, "")
}

const API_BASE_URL = getApiBaseUrl()

interface BackendErrorPayload {
  error: {
    code?: string
    message?: string
  }
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor({ status, message, code }: ApiErrorShape) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

function safeMessage(status: number): string {
  if (status === 404) {
    return "A sessão ou o recurso solicitado não foi encontrado."
  }

  if (status === 413) {
    return "O arquivo ou processamento ultrapassa o limite permitido."
  }

  if (status === 422) {
    return "Não foi possível validar os dados enviados."
  }

  if (status >= 500) {
    return "O servidor encontrou um problema. Tente novamente em instantes."
  }

  return "Não foi possível concluir a solicitação."
}

function isErrorPayload(value: unknown): value is BackendErrorPayload {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false
  }

  const error = value.error
  return typeof error === "object" && error !== null
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    })
  } catch (error) {
    throw new ApiError({
      status: 0,
      message:
        "Não foi possível acessar a API. Verifique a URL, a disponibilidade do servidor e a origem permitida em PANDORA_CORS_ORIGINS.",
      code: error instanceof TypeError ? "NETWORK_OR_CORS_ERROR" : undefined,
    })
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const backendError = isErrorPayload(payload) ? payload.error : undefined

    throw new ApiError({
      status: response.status,
      message:
        typeof backendError?.message === "string"
          ? backendError.message
          : safeMessage(response.status),
      code:
        typeof backendError?.code === "string" ? backendError.code : undefined,
    })
  }

  if (response.status === 204) {
    return undefined as T
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError({
      status: response.status,
      message: "A API retornou uma resposta inválida.",
      code: "INVALID_RESPONSE",
    })
  }
}

export async function createSession(): Promise<SessionResponse> {
  return apiRequest<SessionResponse>("/sessions", {
    method: "POST",
  })
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiRequest<void>(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  })
}

export async function uploadFiles(
  sessionId: string,
  files: File[],
): Promise<UploadFilesResponse> {
  const formData = new FormData()

  for (const file of files) {
    formData.append("files", file)
  }

  return apiRequest<UploadFilesResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/files`,
    {
      method: "POST",
      body: formData,
    },
  )
}

export async function getDatasets(
  sessionId: string,
): Promise<DatasetCollectionResponse> {
  return apiRequest<DatasetCollectionResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/datasets`,
  )
}

export async function getDatasetProfile(
  datasetId: string,
): Promise<DatasetProfile> {
  return apiRequest<DatasetProfile>(
    `/datasets/${encodeURIComponent(datasetId)}/profile`,
  )
}

export async function analyzeColumnMatches(
  sessionId: string,
  payload: MatchingOptions & {
    source_dataset_id: string
    target_dataset_id: string
    source_columns: string[]
    target_columns: string[]
  },
): Promise<ColumnMatchingResponse> {
  return apiRequest<ColumnMatchingResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/matching/analyze`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )
}

export async function matchColumnValues(
  sessionId: string,
  payload: MatchingOptions & {
    source_dataset_id: string
    source_column: string
    target_dataset_id: string
    target_column: string
  },
): Promise<ValueMatchingResponse> {
  return apiRequest<ValueMatchingResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/matching/values`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )
}

export async function executeDatasetJoin(
  sessionId: string,
  payload: DatasetJoinRequest,
): Promise<DatasetJoinResponse> {
  return apiRequest<DatasetJoinResponse>(
    `/sessions/${encodeURIComponent(sessionId)}/joins`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )
}
