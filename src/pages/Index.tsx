import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SpjForm } from "@/components/SpjForm";
import { SpjTable } from "@/components/SpjTable";
import { SPJ } from "@/types/spj";
import { exportToPdf } from "@/lib/pdfGenerator";
import { FileDown, PlusCircle, FolderArchive, FileQuestion } from "lucide-react";
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

  const fetchSpjData = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("spj")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) {
      showError("Gagal memuat data: " + error.message);
    } else {
      const formattedData = data.map((item: any) => ({
        id: item.id,
        nomorPembukuan: item.nomor_pembukuan,
        kodeRekening: item.kode_rekening,
        jenisSpj: item.jenis_spj,
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
    fetchSpjData();
  }, []);

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
    fetchSpjData();
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
    fetchSpjData();
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

  const getViewerUrl = (url: string | null): { url: string; unsupported: boolean } => {
    if (!url) return { url: "", unsupported: true };
    const extension = url.split('.').pop()?.toLowerCase();
    const encodedUrl = encodeURIComponent(url);

    switch (extension) {
      case 'pdf':
        return { url: url, unsupported: false };
      case 'doc':
      case 'docx':
      case 'xls':
      case 'xlsx':
      case 'ppt':
      case 'pptx':
        return { url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`, unsupported: false };
      default:
        return { url: '', unsupported: true };
    }
  };

  const { url: viewerUrl, unsupported } = getViewerUrl(selectedFileUrl);

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
            onClick={() => exportToPdf(spjData)}
            disabled={spjData.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Cetak Laporan (PDF)
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

      <SpjTable
        data={spjData}
        onEdit={handleEdit}
        onDelete={handleDeleteSpj}
        onViewFile={handleViewFile}
        isLoading={isLoading}
      />

      <Dialog open={isFileViewerOpen} onOpenChange={setIsFileViewerOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pratinjau Berkas</DialogTitle>
          </DialogHeader>
          <div className="flex-grow">
            {unsupported ? (
              <div className="flex flex-col items-center justify-center h-full border rounded-md bg-gray-50">
                <FileQuestion className="w-12 h-12 text-destructive mb-4" />
                <h3 className="text-lg font-medium text-gray-600">Format Tidak Didukung</h3>
                <p className="text-sm text-gray-500">Pratinjau untuk jenis file ini tidak tersedia.</p>
                <a href={selectedFileUrl || '#'} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-primary hover:underline">
                  Unduh file
                </a>
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