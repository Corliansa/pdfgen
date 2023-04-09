import chromium from "chrome-aws-lambda";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST" || !req.body?.data || !req.body?.style) {
    return res.status(400).send({ error: "Invalid request" });
  }

  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  });
  const html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${req.body?.title ?? "Project"}</title>
      ${
        !req.body?.styled
          ? `<link rel="stylesheet" href="https://unpkg.com/tailwindcss@3.3.1/src/css/preflight.css" />`
          : `<link rel="stylesheet" href="/styled.min.css" />`
      }
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.css" integrity="sha384-ko6T2DjISesD0S+wOIeHKMyKsHvWpdQ1s/aiaQMbL+TIXx3jg6uyf9hlv3WWfwYv" crossorigin="anonymous" />
      <style>
        ${req.body?.style}
      </style>
    </head>
    <body>
      ${req.body?.data}
    </body>
    </html>`;

  const page = await browser.newPage();
  await page.setContent(html, {
    waitUntil: "networkidle0",
  });
  await page.evaluateHandle("document.fonts.ready");
  await page.emulateMediaType("print");
  const pdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
  });
  await page.close();
  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${req.body?.title ?? "Project"}.pdf`
  );
  return res.send(pdf);
}
