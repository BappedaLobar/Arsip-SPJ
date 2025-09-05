export const bidangOptions = [
  "Sekretariat",
  "Litbang Renbang",
  "Ekonomi",
  "Sosbud",
  "SarprasWil",
] as const;

export type Bidang = (typeof bidangOptions)[number];

export type SPJ = {
  id: string;
  nomorPembukuan: string;
  kodeRekening: string;
  jenisSpj: "GU" | "LS";
  bidang?: Bidang;
  tanggal: Date;
  uraian: string;
  jumlah: number;
  fileUrl?: string | null;
};