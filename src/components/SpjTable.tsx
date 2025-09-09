import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Download, Eye, CloudUpload } from "lucide-react"; // Import CloudUpload icon
import { SPJ } from "@/types/spj";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/hooks/useUserProfile"; // Import useUserProfile

type SpjTableProps = {
  data: SPJ[];
  onDelete: (id: string) => void;
  onEdit: (spj: SPJ) => void;
  onViewFile: (url: string) => void;
  onDownload: (url: string) => void;
  onTransferToDrive: (spj: SPJ) => void; // New prop for Google Drive transfer
  isLoading: boolean;
};

export const SpjTable = ({
  data,
  onDelete,
  onEdit,
  onViewFile,
  onDownload,
  onTransferToDrive, // Destructure new prop
  isLoading,
}: SpjTableProps) => {
  const { userProfile } = useUserProfile();
  const isAdmin = userProfile?.jabatan === "Bendahara Pengeluaran";

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">No. Pembukuan</TableHead>
            <TableHead>Kode Rekening</TableHead>
            <TableHead className="w-[180px]">Tanggal</TableHead>
            <TableHead>Jenis SPJ</TableHead>
            <TableHead>Bidang</TableHead>
            <TableHead className="w-[30%]">Uraian</TableHead>
            <TableHead className="text-right">Terbilang (Rp)</TableHead>
            <TableHead>Berkas</TableHead>
            <TableHead>
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={9}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : data.length > 0 ? (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.nomorPembukuan}
                </TableCell>
                <TableCell>{item.kodeRekening}</TableCell>
                <TableCell>
                  {item.tanggal.toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={item.jenisSpj === "GU" ? "default" : "secondary"}>
                    {item.jenisSpj}
                  </Badge>
                </TableCell>
                <TableCell>{item.bidang || "-"}</TableCell>
                <TableCell>{item.uraian}</TableCell>
                <TableCell className="text-right">
                  {`Rp ${item.jumlah.toLocaleString("id-ID")}`}
                </TableCell>
                <TableCell>
                  {item.fileUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewFile(item.fileUrl!)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Lihat
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Tidak ada</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Buka menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => item.fileUrl && onDownload(item.fileUrl)}
                        disabled={!item.fileUrl}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        <span>Unduh File Arsip</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => item.fileUrl && onTransferToDrive(item)}
                        disabled={!item.fileUrl}
                      >
                        <CloudUpload className="mr-2 h-4 w-4" />
                        <span>Transfer ke Google Drive</span>
                      </DropdownMenuItem>
                      {(isAdmin || item.bidang === userProfile?.bidang) && ( // Hanya tampilkan Edit jika admin atau bidang cocok
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                      )}
                      {isAdmin && ( // Hanya tampilkan Hapus jika admin
                        <DropdownMenuItem
                          onClick={() => onDelete(item.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Hapus</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                Belum ada data. Silakan tambahkan arsip baru.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};