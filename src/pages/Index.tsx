import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SpjForm } from "@/components/SpjForm";
import { SpjTable } from "@/components/SpjTable";
import { SPJ, bidangOptions } from "@/types/spj";
import { exportToExcel } from "@/lib/excelGenerator";
import { PlusCircle, FolderArchive, FileQuestion, X, FileSpreadsheet, DownloadCloud, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  showError,
  showSuccess,
  showLoading,
  dismissToast,
} from "@/utils/toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { DownloadOptionsDialog } from "@/components/DownloadOptionsDialog";
import { gapi } from "gapi-script"; // Import gapi

// Define a simple interface for the Google API authorization result
interface GoogleAuthResult {
  access_token?: string;
  error?: string;
  // Add other properties if needed, e.g., expires_in, token_type
}

const Index = () => {
  const [spjData, setSpjData] = useState<SPJ[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpj, setEditingSpj] = useState<SPJ | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedBidang, setSelectedBidang] = useState<string>("all");
  const [isDownloadOptionsOpen, setIsDownloadOptionsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false); // New state for Google API loading

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

  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"; // Scope for creating/modifying files created by the app

  // Load Google API client
  useEffect(() => {
    const loadClient = () => {
      gapi.load("client:auth2", () => {
        gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          scope: DRIVE_SCOPE,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        }).then(() => {
          setIsGoogleApiLoaded(true);
        }).catch(error => {
          console.error("Error initializing Google API client:", error);
          showError("Gagal memuat Google API untuk transfer file.");
        });
      });
    };

    if (API_KEY && CLIENT_ID) {
      loadClient();
    } else {
      console.warn("Google API Key or Client ID is missing. Google Drive features will be limited.");
    }
  }, [API_KEY, CLIENT_ID]);

  const fetchSpjData = async (year: string, month: string, bidang: string) => {
    setIsLoading(true);
    let query = supabase.from("spj").select("*");

    if (year !== "all") {
      const yearInt = parseInt(year);
      const startDate = new Date(Date.UTC(yearInt, 0, 1));
      const endDate = new Date(Date.UTC(yearInt, 11, 31, 23, 59, 59, 999));
      query = query
        .gte("tanggal", startDate.toISOString().split("T")[0])
        .lte("tanggal", endDate.toISOString().split("T")[0]);
    }

    if (bidang !== "all") {
      query = query.eq("bidang", bidang);
    }

    const { data, error } = await query.order("tanggal", { ascending: false });

    if (error) {
      showError("Gagal memuat data: " + error.message);
    } else {
      let formattedData = data.map((item: any) => {
        const dateParts = item.tanggal.split('-').map(Number);
        const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

        return {
          id: item.id,
          nomorPembukuan: item.nomor_pembukuan,
          kodeRekening: item.kode_rekening,
          jenisSpj: item.jenis_spj,
          bidang: item.bidang,
          tanggal: localDate,
          uraian: item.uraian,
          jumlah: item.jumlah,
          fileUrl: item.file_url,
        };
      });

      if (month !== "all") {
        const monthInt = parseInt(month) - 1;
        formattedData = formattedData.filter(item => item.tanggal.getMonth() === monthInt);
      }

      setSpjData(formattedData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSpjData(selectedYear, selectedMonth, selectedBidang);
  }, [selectedYear, selectedMonth, selectedBidang]);

  const filteredSpjData = useMemo(() => {
    if (!searchKeyword) {
      return spjData;
    }
    const lowercasedKeyword = searchKeyword.toLowerCase();
    return spjData.filter(item =>
      item.uraian.toLowerCase().includes(lowercasedKeyword)
    );
  }, [spjData, searchKeyword]);

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
      tanggal: format(data.tanggal, "yyyy-MM-dd"),
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
    fetchSpjData(selectedYear, selectedMonth, selectedBidang);
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
    fetchSpjData(selectedYear, selectedMonth, selectedBidang);
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

  const handleTransferToDrive = async (spj: SPJ) => {
    if (!spj.fileUrl) {
      showError("Tidak ada file untuk ditransfer.");
      return;
    }

    if (!isGoogleApiLoaded) {
      showError("Google API belum dimuat. Coba lagi sebentar.");
      return;
    }

    const toastId = showLoading("Mempersiapkan transfer ke Google Drive...");

    try {
      // Authorize if not already authorized with the correct scope
      const authResult = await new Promise<GoogleAuthResult>((resolve, reject) => {
        gapi.auth.authorize({
          client_id: CLIENT_ID,
          scope: DRIVE_SCOPE,
          immediate: false, // Force consent screen if scope not granted
        }, (authRes: GoogleAuthResult) => { // Use the custom interface here
          if (authRes && !authRes.error) {
            resolve(authRes);
          } else {
            reject(authRes?.error || "Authorization failed.");
          }
        });
      });

      if (!authResult || authResult.error) {
        dismissToast(toastId);
        showError("Gagal otentikasi dengan Google Drive. Pastikan Anda memberikan izin.");
        return;
      }

      // Fetch the file from Supabase Storage
      const response = await fetch(spj.fileUrl);
      if (!response.ok) {
        throw new Error(`Gagal mengambil file dari Supabase: ${response.statusText}`);
      }
      const blob = await response.blob();

      // Extract original filename
      const filenameParts = spj.fileUrl.split("/").pop()?.split('_');
      const originalFilename = filenameParts && filenameParts.length > 1 ? filenameParts.slice(1).join('_') : `arsip_${spj.nomorPembukuan}`;
      const fileExtension = originalFilename.split('.').pop();
      const mimeType = blob.type || `application/${fileExtension}`; // Fallback mime type

      const fileMetadata = {
        name: `${spj.nomorPembukuan}_${originalFilename}`, // Name in Google Drive
        mimeType: mimeType,
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
      form.append('file', blob);

      // Upload to Google Drive
      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authResult.access_token}`,
        },
        body: form,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`Gagal mengunggah ke Google Drive: ${errorData.error.message || uploadResponse.statusText}`);
      }

      const uploadedFile = await uploadResponse.json();
      dismissToast(toastId);
      showSuccess(`File berhasil ditransfer ke Google Drive! ID: ${uploadedFile.id}`);
      console.log("Uploaded file to Google Drive:", uploadedFile);

    } catch (error) {
      dismissToast(toastId);
      console.error("Error transferring to Google Drive:", error);
      showError(error instanceof Error ? error.message : "Terjadi kesalahan saat transfer ke Google Drive.");
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
    setSelectedBidang("all");
    setSearchKeyword("");
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  const fetchFilesForDownload = async (year: string, month: string, bidang: string) => {
    let query = supabase.from("spj").select("nomor_pembukuan, file_url, tanggal").not("file_url", "is", null);

    if (year !== "all") {
      const yearInt = parseInt(year);
      if (month !== "all") {
        const monthInt = parseInt(month) - 1;
        const startDate = new Date(Date.UTC(yearInt, monthInt, 1));
        const endDate = new Date(Date.UTC(yearInt, monthInt + 1, 0));
        query = query
          .gte("tanggal", startDate.toISOString().split("T")[0])
          .lte("tanggal", endDate.toISOString().split("T")[0]);
      } else {
        const startDate = new Date(Date.UTC(yearInt, 0, 1));
        const endDate = new Date(Date.UTC(yearInt, 11, 31));
        query = query
          .gte("tanggal", startDate.toISOString().split("T")[0])
          .lte("tanggal", endDate.toISOString().split("T")[0]);
      }
    }

    if (bidang !== "all") {
      query = query.eq("bidang", bidang);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching files for download:", error);
      return [];
    }

    let filteredData = data;
    if (year === "all" && month !== "all") {
      const monthInt = parseInt(month) - 1;
      filteredData = data.filter((item: any) => {
        const dateParts = item.tanggal.split('-').map(Number);
        const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        return localDate.getMonth() === monthInt;
      });
    }
    return filteredData;
  };

  const handleDownloadArchives = async (yearToDownload: string, monthToDownload: string) => {
    const toastId = showLoading("Mempersiapkan unduhan arsip...");
    try {
        const filesToDownload = await fetchFilesForDownload(yearToDownload, monthToDownload, selectedBidang);

        if (filesToDownload.length === 0) {
            dismissToast(toastId);
            showError("Tidak ada file arsip yang ditemukan untuk kriteria yang dipilih.");
            return;
        }

        const zip = new JSZip();
        let filesAddedCount = 0;

        for (const item of filesToDownload) {
            if (item.file_url) {
                try {
                    const response = await fetch(item.file_url);
                    if (!response.ok) {
                        console.warn(`Gagal mengunduh file: ${item.file_url}. Melewati file ini.`);
                        continue;
                    }
                    const blob = await response.blob();
                    const filename = item.file_url.split("/").pop() || "file";
                    const originalFilename = filename.substring(filename.indexOf('_') + 1) || filename;
                    zip.file(`${item.nomor_pembukuan}_${originalFilename}`, blob);
                    filesAddedCount++;
                } catch (e) {
                    console.error(`Error adding file ${item.file_url} to zip:`, e);
                }
            }
        }

        if (filesAddedCount === 0) {
            dismissToast(toastId);
            showError("Tidak ada file yang berhasil diunduh untuk di-zip.");
            return;
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });

        let zipFileName = "arsip_spj";
        if (yearToDownload !== "all") {
            zipFileName += `_${yearToDownload}`;
            if (monthToDownload !== "all") {
                const monthLabel = months.find(m => m.value === monthToDownload)?.label;
                zipFileName += `_${monthLabel}`;
            }
        } else if (monthToDownload !== "all") {
            const monthLabel = months.find(m => m.value === monthToDownload)?.label;
            zipFileName += `_semua_tahun_${monthLabel}`;
        }
        if (selectedBidang !== "all") {
            zipFileName += `_${selectedBidang}`;
        }
        zipFileName += ".zip";

        saveAs(zipBlob, zipFileName);
        dismissToast(toastId);
        showSuccess(`${filesAddedCount} file arsip berhasil diunduh dalam format ZIP.`);

    } catch (error) {
        dismissToast(toastId);
        console.error("Error during archive download:", error);
        showError("Terjadi kesalahan saat mengunduh arsip.");
    }
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
          <Button
            variant="outline"
            disabled={spjData.length === 0}
            onClick={() => exportToExcel(spjData)}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Cetak Laporan
          </Button>
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
        <Select value={selectedYear} onValueChange={handleYearChange}>
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
        <Select
          value={selectedMonth}
          onValueChange={setSelectedMonth}
        >
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
        <Select value={selectedBidang} onValueChange={setSelectedBidang}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Pilih Bidang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bidang</SelectItem>
            {bidangOptions.map((bidang) => (
              <SelectItem key={bidang} value={bidang}>
                {bidang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-grow max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari uraian..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
        {(selectedYear !== "all" || selectedMonth !== "all" || selectedBidang !== "all" || searchKeyword !== "") && (
          <Button variant="ghost" onClick={resetFilters}>
            <X className="mr-2 h-4 w-4" />
            Reset Filter
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setIsDownloadOptionsOpen(true)}
          disabled={isLoading || spjData.length === 0}
        >
          <DownloadCloud className="mr-2 h-4 w-4" />
          Unduh Arsip
        </Button>
      </div>

      <SpjTable
        data={filteredSpjData}
        onEdit={handleEdit}
        onDelete={handleDeleteSpj}
        onViewFile={handleViewFile}
        onDownload={handleDownloadFile}
        onTransferToDrive={handleTransferToDrive}
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

      <DownloadOptionsDialog
        isOpen={isDownloadOptionsOpen}
        onOpenChange={setIsDownloadOptionsOpen}
        onDownload={handleDownloadArchives}
        years={years}
        months={months}
        initialYear={selectedYear}
        initialMonth={selectedMonth}
      />
    </div>
  );
};

export default Index;