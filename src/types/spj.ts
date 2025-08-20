export type SPJ = {
  id: string;
  nomorPembukuan: string;
  kodeRekening: string;
  jenisSpj: "GU" | "LS";
  tanggal: Date;
  uraian: string;
  jumlah: number;
  fileUrl?: string | null;
};