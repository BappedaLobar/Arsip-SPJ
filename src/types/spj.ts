export type SPJ = {
  id: string;
  nomorSpj: string;
  kodeRekening: string;
  jenisSpj: "GU" | "LS";
  tanggal: Date;
  uraian: string;
  jumlah: number;
  file?: File;
};