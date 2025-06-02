const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const Tesseract = require("tesseract.js");
const fs = require("fs");

// Ongeza stealth mode
puppeteer.use(StealthPlugin());

const COOKIES = require("./cookies.json");
const PTC_PAGE = "https://firefaucet.win/ptc/";

(async () => {
  console.log("🚀 Launching stealth browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  console.log("🍪 Setting cookies...");
  await page.setCookie(...COOKIES);

  console.log("🌐 Navigating to PTC page...");
  await page.goto(PTC_PAGE, { waitUntil: "domcontentloaded" });

  while (true) {
    console.log("🔍 Checking for available PTC ads...");
    const adLinks = await page.$$eval(".btn.btn-primary.btn-sm", btns =>
      btns.map(btn => btn.href).filter(href => href.includes("/goShortlink.php"))
    );

    if (adLinks.length === 0) {
      console.log("🎉 No PTC ads found. Retrying in 60 seconds...");
      await page.waitForTimeout(60000);
      await page.reload({ waitUntil: "domcontentloaded" });
      continue;
    }

    console.log(`📄 Found ${adLinks.length} PTC ads.`);

    for (let i = 0; i < adLinks.length; i++) {
      const href = adLinks[i];
      console.log(`➡️ (${i + 1}/${adLinks.length}) Opening: ${href}`);

      const newTab = await browser.newPage();
      await newTab.setCookie(...COOKIES);

      try {
        await newTab.goto(href, { waitUntil: "networkidle2", timeout: 30000 });

        const iframe = await newTab.$("iframe");
        if (iframe) {
          console.log("📦 Switching to iframe...");
          const frame = await iframe.contentFrame();

          const imageElement = await frame.$("img.captcha-img");
          if (!imageElement) throw new Error("⚠️ No captcha image found.");

          const imageBuffer = await imageElement.screenshot();
          const ocrResult = await Tesseract.recognize(imageBuffer, "eng", { logger: () => {} });

          const digits = ocrResult.data.text.replace(/\D/g, "");
          console.log(`🔢 Recognized digits: ${digits}`);

          await frame.type("input.form-control", digits, { delay: 120 });
          await frame.click("button.btn.btn-primary");

          await newTab.waitForTimeout(7000);
          console.log("✅ Captcha submitted and ad viewed.");
        } else {
          console.log("⚠️ Iframe not found, skipping...");
        }
      } catch (error) {
        console.log("❌ Error processing ad:", error.message);
      } finally {
        await newTab.close();
        await page.waitForTimeout(5000);
      }
    }
  }

  // Haifiki hapa lakini kwa usalama
  await browser.close();
})();
