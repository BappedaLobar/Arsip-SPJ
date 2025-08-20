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
import { MadeWithDyad } from "@/components/made-with-dyad";
import { FileDown, PlusCircle, FolderArchive } from "lucide-react";
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
    data: Omit<SPJ, "id" | "fileUrl"> & { file?: File }
  ) => {
    const toastId = showLoading("Menyimpan data...");
    let fileUrl: string | null = editingSpj?.fileUrl || null;

    if (data.file) {
      const file = data.file;
      const fileName = `${new Date().toISOString()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("spj_files")
        .upload(fileName, file);

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

  const handleDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingSpj(null);
    }
  };

  return (
    <div className="container mx-auto py-10">
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
          <Dialog open={isFormOpen} onOpenChange={handleDialogChange}>
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
                onCancel={() => handleDialogChange(false)}
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
        isLoading={isLoading}
      />
      <MadeWithDyad />
    </div>
  );
};

export default Index;