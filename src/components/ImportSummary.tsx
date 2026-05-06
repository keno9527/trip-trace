import type { ImportSummary as ImportSummaryData } from "../photo-import/importPhotos";

interface ImportSummaryProps {
  summary: ImportSummaryData;
}

const summaryItems = [
  ["importedCount", "已导入"],
  ["geotaggedCount", "带位置"],
  ["missingLocationCount", "缺少位置"],
  ["skippedCount", "已跳过"],
  ["parseFailureCount", "解析失败"],
] as const;

export const ImportSummary = ({ summary }: ImportSummaryProps) => (
  <section className="import-summary" aria-labelledby="import-summary-title">
    <h2 id="import-summary-title">导入摘要</h2>
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
