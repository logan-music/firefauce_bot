const puppeteer = require("puppeteer");
const fs = require("fs");
const Tesseract = require("tesseract.js");

const COOKIES = require("./cookies.json");
const PTC_PAGE = "https://firefaucet.win/ptc/";

(async () => {
  console.log("🚀 Launching browser...");
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
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
      await page.waitForTimeout(60000); // Subiri dakika 1 kabla ya kurudia
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

          await frame.type("input.form-control", digits, { delay: 100 });
          await frame.click("button.btn.btn-primary");

          await newTab.waitForTimeout(5000);
          console.log("✅ Captcha solved and ad completed.");

        } else {
          console.log("⚠️ Iframe haijapatikana, skipping...");
        }

      } catch (error) {
        console.log("❌ Error on this PTC:", error.message);
      } finally {
        await newTab.close();
      }

      await page.waitForTimeout(4000); // Subiri kabla ya kuendelea
    }
  }

  // Haifiki hapa kamwe sababu ya loop, lakini ifike basi:
  await browser.close();
})();