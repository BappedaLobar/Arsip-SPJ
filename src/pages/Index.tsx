import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpjForm } from "@/components/SpjForm";
import { SpjTable } from "@/components/SpjTable";
import { SPJ } from "@/types/spj";
import { exportToPdf } from "@/lib/pdfGenerator";
import { exportToExcel } from "@/lib/excelGenerator";
import { FileDown, PlusCircle, FolderArchive, FileQuestion, X, FileType, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  showError,
  showSuccess,
  showLoading,
  dismissToast,
} from "@/utils/toast";

const Index = () => {
  const [spjData, setSpjData] = useState<SPJ[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpj, setEditingSpj] = useState<SPJ | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const years = ["2023", "2024", "2025", "2026"];
  const months = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const fetchSpjData = async (year: string, month: string) => {
    setIsLoading(true);
    let query = supabase.from("spj").select("*");

    if (year !== "all") {
      const yearInt = parseInt(year);
      if (month !== "all") {
        // Filter by specific month and year
        const monthInt = parseInt(month) - 1;
        const startDate = new Date(yearInt, monthInt, 1);
        const endDate = new Date(yearInt, monthInt + 1, 0);
        query = query
          .gte("tanggal", startDate.toISOString())
          .lte("tanggal", endDate.toISOString());
      } else {
        // Filter by year only
        const startDate = new Date(yearInt, 0, 1);
        const endDate = new Date(yearInt, 11, 31);
        query = query
          .gte("tanggal", startDate.toISOString())
          .lte("tanggal", endDate.toISOString());
      }
    }

    const { data, error } = await query.order("tanggal", { ascending: false });

    if (error) {
      showError("Gagal memuat data: " + error.message);
    } else {
      const formattedData = data.map((item: any) => ({
        id: item.id,
        nomorPembukuan: item.nomor_pembukuan,
        kodeRekening: item.kode_rekening,
        jenisSpj: item.jenis_spj,
        bidang: item.bidang,
        tanggal: new Date(item.tanggal),
        uraian: item.uraian,
        jumlah: item.jumlah,
        fileUrl: item.file_url,
      }));
      setSpjData(formattedData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSpjData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const handleSaveSpj = async (
    data: Omit<SPJ, "id" | "fileUrl"> & { file?: File | { name: string; url: string; token: string } }
  ) => {
    const toastId = showLoading("Menyimpan data...");
    let fileUrl: string | null = editingSpj?.fileUrl || null;

    if (data.file) {
      let fileToUpload: File | Blob;
      let fileName: string;

      if (data.file instanceof File) {
        fileToUpload = data.file;
        fileName = `${new Date().toISOString()}_${data.file.name}`;
      } else {
        // Handle Google Drive file
        const response = await fetch(data.file.url, {
          headers: {
            Authorization: `Bearer ${data.file.token}`,
          },
        });
        if (!response.ok) {
          dismissToast(toastId);
          showError("Gagal mengunduh file dari Google Drive.");
          return;
        }
        fileToUpload = await response.blob();
        fileName = `${new Date().toISOString()}_${data.file.name}`;
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("spj_files")
        .upload(fileName, fileToUpload);

      if (uploadError) {
        dismissToast(toastId);
        showError("Gagal mengunggah file: " + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("spj_files")
        .getPublicUrl(uploadData.path);
      fileUrl = publicUrlData.publicUrl;
    }

    const spjRecord = {
      nomor_pembukuan: data.nomorPembukuan,
      kode_rekening: data.kodeRekening,
      jenis_spj: data.jenisSpj,
      bidang: data.bidang,
      tanggal: data.tanggal.toISOString().split("T")[0],
      uraian: data.uraian,
      jumlah: data.jumlah,
      file_url: fileUrl,
    };

    if (editingSpj) {
      const { error } = await supabase
        .from("spj")
        .update(spjRecord)
        .eq("id", editingSpj.id);
      if (error) {
        dismissToast(toastId);
        showError("Gagal memperbarui data: " + error.message);
        return;
      }
      showSuccess("Data berhasil diperbarui!");
    } else {
      const { error } = await supabase.from("spj").insert([spjRecord]);
      if (error) {
        dismissToast(toastId);
        showError("Gagal menyimpan data: " + error.message);
        return;
      }
      showSuccess("Data berhasil disimpan!");
    }

    dismissToast(toastId);
    setIsFormOpen(false);
    setEditingSpj(null);
    fetchSpjData(selectedYear, selectedMonth);
  };

  const handleDeleteSpj = async (id: string) => {
    const spjToDelete = spjData.find((item) => item.id === id);
    if (!spjToDelete) return;

    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    const toastId = showLoading("Menghapus data...");

    if (spjToDelete.fileUrl) {
      const fileName = spjToDelete.fileUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("spj_files").remove([fileName]);
      }
    }

    const { error } = await supabase.from("spj").delete().eq("id", id);

    if (error) {
      dismissToast(toastId);
      showError("Gagal menghapus data: " + error.message);
      return;
    }

    dismissToast(toastId);
    showSuccess("Data berhasil dihapus!");
    fetchSpjData(selectedYear, selectedMonth);
  };

  const handleEdit = (spj: SPJ) => {
    setEditingSpj(spj);
    setIsFormOpen(true);
  };

  const handleFormDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingSpj(null);
    }
  };

  const handleViewFile = (url: string) => {
    setSelectedFileUrl(url);
    setIsFileViewerOpen(true);
  };

  const handleDownloadFile = async (url: string) => {
    if (!url) {
      showError("Tidak ada file untuk diunduh.");
      return;
    }
    const toastId = showLoading("Mengunduh file...");
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Gagal mengunduh file: ${response.statusText}`);
      }
      const blob = await response.blob();
      
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      
      const filename = url.split("/").pop() || "downloaded-file";
      const originalFilename = filename.substring(filename.indexOf('_') + 1);
      link.download = originalFilename;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      
      dismissToast(toastId);
      showSuccess("File berhasil diunduh.");
    } catch (error) {
      dismissToast(toastId);
      console.error("Download error:", error);
      showError(error instanceof Error ? error.message : "Terjadi kesalahan saat mengunduh file.");
    }
  };

  const getViewerInfo = (url: string | null): { url: string; type: 'iframe' | 'image' | 'unsupported' } => {
    if (!url) return { url: "", type: 'unsupported' };
    const extension = url.split('?')[0].split('.').pop()?.toLowerCase();
    const encodedUrl = encodeURIComponent(url);

    switch (extension) {
      case 'pdf':
        return { url: `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`, type: 'iframe' };
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return { url: url, type: 'image' };
      case 'doc':
      case 'docx':
      case 'xls':
      case 'xlsx':
      case 'ppt':
      case 'pptx':
        return { url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`, type: 'iframe' };
      default:
        return { url: url, type: 'unsupported' };
    }
  };

  const resetFilters = () => {
    setSelectedYear("all");
    setSelectedMonth("all");
  };

  const { url: viewerUrl, type: viewerType } = getViewerInfo(selectedFileUrl);

  return (
    <div className="container mx-auto py-10 max-w-full px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <FolderArchive className="h-12 w-12 text-primary" />
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight">
              ARSIP SPJ KEUANGAN
            </h1>
            <p className="text-muted-foreground">
              BAPPEDA KAB. LOMBOK BARAT
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Nyoman Asti Primasantia
              <br />
              200103012025052003
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={spjData.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Cetak Laporan
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportToPdf(spjData)}>
                <FileType className="mr-2 h-4 w-4" />
                <span>PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToExcel(spjData)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                <span>Excel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isFormOpen} onOpenChange={handleFormDialogChange}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Arsip SPJ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSpj ? "Edit Arsip SPJ" : "Tambah Arsip SPJ Baru"}
                </DialogTitle>
              </DialogHeader>
              <SpjForm
                onSubmit={handleSaveSpj}
                onCancel={() => handleFormDialogChange(false)}
                initialData={editingSpj}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih Tahun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tahun</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih Bulan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bulan</SelectItem>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(selectedYear !== "all" || selectedMonth !== "all") && (
          <Button variant="ghost" onClick={resetFilters}>
            <X className="mr-2 h-4 w-4" />
            Reset Filter
          </Button>
        )}
      </div>

      <SpjTable
        data={spjData}
        onEdit={handleEdit}
        onDelete={handleDeleteSpj}
        onViewFile={handleViewFile}
        onDownload={handleDownloadFile}
        isLoading={isLoading}
      />

      <Dialog open={isFileViewerOpen} onOpenChange={setIsFileViewerOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pratinjau Berkas</DialogTitle>
          </DialogHeader>
          <div className="flex-grow bg-gray-100 dark:bg-gray-800 rounded-md">
            {viewerType === 'unsupported' ? (
              <div className="flex flex-col items-center justify-center h-full">
                <FileQuestion className="w-12 h-12 text-destructive mb-4" />
                <h3 className="text-lg font-medium text-gray-600">Format Tidak Didukung</h3>
                <p className="text-sm text-gray-500">Pratinjau untuk jenis file ini tidak tersedia.</p>
                <a href={viewerUrl || '#'} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-primary hover:underline">
                  Buka di tab baru atau unduh file
                </a>
              </div>
            ) : viewerType === 'image' ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img src={viewerUrl} alt="Pratinjau Berkas" className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
              </div>
            ) : (
              <iframe
                src={viewerUrl}
                className="w-full h-full border-0"
                title="File Viewer"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;