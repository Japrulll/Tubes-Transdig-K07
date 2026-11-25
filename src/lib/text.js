/** Normalisasi teks untuk pencocokan: huruf kecil, tanpa aksen & tanda baca, spasi tunggal */
export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
