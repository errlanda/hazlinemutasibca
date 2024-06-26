const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const { newInjectedPage } = require("fingerprint-injector");
const { execSync } = require("child_process"); // Menggunakan execSync

puppeteer.use(stealthPlugin());

class ScraperBank {
  constructor(user, pass, args) {
    this.user = user || "username";
    this.pass = pass || "pass";
    const chromiumPath = execSync("which chromium").toString().trim(); // Menggunakan execSync

    this.configBrowser = {
      headless: "new",
      args: [
        "--window-position=000,000",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
        "--disable-setuid-sandbox",
      ],
      executablePath: chromiumPath,
      ...args,
    };
  }

  async launchBrowser() {
    try {
      this.browser = await puppeteer.launch(this.configBrowser);
      this.page = await newInjectedPage(this.browser, {
        fingerprintOptions: {
          devices: ["desktop"],
          operatingSystems: ["macos"],
        },
      });

      return this.page;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

module.exports = ScraperBank;
