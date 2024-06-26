const { load } = require("cheerio");
const NameExtractor = require("./getName");
const moment = require("moment");

class BCAParser {
    constructor(html, selectors) {
        this.$ = load(html);
        this.selectors = selectors;
    }

    parse() {
        let accountNo = this.$(this.selectors.accountNoField)
            .parent()
            .next()
            .next()
            .text()
            .trim();
        let name = this.$(this.selectors.nameField)
            .parent()
            .next()
            .next()
            .text()
            .trim();
        let periode = this.$(this.selectors.periodeField)
            .parent()
            .next()
            .next()
            .text()
            .trim();
        let mataUang = this.$(this.selectors.mataUangField)
            .parent()
            .next()
            .next()
            .text()
            .trim();

        let transactions = [];
        this.$(this.selectors.transactionsTable)
            .find("tr")
            .each((i, elem) => {
                let tanggal = this.$(elem)
                    .find("td:nth-child(1)")
                    .text()
                    .trim();
                if (tanggal === "PEND") {
                    tanggal = periode.split("-")[0].trim();
                }

                let keterangan = this.$(elem)
                    .find("td:nth-child(2)")
                    .text()
                    .trim();
                keterangan = keterangan.replace(/\s+/g, " ");
                let nama = NameExtractor.extractBCAMutationName(keterangan);
                let mutasi = this.$(elem).find("td:nth-child(5)").text().trim();
                let nominal = this.$(elem)
                    .find("td:nth-child(4)")
                    .text()
                    .trim();
                let saldoakhir = this.$(elem)
                    .find("td:nth-child(6)")
                    .text()
                    .trim();
                if (tanggal === "Tgl.") {
                } else if (tanggal === "Date") {
                } else {
                    transactions.push({
                        tanggal,
                        keterangan,
                        nama,
                        mutasi,
                        nominal,
                        saldoakhir,
                    });
                }
            });

        let settlement = {};
        this.$(this.selectors.settlementTable)
            .find("tr")
            .each((i, elem) => {
                let item = this.$(elem).find("td:nth-child(1)").text().trim();
                let value = this.$(elem).find("td:nth-child(3)").text().trim();
                if (item !== "") {
                    settlement[item] = value;
                }
            });

        return {
            data: [{ accountNo, name, periode, mataUang }],
            mutasi: transactions,
        };
    }
}

class BNIParser {
    parse(data) {
        const arrayFilter = data
            .map((item) => item.filter((el) => el !== "-"))
            .filter((filtered) => filtered.length > 0);

        const arr = arrayFilter.slice(6, -7).map((entry) => {
            const [
                tanggal,
                ,
                ,
                keterangan,
                ,
                ,
                ,
                ,
                ,
                mutasi,
                ,
                nominal,
                ,
                ,
                ,
                ,
                saldoakhir,
            ] = entry;
            const mutasiType =
                mutasi === "Cr" ? "CR" : mutasi === "Db" ? "DB" : undefined;
            const name = NameExtractor.extractBNIMutationName(keterangan);

            return {
                tanggal,
                keterangan,
                mutasi: mutasiType,
                nominal,
                saldoakhir,
                nama: name,
            };
        });

        return arr;
    }
}

class BSIParser {
    parse(data) {
        const $ = load(data);
        let profile = [];
        $(".mutasi-rekening").each((i, elem) => {
            const title = $(elem).find(".judul").text().trim();
            const value = $(elem).find(".isi").text().trim();
            profile.push({ title, value });
        });

        let mutasi_data = [];
        $(".table-isi-giro").each((i, elem) => {
            const tanggal = $(elem).find("td").eq(1).text().trim();
            const nama = $(elem).find("td").eq(3).text().trim();
            const nominal =
                $(elem).find("td").eq(8).text().trim() ||
                $(elem).find("td").eq(9).text().trim();
            const saldoakhir = $(elem).find("td").eq(10).text().trim();
            const mutasi = nominal.includes("-") ? "DB" : "CR";
            const keterangan = $(elem).find("td").eq(7).text().trim();

            mutasi_data.push({
                tanggal,
                nama,
                nominal,
                saldoakhir,
                mutasi,
                keterangan,
            });
        });

        const result = {
            profile,
            mutasi_data,
        };

        return result;
    }
}

class BRIParser {
    parse(data) {
        let newData = data.map((obj) => {
            if (obj.DESK_TRAN === "Transaksi tidak ditemukan") {
                return data;
            } else {
                let tanggal =
                    obj.TGL_TRAN.slice(8, 10) + "/" + obj.TGL_TRAN.slice(5, 7);
                let mutasi = obj.MUTASI_DEBET == "0.00" ? "CR" : "DB";
                let nominal = (
                    obj.MUTASI_DEBET == "0.00"
                        ? obj.MUTASI_KREDIT
                        : obj.MUTASI_DEBET
                ).replace(".00", "");
                let saldoakhir = obj.SALDO_AKHIR_MUTASI.replace(".00", "");
                let words = obj.DESK_TRAN.split(" ");
                let nama = words[1] + " " + words[2];
                const currentYear = moment().year();
                const parsedDate = moment(
                    tanggal + "/" + currentYear,
                    "DD/MM/YYYY",
                );
                const formattedDate = parsedDate.format("YYYY-MM-DD HH:mm:ss");
                return {
                    tanggal: formattedDate,
                    keterangan: obj.DESK_TRAN,
                    name: nama,
                    mutasi,
                    nominal,
                    saldoakhir,
                };
            }
        });
        return newData;
    }
}

module.exports = { BCAParser, BNIParser, BSIParser, BRIParser };
