import { zipSync } from "fflate"

import type { ProcessedPipelineResult } from "../types"

const nullExportValue = "\\N"

const excelRowLimit = 1_048_576

const excelColumnLimit = 16_384

function assertExportableResult(result: ProcessedPipelineResult): void {
  if (
    result.data.length !== result.rows ||
    result.column_names.length !== result.columns ||
    result.column_names.some(
      (name) => typeof result.column_types[name] !== "string",
    )
  ) {
    throw new Error(
      "O resultado não possui dimensões ou metadados consistentes.",
    )
  }

  if (
    result.data.some((row) =>
      result.column_names.some(
        (name) => !Object.prototype.hasOwnProperty.call(row, name),
      ),
    )
  ) {
    throw new Error(
      "Uma ou mais linhas não contêm todas as colunas do resultado.",
    )
  }
}

function exportValue(value: unknown): string {
  if (value === null) return nullExportValue

  if (typeof value === "string") {
    return value === nullExportValue ? `\\${value}` : value
  }

  if (typeof value === "number" || typeof value === "boolean") {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error(
        "O resultado contém um número que não pode ser exportado.",
      )
    }

    return String(value)
  }

  const serialized = JSON.stringify(value)

  if (serialized === undefined) {
    throw new Error("O resultado contém um valor que não pode ser exportado.")
  }

  return serialized
}

function csvField(value: unknown): string {
  let text = exportValue(value)

  if (typeof value === "string" && /^[\t\r ]*[=+\-@]/.test(value)) {
    text = `'${text}`
  }

  return `"${text.replace(/"/g, '""')}"`
}

export function createCsvBlob(result: ProcessedPipelineResult): Blob {
  assertExportableResult(result)

  const lines = [
    result.column_names.map(csvField).join(","),

    ...result.data.map((row) =>
      result.column_names.map((name) => csvField(row[name])).join(","),
    ),
  ]

  return new Blob(["\uFEFF", `${lines.join("\r\n")}\r\n`], {
    type: "text/csv;charset=utf-8",
  })
}

function xmlEscape(value: string): string {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0

    if (
      (codePoint < 0x20 &&
        codePoint !== 0x09 &&
        codePoint !== 0x0a &&
        codePoint !== 0x0d) ||
      (codePoint >= 0xd800 && codePoint <= 0xdfff) ||
      codePoint === 0xfffe ||
      codePoint === 0xffff
    ) {
      throw new Error(
        "O resultado contém caracteres incompatíveis com o formato XLSX.",
      )
    }
  }

  return value

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&apos;")
}

function columnAddress(index: number): string {
  let address = ""

  let value = index + 1

  while (value > 0) {
    const remainder = (value - 1) % 26

    address = String.fromCharCode(65 + remainder) + address

    value = Math.floor((value - 1) / 26)
  }

  return address
}

function excelDateSerial(value: string): number | null {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return date.getTime() / 86_400_000 + 25_569
}

function isDateColumn(type: string): boolean {
  return /^date(time)?(?:\b|\()/i.test(type)
}

function xlsxCell(
  address: string,

  value: unknown,

  columnType?: string,
): string {
  if (value === null) {
    return `<c r="${address}" t="inlineStr"><is><t>${xmlEscape(nullExportValue)}</t></is></c>`
  }

  if (typeof value === "string") {
    const text = value === nullExportValue ? `\\${value}` : value

    if (columnType && isDateColumn(columnType)) {
      const serial = excelDateSerial(text)

      if (serial !== null) {
        return `<c r="${address}" s="1"><v>${serial}</v></c>`
      }
    }

    return `<c r="${address}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(
        "O resultado contém um número que não pode ser exportado.",
      )
    }

    return `<c r="${address}"><v>${value}</v></c>`
  }

  if (typeof value === "boolean") {
    return `<c r="${address}" t="b"><v>${value ? 1 : 0}</v></c>`
  }

  return `<c r="${address}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(exportValue(value))}</t></is></c>`
}

function worksheetXml(result: ProcessedPipelineResult): string {
  const rows = [
    result.column_names,
    ...result.data.map((row) => result.column_names.map((name) => row[name])),
  ]

  const sheetRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) =>
      xlsxCell(
        `${columnAddress(columnIndex)}${rowIndex + 1}`,

        value,

        rowIndex === 0
          ? undefined
          : result.column_types[result.column_names[columnIndex]],
      ),
    )

    return `<row r="${rowIndex + 1}">${cells.join("")}</row>`
  })

  const dimension =
    result.column_names.length > 0
      ? `<dimension ref="A1:${columnAddress(result.column_names.length - 1)}${rows.length}"/>`
      : ""

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${dimension}<sheetData>${sheetRows.join("")}</sheetData></worksheet>`
}

export async function createXlsxBlob(
  result: ProcessedPipelineResult,
): Promise<Blob> {
  assertExportableResult(result)

  if (
    result.data.length + 1 > excelRowLimit ||
    result.column_names.length > excelColumnLimit
  ) {
    throw new Error(
      "O resultado ultrapassa o limite de linhas ou colunas do Excel.",
    )
  }

  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    ),

    "_rels/.rels": new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ),

    "xl/workbook.xml": new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Resultado" sheetId="1" r:id="rId1"/></sheets></workbook>',
    ),

    "xl/_rels/workbook.xml.rels": new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    ),

    "xl/styles.xml": new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    ),

    "xl/worksheets/sheet1.xml": new TextEncoder().encode(
      worksheetXml(result),
    ),
  }

  const archive = zipSync(files, { level: 6 })

  return new Blob([archive], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}
