const puppeteer = require("puppeteer");
const cookiesRaw = require("./cookies.json");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const cookies = Array.isArray(cookiesRaw) ? cookiesRaw : cookiesRaw.cookies;

  if (!Array.isArray(cookies)) {
    throw new Error("❌ Cookies file is invalid or empty.");
  }

  await page.setCookie(...cookies);

  await page.goto("https://www.betpawa.co.tz", { waitUntil: "networkidle2" });

  // Check if login succeeded
  const loggedIn = await page.evaluate(() => {
    return !!document.querySelector("[data-test-id='header-balance']");
  });

  if (loggedIn) {
    console.log("✅ Logged in successfully!");
  } else {
    console.log("❌ Failed to login. Check cookies.");
  }

  await browser.close();
})();