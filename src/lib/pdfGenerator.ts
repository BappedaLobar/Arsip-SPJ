import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SPJ } from "@/types/spj";

export const exportToPdf = (data: SPJ[]) => {
  const doc = new jsPDF();

  doc.text("Laporan Arsip SPJ", 14, 16);
  autoTable(doc, {
    startY: 20,
    head: [
      ["No", "No. Pembukuan", "Kode Rekening", "Jenis", "Tanggal", "Uraian", "Terbilang (Rp)"],
    ],
    body: data.map((item, index) => [
      index + 1,
      item.nomorPembukuan,
      item.kodeRekening,
      item.jenisSpj,
      item.tanggal.toLocaleDateString("id-ID"),
      item.uraian,
      `Rp ${item.jumlah.toLocaleString("id-ID")}`,
    ]),
  });

  doc.save("laporan-arsip-spj.pdf");
};