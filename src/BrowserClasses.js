const puppeteer = require("puppeteer-extra");
const { execSync } = require("child_process");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const chromium = require("chrome-aws-lambda");
const { newInjectedPage } = require("fingerprint-injector");

puppeteer.use(stealthPlugin());

class ScraperBank {
  constructor(user, pass, args) {
    this.user = user || "username";
    this.pass = pass || "pass";
    this.configBrowser = {
      headless: "new", // Headless mode is true by default
      args: [
        "--window-position=000,000",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
        "--disable-setuid-sandbox",
      ],
      executablePath: "", // Will be set dynamically below
      ...args,
    };
  }

  async launchBrowser() {
    try {
      // Set the executable path for Chromium based on the environment
      if (process.env.AWS_EXECUTION_ENV) {
        // Running on AWS Lambda using chrome-aws-lambda
        this.configBrowser.executablePath = await chromium.executablePath;
        this.configBrowser.args = [
          ...chromium.args,
          ...this.configBrowser.args,
        ]; // Append chromium args
      } else {
        // Running locally or on another platform
        // You may need to adjust this based on your local setup
        const chromiumPath = execSync("which chromium-browser")
          .toString()
          .trim();
        this.configBrowser.executablePath = chromiumPath;
      }

      // Launch Puppeteer with the configured browser options
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

module.exports = {
  ScraperBank: ScraperBank,
};
