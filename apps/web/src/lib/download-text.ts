export function downloadText(filenamePrefix: string, content: string, extension: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
}
