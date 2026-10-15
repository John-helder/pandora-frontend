export type StepId = "import" | "inspect" | "relate" | "join" | "transform" | "review" | "export"

export type JoinKind = "inner" | "left" | "right" | "full"

export interface ConfirmedJoinAssociation {
  source_dataset_id: string
  target_dataset_id: string
  source_key_column: string
  target_key_column: string
  confirmed: true
}

export interface DatasetJoinRequest {
  source_dataset_id: string
  target_dataset_id: string
  source_key_column: string
  target_key_column: string
  join_type: JoinKind
}

export interface DatasetJoinResponse {
  join_type: JoinKind
  source_dataset_id: string
  source_key_column: string
  target_dataset_id: string
  target_key_column: string
  result_dataset_id: string
  rows: number
  columns: number
  column_names: string[]
  column_types: Record<string, string>
  max_join_rows: number
  data: Record<string, unknown>[]
}

export interface DatasetColumn {
  name: string
  type: string
  missing?: number
}

export interface Dataset {
  id: string
  name: string
  sheet?: string | null
  rows: number
  columns: DatasetColumn[]
  sample: string[][]
}

export interface Operation {
  id: string
  type: string
  detail: string
}

export interface ApiErrorShape {
  status: number
  message: string
  code?: string
}

export interface SessionResponse {
  session_id: string
  status: string
  created_at: string
  expires_at: string
}

export interface UploadedDataset {
  id: string
  name: string
  format: string
  size: number
}

export interface UploadFilesResponse {
  files: UploadedDataset[]
}

export interface DatasetMetadata {
  id: string
  name: string
  format: string
  size: number
  sheet_name: string | null
  rows: number
  columns: number
  column_names: string[]
  column_types: Record<string, string>
  has_nulls: boolean
  is_derived: boolean
}

export interface DatasetCollectionResponse {
  datasets: DatasetMetadata[]
}

export interface ColumnProfile {
  name: string
  type: string
  nulls: number
  unique: number
  duplicates: number
  samples: unknown[]
  statistics: Record<string, number | null>
}

export interface DatasetProfile {
  dataset_id: string
  filename: string
  format: string
  sheet_name: string | null
  rows: number
  columns: number
  fields: ColumnProfile[]
}

export interface MatchingOptions {
  trim: boolean
  normalize_whitespace: boolean
  lowercase: boolean
  remove_accents: boolean
}

export interface ColumnMatch {
  source_dataset_id: string
  source_column: string
  target_dataset_id: string
  target_column: string
  source_type: string
  target_type: string
  type_compatible: boolean
  source_valid_values: number
  target_valid_values: number
  source_distinct_values: number
  target_distinct_values: number
  shared_distinct_values: number
  overlap_ratio: number | null
  strategy: string
  status: string
  recommended: boolean
  minimum_shared_distinct_values: number
  evidence: string
  warnings: string[]
}

export interface ColumnMatchingResponse {
  comparisons: ColumnMatch[]
  truncated: boolean
  max_column_pair_comparisons: number
  max_columns_per_dataset: number
}

export interface ValueMatch {
  normalized_value: unknown
  source_original_examples: unknown[]
  target_original_examples: unknown[]
  source_count: number
  target_count: number
  ambiguous: boolean
}

export interface ValueMatchingResponse {
  source_dataset_id: string
  source_column: string
  target_dataset_id: string
  target_column: string
  source_type: string
  target_type: string
  strategy: string
  source_rules_applied: string[]
  target_rules_applied: string[]
  source_valid_values: number
  target_valid_values: number
  matches: ValueMatch[]
  truncated: boolean
  max_results: number
}

export interface ProcessingSession extends SessionResponse {
  datasets: DatasetMetadata[]
  upload_complete: boolean
}
