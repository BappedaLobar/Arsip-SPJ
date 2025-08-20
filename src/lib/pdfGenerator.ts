import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SPJ } from "@/types/spj";
import { kopBappedaBase64 } from "./kopBappeda";

export const exportToPdf = (data: SPJ[]) => {
  const doc = new jsPDF();

  // Hapus header dari data base64 untuk memastikan kompatibilitas
  const base64Image = kopBappedaBase64.split(';base64,').pop();

  if (base64Image) {
    // Tambahkan gambar kop surat
    const imgWidth = 180;
    const imgHeight = 30;
    const x = (doc.internal.pageSize.getWidth() - imgWidth) / 2;
    doc.addImage(base64Image, "PNG", x, 10, imgWidth, imgHeight);
  }

  // Tambahkan judul setelah kop surat
  doc.setFontSize(14);
  doc.text("Laporan Arsip SPJ", 14, 55);

  autoTable(doc, {
    startY: 60,
    head: [
      ["No", "No. Pembukuan", "Kode Rekening", "Jenis", "Bidang", "Tanggal", "Uraian", "Terbilang (Rp)"],
    ],
    body: data.map((item, index) => [
      index + 1,
      item.nomorPembukuan,
      item.kodeRekening,
      item.jenisSpj,
      item.bidang || "-",
      item.tanggal.toLocaleDateString("id-ID"),
      item.uraian,
      `Rp ${item.jumlah.toLocaleString("id-ID")}`,
    ]),
  });

  doc.save("laporan-arsip-spj.pdf");
};