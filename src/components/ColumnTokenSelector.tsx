import { useState, useId, useMemo } from "react"

export interface ColumnTokenSelectorProps {
  columns: string[]
  schema: Record<string, string>
  selectedColumns: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
  operationType: "SELECT" | "DROP" | "DEDUPLICATE"
  legend: string
  helperText?: string
}

export default function ColumnTokenSelector({
  columns,
  schema,
  selectedColumns,
  onChange,
  disabled = false,
  operationType,
  legend,
  helperText,
}: ColumnTokenSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputId = useId()

  const filteredColumns = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return columns
    return columns.filter((col) => col.toLowerCase().includes(term))
  }, [columns, searchTerm])

  const visibleUnselectedCount = useMemo(() => {
    return filteredColumns.filter((col) => !selectedColumns.includes(col))
      .length
  }, [filteredColumns, selectedColumns])

  const handleToggle = (column: string) => {
    if (disabled) return
    if (selectedColumns.includes(column)) {
      onChange(selectedColumns.filter((col) => col !== column))
    } else {
      onChange([...selectedColumns, column])
    }
  }

  const handleSelectVisible = () => {
    if (disabled) return
    const toAdd = filteredColumns.filter(
      (col) => !selectedColumns.includes(col),
    )
    if (toAdd.length === 0) return
    onChange([...selectedColumns, ...toAdd])
  }

  const handleClearSelection = () => {
    if (disabled || selectedColumns.length === 0) return
    onChange([])
  }

  const countLabel = useMemo(() => {
    const total = columns.length
    const selected = selectedColumns.length
    if (operationType === "DEDUPLICATE") {
      if (selected === 0) {
        return "Nenhuma chave (linha completa)"
      }
      return `${selected} de ${total} ${
        selected === 1 ? "chave selecionada" : "chaves selecionadas"
      }`
    }
    if (operationType === "DROP") {
      return `${selected} de ${total} para remover`
    }
    return `${selected} de ${total} para manter`
  }, [columns.length, selectedColumns.length, operationType])

  return (
    <fieldset className="token-selector" disabled={disabled}>
      <legend className="token-selector-legend">{legend}</legend>
      <div className="token-selector-header">
        <div className="token-selector-title">
          <span>{legend}</span>
          <span
            className={`token-count-badge ${
              selectedColumns.length > 0
                ? operationType === "DROP"
                  ? "has-selected-danger"
                  : "has-selected"
                : ""
            }`}
          >
            {countLabel}
          </span>
        </div>
        <div className="token-selector-toolbar">
          <div className="token-search-box">
            <span className="token-search-icon" aria-hidden="true">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </span>
            <input
              id={searchInputId}
              type="text"
              className="token-search-input"
              placeholder="Buscar coluna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={disabled}
              aria-label={`Buscar coluna em ${legend}`}
            />
            {searchTerm && (
              <button
                type="button"
                className="token-search-clear"
                onClick={() => setSearchTerm("")}
                disabled={disabled}
                aria-label="Limpar busca"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            className="token-action-btn"
            onClick={handleSelectVisible}
            disabled={
              disabled ||
              filteredColumns.length === 0 ||
              visibleUnselectedCount === 0
            }
            title={
              searchTerm
                ? "Selecionar todas as colunas visíveis no filtro atual"
                : "Selecionar todas as colunas"
            }
          >
            Selecionar todas as visíveis
          </button>
          <button
            type="button"
            className="token-action-btn"
            onClick={handleClearSelection}
            disabled={disabled || selectedColumns.length === 0}
            title="Limpar seleção de colunas"
          >
            Limpar seleção
          </button>
        </div>
      </div>

      <div
        className="token-scroll-area"
        role="group"
        aria-label={`Lista de colunas para ${legend}`}
        tabIndex={filteredColumns.length > 0 ? 0 : undefined}
      >
        {filteredColumns.length === 0 ? (
          <div className="token-empty-message">
            <span>
              Nenhuma coluna encontrada para &ldquo;{searchTerm}&rdquo;.
            </span>
            <button
              type="button"
              className="token-action-btn token-empty-clear-btn"
              onClick={() => setSearchTerm("")}
            >
              Limpar busca
            </button>
          </div>
        ) : (
          filteredColumns.map((column) => {
            const isSelected = selectedColumns.includes(column)
            const colType = schema[column] ?? "string"
            return (
              <button
                key={column}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`${column}, tipo ${colType}, ${
                  isSelected ? "selecionada" : "não selecionada"
                }`}
                disabled={disabled}
                onClick={() => handleToggle(column)}
                className={`toggle-token ${
                  isSelected
                    ? `selected selected-${operationType.toLowerCase()}`
                    : ""
                }`}
              >
                <span className="toggle-token-icon" aria-hidden="true">
                  {isSelected ? (
                    operationType === "DROP" ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="m5 12 4 4L19 7" />
                      </svg>
                    )
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      opacity="0.4"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                    </svg>
                  )}
                </span>
                <span className="toggle-token-name">{column}</span>
                <span className="toggle-token-type">{colType}</span>
              </button>
            )
          })
        )}
      </div>
      {helperText && <p className="token-helper-text">{helperText}</p>}
    </fieldset>
  )
}
