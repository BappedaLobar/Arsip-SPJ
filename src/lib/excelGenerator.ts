import * as XLSX from "xlsx";
import { SPJ } from "@/types/spj";

export const exportToExcel = (data: SPJ[]) => {
  const headers = [
    "No",
    "No. Pembukuan",
    "Kode Rekening",
    "Jenis SPJ",
    "Bidang",
    "Tanggal",
    "Uraian",
    "Terbilang (Rp)",
  ];

  const body = data.map((item, index) => ({
    No: index + 1,
    "No. Pembukuan": item.nomorPembukuan,
    "Kode Rekening": item.kodeRekening,
    "Jenis SPJ": item.jenisSpj,
    Bidang: item.bidang || "-",
    Tanggal: item.tanggal.toLocaleDateString("id-ID"),
    Uraian: item.uraian,
    "Terbilang (Rp)": item.jumlah,
  }));

  const worksheet = XLSX.utils.json_to_sheet(body, { header: headers });
  
  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 5 },   // No
    { wch: 20 },  // No. Pembukuan
    { wch: 20 },  // Kode Rekening
    { wch: 10 },  // Jenis SPJ
    { wch: 15 },  // Bidang
    { wch: 15 },  // Tanggal
    { wch: 40 },  // Uraian
    { wch: 20 },  // Terbilang (Rp)
  ];

  // Format the currency column
  body.forEach((_row, index) => {
    const cellRef = XLSX.utils.encode_cell({ r: index + 1, c: 7 });
    if (worksheet[cellRef]) {
      worksheet[cellRef].t = 'n';
      worksheet[cellRef].z = '"Rp"#,##0';
    }
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan SPJ");

  XLSX.writeFile(workbook, "laporan-arsip-spj.xlsx");
};