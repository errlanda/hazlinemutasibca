const ScrapBCA = require("./src/bank/BCA.class.js");
const { BCAParser } = require("./src/helper/utils/Parser.js");
const axios = require("axios");

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function runScraper({
  username,
  password,
  accountNumber,
  phoneNumber,
  unlimited,
}) {
  const scraper = new ScrapBCA(username, password, accountNumber, {
    headless: "new",
    args: [
      "--log-level=3",
      "--no-default-browser-check",
      "--disable-infobars",
      "--disable-web-security",
      "--disable-site-isolation-trials",
      "--no-sandbox",
    ],
  });

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 15);

  const tglawal = yesterday.getDate();
  let blnawal = yesterday.getMonth() + 1;
  const tglakhir = today.getDate();
  const blnakhir = today.getMonth() + 1;

  if (tglawal > today.getDate()) {
    blnawal = today.getMonth();
    if (blnawal === 0) {
      blnawal = 12;
    }
  }

  try {
    await scraper.loginToBCA();
    await delay(10000);
    const mutasinya = await scraper.selectAccountAndSetDates(
      tglawal,
      blnawal,
      tglakhir,
      blnakhir,
    );
    await delay(5000);
    await delay(5000);
    const htmlContent = await mutasinya.content();
    await delay(2000);

    const selectors = {
      accountNoField: 'font:contains("Nomor Rekening")',
      nameField: 'font:contains("Nama")',
      periodeField: 'font:contains("Periode")',
      mataUangField: 'font:contains("Mata Uang")',
      transactionsTable: 'table[border="1"]',
      settlementTable: 'table[border="0"][width="70%"]',
    };

    const bcaParser = new BCAParser(htmlContent, selectors);
    const result = bcaParser.parse();
    console.log(result);

    const mutasiMasuk = result.mutasi.filter((item) => item.mutasi === "CR");

    for (const item of mutasiMasuk) {
      let referenceId2 = item.nominal.replace(/,/g, "");
      referenceId2 = referenceId2.split(".")[0];

      // Kirim ke endpoint WhatsApp
      await axios
        .post("https://wa.erland.biz.id/mutasiotomatis", {
          phoneNumber: phoneNumber,
          reference_id2: referenceId2,
        })
        .then((response) => {
          console.log("Data berhasil dikirim ke wa BOT:", response.data);
        })
        .catch((error) => {
          console.error("Error mengirim data:", error);
        });

      await axios
        .post("https://hazline.com/endpoint/", { number: referenceId2 })
        .then((response) => {
          console.log("Data berhasil dikirim ke hazline:", response.data);
        })
        .catch((error) => {
          console.error("Error mengirim data ke hazline:", error);
        });
    }

    await delay(5000);
    await scraper.logoutAndClose();
    console.log("Tugas Berhasil dilaksanakan. Terima kasih.");
  } catch (error) {
    console.error("Error: ", error);

    if (
      error.message.includes(
        "Anda dapat melakukan login kembali setelah 5 menit ..",
      ) ||
      error.message.includes("Anda dapat login kembali dalam 5 menit ..")
    ) {
      await scraper.logoutAndClose();
      console.log("Menunggu 5 menit sebelum melakukan login kembali ..");

      await delay(300000);
    } else {
      await scraper.logoutAndClose();
    }
  }
}

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  const accountNumber = process.argv[4];
  const phoneNumber = process.argv[5];
  const unlimited = process.argv[6] === "unlimited";

  const scraperParams = {
    username,
    password,
    accountNumber,
    phoneNumber,
    unlimited,
  };

  if (unlimited) {
    while (true) {
      await runScraper(scraperParams);
    }
  } else {
    await runScraper(scraperParams);
  }
}

main();
