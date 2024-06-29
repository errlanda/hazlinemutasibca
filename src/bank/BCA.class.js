const { ScraperBank } = require("../BrowserClasses.js");
const BCASelectors = require("../helper/selector/BCASelector");
const log = require("../helper/utils/Logger");

/**
 * Scraper for BCA (Bank Central Asia) that extends ScraperBank class.
 * @class ScrapBCA
 * @author fdciabdul
 * @memberof Bank
 */

class ScrapBCA extends ScraperBank {
    /**
     * Constructor for the ScrapBCA class.
     *
     * @param {string} user - The username for authentication.
     * @param {string} pass - The password for authentication.
     * @param {string} norek - The account number.
     * @param {object} args - Additional arguments.
     * @param {boolean} [useFingerprintInjector=false] - Flag to use fingerprint injector.
     */
    constructor(user, pass, norek, args, useFingerprintInjector = false) {
        super(user, pass, args);
        this.norek = norek;
        this.log = log;
        this.dialogMessage = null;
        this.loginError = null;
    }

    /**
     * Logs into BCA by launching the browser, navigating to the login page,
     * handling any dialogs, filling in the username and password fields,
     * clicking the submit button, and checking for any login errors.
     *
     * @return {Promise<void>} A promise that resolves once the login process is complete.
     */
    async loginToBCA() {
        this.page = await this.launchBrowser();
        await this.page.goto(BCASelectors.LOGIN_PAGE.url, {
            waitUntil: "domcontentloaded",
        });
        this.log(
            "[" +
                this.user +
                "] Robot Hazline bekerja ! Menunggu halaman login agar dimuat sempurna ..",
        );
        await this.page.waitForTimeout(22000); // Tunggu 22 detik sebelum mengisi formulir login

        this.page.on("dialog", async (dialog) => {
            await dialog.accept();
            this.log("[" + this.user + "] " + dialog.message());
            this.loginError = dialog.message();
        });
        this.log("[" + this.user + "] Sedang Login ke BCA .. ");
        await this.page.type(BCASelectors.LOGIN_PAGE.userField, this.user, {
            delay: 100,
        });
        await this.page.type(BCASelectors.LOGIN_PAGE.passField, this.pass);
        await this.page.click(BCASelectors.LOGIN_PAGE.submitButton, {
            delay: 200,
        });

        await this.page.waitForTimeout(12000); // Tambahkan penundaan setelah mengklik tombol login
        if (this.loginError) {
            throw new Error(this.loginError);
        }
    }

    async selectAccountAndSetDates(tglawal, blnawal, tglakhir, blnakhir) {
        await this.page.goto(BCASelectors.SETTLEMENT_PAGE.url, {
            waitUntil: "domcontentloaded",
        });

        this.log("[" + this.user + "] Berhasil login ..");
        await this.page.click(BCASelectors.SETTLEMENT_PAGE.settlementLink);

        const newPage = await this.createTargetPage();
        const padStart2 = (num) => num.toString().padStart(2, "0");

        // Tambahkan penundaan sebelum memilih tanggal
        await newPage.waitForTimeout(11000); // Tunggu 15 detik sebelum memilih tanggal

        if (tglawal || blnawal || tglakhir || blnakhir) {
            this.log("[" + this.user + "] Memilih tanggal ..");

            await newPage.waitForSelector(
                BCASelectors.SETTLEMENT_PAGE.startDateField,
            );
            await newPage.select(
                BCASelectors.SETTLEMENT_PAGE.startDateField,
                padStart2(tglawal),
            );
            await newPage.select(
                BCASelectors.SETTLEMENT_PAGE.startMonthField,
                blnawal.toString(),
            );
            await newPage.select(
                BCASelectors.SETTLEMENT_PAGE.endDateField,
                padStart2(tglakhir),
            );
            await newPage.select(
                BCASelectors.SETTLEMENT_PAGE.endMonthField,
                blnakhir.toString(),
            );

            await this.page.waitForTimeout(10000); // Tunggu 10 detik

            this.log("[" + this.user + "] Mendapatkan mutasi ..");
            await newPage.click(BCASelectors.SETTLEMENT_PAGE.submitButton, {
                delay: 1500,
            });

            await this.page.waitForTimeout(7000); // Tambahkan penundaan setelah mengklik tombol submit
            return newPage;
        } else {
            this.log("[" + this.user + "] Get latest mutasi ..");
            await newPage.click(BCASelectors.SETTLEMENT_PAGE.submitButton, {
                delay: 1500,
            });
            await this.page.waitForTimeout(7000); // Tambahkan penundaan setelah mengklik tombol submit
            return newPage;
        }
    }

    async createTargetPage() {
        const pageTarget = this.page.target();
        const newTarget = await this.page
            .browser()
            .waitForTarget((target) => target.opener() === pageTarget);
        const newPage = await newTarget.page();

        await this.handleDialogAndLogout(newPage);

        await newPage.reload({
            waitUntil: "domcontentloaded",
        });

        return newPage;
    }

    async logoutAndClose() {
        try {
            this.log("[ LOG ] [" + this.user + "] Logout..");
            await this.page.goto(BCASelectors.LOGOUT_PAGE.url, {
                waitUntil: "domcontentloaded",
            });
            await this.browser.close();
        } catch {
            return null;
        }
    }

    async handleDialogAndLogout(newPage) {
        newPage.on("dialog", async (dialog) => {
            this.dialogMessage = dialog.message();
            this.log(`[ LOG ] ["${this.user}"] ${this.dialogMessage}`);
            await dialog.dismiss();
            await this.logoutAndClose();
        });
    }
}

module.exports = ScrapBCA;
