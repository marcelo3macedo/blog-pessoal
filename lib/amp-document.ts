import { AMP_CSS } from "./amp-css";

const AMP_BOILERPLATE =
  "body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}";
const AMP_BOILERPLATE_NOSCRIPT =
  "body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Prevents a "</script>" (or any "<") inside the serialized JSON-LD from
// prematurely closing the surrounding <script> tag.
function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export interface AmpDocumentOptions {
  lang: string;
  title: string;
  description: string;
  canonicalUrl: string;
  jsonLd: object;
  bodyHtml: string;
}

export function buildAmpDocument({
  lang,
  title,
  description,
  canonicalUrl,
  jsonLd,
  bodyHtml,
}: AmpDocumentOptions): string {
  return `<!doctype html>
<html amp lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<script async src="https://cdn.ampproject.org/v0.js"></script>
<title>${escapeHtml(title)}</title>
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
<meta name="description" content="${escapeHtml(description)}">
<style amp-boilerplate>${AMP_BOILERPLATE}</style><noscript><style amp-boilerplate>${AMP_BOILERPLATE_NOSCRIPT}</style></noscript>
<style amp-custom>${AMP_CSS}</style>
<script type="application/ld+json">${serializeJsonLd(jsonLd)}</script>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}
