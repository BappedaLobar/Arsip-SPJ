import * as XLSX from "xlsx";
import { SPJ } from "@/types/spj";

export const exportToExcel = (data: SPJ[]) => {
  // Data untuk kop surat
  const kopSurat = [
    ["PEMERINTAH KABUPATEN LOMBOK BARAT"],
    ["BADAN PERENCANAAN PEMBANGUNAN DAERAH"],
    ["Jalan Soekarno-Hatta, Giri Menang-Gerung, Kode Pos 83363"],
    ["Telepon (0370) 6183012, Faksimili (0370) 6183012"],
    ["Laman: bappeda.lombokbaratkab.go.id, Pos-el: bappeda@lombokbaratkab.go.id"],
  ];

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

  const worksheet = XLSX.utils.json_to_sheet([], { skipHeader: true });

  // Tambahkan kop surat ke worksheet
  XLSX.utils.sheet_add_aoa(worksheet, kopSurat, { origin: "A1" });

  // Tambahkan judul laporan
  XLSX.utils.sheet_add_aoa(worksheet, [["Laporan Arsip SPJ"]], { origin: "A7" });

  // Tambahkan data tabel
  XLSX.utils.sheet_add_json(worksheet, body, { origin: "A9", header: headers });

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
    const cellRef = XLSX.utils.encode_cell({ r: index + 9, c: 7 });
    if (worksheet[cellRef]) {
      worksheet[cellRef].t = 'n';
      worksheet[cellRef].z = '"Rp"#,##0';
    }
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan SPJ");

  XLSX.writeFile(workbook, "laporan-arsip-spj.xlsx");
};