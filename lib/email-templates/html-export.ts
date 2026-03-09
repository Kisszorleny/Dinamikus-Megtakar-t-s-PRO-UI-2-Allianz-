type BuildStandaloneHtmlEmailInput = {
  subject: string
  htmlBody: string
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function buildStandaloneHtmlEmail({ subject, htmlBody }: BuildStandaloneHtmlEmailInput): string {
  const title = escapeHtml(subject || "Megtakarítási ajánlat")
  const trimmedBody = (htmlBody || "").trim()
  if (!trimmedBody) {
    return `<!doctype html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body></body>
</html>`
  }

  // If renderer already returns a full HTML document, keep it unchanged.
  if (/<html[\s>]/i.test(trimmedBody) && /<body[\s>]/i.test(trimmedBody)) {
    return trimmedBody
  }

  return `<!doctype html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body { font-family: Arial, Helvetica, sans-serif; }
  </style>
</head>
<body>
${trimmedBody}
</body>
</html>`
}
