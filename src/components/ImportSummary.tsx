import type { ImportSummary as ImportSummaryData } from "../photo-import/importPhotos";

interface ImportSummaryProps {
  errorMessage?: string;
  isImporting?: boolean;
  summary: ImportSummaryData;
}

const summaryItems = [
  ["importedCount", "已导入"],
  ["geotaggedCount", "带位置"],
  ["missingLocationCount", "缺少位置"],
  ["skippedCount", "已跳过"],
  ["parseFailureCount", "解析失败"],
] as const;

export const ImportSummary = ({ errorMessage, isImporting = false, summary }: ImportSummaryProps) => (
  <section className="import-summary" aria-labelledby="import-summary-title">
    <h2 id="import-summary-title">导入摘要</h2>
    {isImporting ? <p className="import-status" role="status">正在导入</p> : null}
    {errorMessage ? <p className="import-error" role="alert">{errorMessage}</p> : null}
    <dl>
      {summaryItems.map(([key, label]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>{summary[key]}</dd>
        </div>
      ))}
    </dl>
  </section>
);
