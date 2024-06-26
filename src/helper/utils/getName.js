/**
 * Extract Name
 * @memberof Utils
 * @author fdciabdul
 * @utils Utils/NameExtractor
 */

class NameExtractor {
  static extractBCAMutationName(name) {
    const regex = /[A-Z\s]+$/; // mencocokkan satu atau lebih huruf kapital dan spasi di akhir string
    const matches = name.match(regex);
    return matches ? matches[0].trim() : null;
  }

  static extractMandiriMutationName(name) {
    const regex = /(?:KE|DARI)\s(.+)/;
    const match = name.match(regex);
    return match ? match[1] : null;
  }

  static extractBNIMutationName(name) {
    const regex = /TRANSFER DARI (Bpk|Sdr|Ibu) (.*)/;
    const match = name.match(regex);
    return match ? match[2] : null;
  }
}

module.exports = NameExtractor;
