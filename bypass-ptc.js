const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const Tesseract = require("tesseract.js");
const http = require("http"); // DUMMY PORT HERE ✅

const COOKIES = require("./cookies.json");
const PTC_PAGE = "https://firefaucet.win/ptc/";

puppeteer.use(StealthPlugin());

(async () => {
  // Dummy port listener to satisfy Render's requirement
  const PORT = process.env.PORT || 3000;
  http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("FireFaucet Bot is running!\n");
  }).listen(PORT, () => {
    console.log(`🌐 Dummy server listening on port ${PORT}`);
  });

  console.log("🚀 Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  console.log("🍪 Setting cookies...");
  await page.setCookie(...COOKIES);

  console.log("🌐 Going to PTC page...");
  await page.goto(PTC_PAGE, { waitUntil: "domcontentloaded" });

  while (true) {
    console.log("🔍 Looking for available PTC ads...");
    const adLinks = await page.$$eval(".btn.btn-primary.btn-sm", btns =>
      btns.map(btn => btn.href).filter(href => href.includes("/goShortlink.php"))
    );

    if (adLinks.length === 0) {
      console.log("🎉 No more PTC ads. Waiting before retry...");
      await page.waitForTimeout(60000);
      await page.reload({ waitUntil: "domcontentloaded" });
      continue;
    }

    console.log(`📄 Found ${adLinks.length} PTC ads.`);

    for (let i = 0; i < adLinks.length; i++) {
      const href = adLinks[i];
      console.log(`➡️ (${i + 1}/${adLinks.length}) Visiting: ${href}`);

      const newTab = await browser.newPage();
      await newTab.setCookie(...COOKIES);

      try {
        await newTab.goto(href, { waitUntil: "networkidle2", timeout: 30000 });

        const iframe = await newTab.$("iframe");
        if (iframe) {
          console.log("📦 Switching to iframe...");
          const frame = await iframe.contentFrame();

          const imageElement = await frame.$("img.captcha-img");
          if (!imageElement) throw new Error("⚠️ Hakuna captcha image imepatikana.");

          const imageBuffer = await imageElement.screenshot();
          const ocrResult = await Tesseract.recognize(imageBuffer, "eng", { logger: () => {} });

          const digits = ocrResult.data.text.replace(/\D/g, "");
          console.log(`🔢 Digits recognized: ${digits}`);

          await frame.type("input.form-control", digits, { delay: 100 + Math.floor(Math.random() * 100) });
          await frame.click("button.btn.btn-primary");

          await newTab.waitForTimeout(3000 + Math.floor(Math.random() * 3000));
          console.log("✅ Captcha solved and ad completed.");
        } else {
          console.log("⚠️ Iframe haijapatikana, skipping...");
        }

      } catch (error) {
        console.log("❌ Error on this PTC:", error.message);
      } finally {
        await newTab.close();
      }

      await page.waitForTimeout(4000 + Math.floor(Math.random() * 2000));
    }
  }

  // Kawaida hatufiki hapa kwa sababu ya loop
  await browser.close();
})();
