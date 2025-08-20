import { useState } from "react";
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

const Index = () => {
  const [spjData, setSpjData] = useState<SPJ[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddSpj = (data: Omit<SPJ, "id">) => {
    const newSpj: SPJ = {
      id: new Date().toISOString(),
      ...data,
    };
    setSpjData((prev) => [...prev, newSpj]);
    setIsFormOpen(false);
  };

  const handleDeleteSpj = (id: string) => {
    setSpjData((prev) => prev.filter((item) => item.id !== id));
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
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Arsip SPJ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Arsip SPJ Baru</DialogTitle>
              </DialogHeader>
              <SpjForm
                onSubmit={handleAddSpj}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <SpjTable data={spjData} onDelete={handleDeleteSpj} />
      <MadeWithDyad />
    </div>
  );
};

export default Index;