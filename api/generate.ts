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
    waitUntil: "domcontentloaded",
  });
  await page.emulateMediaType("print");
  const pdf = await page.pdf({ preferCSSPageSize: true });
  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${req.body?.title ?? "Resume"}.pdf`
  );
  return res.send(pdf);
}
