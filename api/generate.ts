import chromium from "chrome-aws-lambda";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST" || !req.body?.content) {
    return res.status(400).send({ error: "Invalid request" });
  }

  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  await page.setContent(req.body.content, {
    waitUntil: "networkidle0",
  });
  await page.evaluateHandle("document.fonts.ready");
  await page.emulateMediaType("print");
  const pdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
  });
  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${req.body?.title ?? "Project"}.pdf`
  );
  return res.send(pdf);
}
