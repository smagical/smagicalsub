export type CsvValue = string | number | boolean | null | undefined;

export function toCsv(rows: CsvValue[][]) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadCsv(filenamePrefix: string, rows: CsvValue[][]) {
  // 所有列表导出统一入口，保证文件名日期和 CSV 转义规则一致。
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: CsvValue) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}
