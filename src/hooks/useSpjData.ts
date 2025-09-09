import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SPJ } from "@/types/spj";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { format } from "date-fns";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface UseSpjDataProps {
  session: any; // Replace with actual session type if available
  isSessionLoading: boolean;
  selectedYear: string;
  selectedMonth: string;
  selectedBidang: string;
  searchKeyword: string;
  searchNomorPembukuan: string; // New prop for Nomor Pembukuan search
  months: { value: string; label: string }[];
}

interface GoogleDriveFile {
  name: string;
  url: string;
  token: string;
}

// Define the type for items fetched for download to match Supabase column names
interface SpjDownloadItem {
  nomor_pembukuan: string;
  file_url: string | null;
  tanggal: string; // Assuming it comes as a string from DB
}

export const useSpjData = ({
  session,
  isSessionLoading,
  selectedYear,
  selectedMonth,
  selectedBidang,
  searchKeyword,
  searchNomorPembukuan, // Destructure new prop
  months,
}: UseSpjDataProps) => {
  const [spjData, setSpjData] = useState<SPJ[]>([]);
  const [isLoadingSpj, setIsLoadingSpj] = useState(true);
  const [totalSpjGu, setTotalSpjGu] = useState(0); // New state
  const [totalSpjLs, setTotalSpjLs] = useState(0); // New state
  const [spjCountByBidang, setSpjCountByBidang] = useState<{ [key: string]: number }>({}); // New state

  const fetchSpjData = useCallback(async () => {
    setIsLoadingSpj(true);
    let query = supabase.from("spj").select("*");

    if (selectedYear !== "all") {
      const yearInt = parseInt(selectedYear);
      const startDate = new Date(Date.UTC(yearInt, 0, 1));
      const endDate = new Date(Date.UTC(yearInt, 11, 31, 23, 59, 59, 999));
      query = query
        .gte("tanggal", startDate.toISOString().split("T")[0])
        .lte("tanggal", endDate.toISOString().split("T")[0]);
    }

    if (selectedBidang !== "all") {
      query = query.eq("bidang", selectedBidang);
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

      if (selectedMonth !== "all") {
        const monthInt = parseInt(selectedMonth) - 1;
        formattedData = formattedData.filter(item => item.tanggal.getMonth() === monthInt);
      }

      // Calculate aggregated data
      let totalGu = 0;
      let totalLs = 0;
      const countByBidang: { [key: string]: number } = {};

      formattedData.forEach(item => {
        if (item.jenisSpj === "GU") {
          totalGu++;
        } else if (item.jenisSpj === "LS") {
          totalLs++;
        }
        if (item.bidang) {
          countByBidang[item.bidang] = (countByBidang[item.bidang] || 0) + 1;
        }
      });

      setSpjData(formattedData);
      setTotalSpjGu(totalGu);
      setTotalSpjLs(totalLs);
      setSpjCountByBidang(countByBidang);
    }
    setIsLoadingSpj(false);
  }, [session, selectedYear, selectedMonth, selectedBidang]);

  useEffect(() => {
    if (!isSessionLoading && session) {
      fetchSpjData();
    }
  }, [isSessionLoading, session, fetchSpjData]);

  const filteredSpjData = useMemo(() => {
    let currentFilteredData = spjData;

    if (searchKeyword) {
      const lowercasedKeyword = searchKeyword.toLowerCase();
      currentFilteredData = currentFilteredData.filter(item =>
        item.uraian.toLowerCase().includes(lowercasedKeyword)
      );
    }

    if (searchNomorPembukuan) { // New filter for Nomor Pembukuan
      const lowercasedNomorPembukuan = searchNomorPembukuan.toLowerCase();
      currentFilteredData = currentFilteredData.filter(item =>
        item.nomorPembukuan.toLowerCase().includes(lowercasedNomorPembukuan)
      );
    }

    return currentFilteredData;
  }, [spjData, searchKeyword, searchNomorPembukuan]); // Add searchNomorPembukuan to dependencies

  const handleSaveSpj = useCallback(async (
    data: Omit<SPJ, "id" | "fileUrl"> & { file?: File | GoogleDriveFile },
    editingSpj: SPJ | null,
    onSuccess: () => void
  ) => {
    const toastId = showLoading("Menyimpan data...");
    let fileUrl: string | null = editingSpj?.fileUrl || null;

    if (data.file) {
      let fileToUpload: File | Blob;
      let fileName: string;

      if (data.file instanceof File) {
        fileToUpload = data.file;
        fileName = `${new Date().toISOString()}_${data.file.name}`;
      } else { // GoogleDriveFile
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
    onSuccess();
    fetchSpjData();
  }, [fetchSpjData]);

  const handleDeleteSpj = useCallback(async (id: string) => {
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
    fetchSpjData();
  }, [spjData, fetchSpjData]);

  const fetchFilesForDownload = useCallback(async (yearToDownload: string, monthToDownload: string, bidangToDownload: string): Promise<SpjDownloadItem[]> => {
    let query = supabase.from("spj").select("nomor_pembukuan, file_url, tanggal").not("file_url", "is", null);

    if (yearToDownload !== "all") {
      const yearInt = parseInt(yearToDownload);
      if (monthToDownload !== "all") {
        const monthInt = parseInt(monthToDownload) - 1;
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

    if (bidangToDownload !== "all") {
      query = query.eq("bidang", bidangToDownload);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching files for download:", error);
      return [];
    }

    let filteredData: SpjDownloadItem[] = data;
    if (yearToDownload === "all" && monthToDownload !== "all") {
      const monthInt = parseInt(monthToDownload) - 1;
      filteredData = data.filter((item: SpjDownloadItem) => {
        const dateParts = item.tanggal.split('-').map(Number);
        const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        return localDate.getMonth() === monthInt;
      });
    }
    return filteredData;
  }, []);

  const handleDownloadArchives = useCallback(async (yearToDownload: string, monthToDownload: string) => {
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
                    zip.file(`${item.nomor_pembukuan}_${originalFilename}`, blob); // Fixed: Use item.nomor_pembukuan
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
  }, [fetchFilesForDownload, selectedBidang, months]);


  return {
    spjData,
    filteredSpjData,
    isLoadingSpj,
    fetchSpjData,
    handleSaveSpj,
    handleDeleteSpj,
    handleDownloadArchives,
    totalSpjGu, // New return value
    totalSpjLs, // New return value
    spjCountByBidang, // New return value
  };
};