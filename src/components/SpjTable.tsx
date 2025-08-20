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
import { MoreHorizontal, Pencil, Trash2, Link as LinkIcon, Eye } from "lucide-react";
import { SPJ } from "@/types/spj";
import { Skeleton } from "@/components/ui/skeleton";

type SpjTableProps = {
  data: SPJ[];
  onDelete: (id: string) => void;
  onEdit: (spj: SPJ) => void;
  onViewFile: (url: string) => void;
  isLoading: boolean;
};

export const SpjTable = ({
  data,
  onDelete,
  onEdit,
  onViewFile,
  isLoading,
}: SpjTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Pembukuan</TableHead>
            <TableHead>Uraian</TableHead>
            <TableHead className="text-right">Terbilang (Rp)</TableHead>
            <TableHead>Tanggal</TableHead>
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
                <TableCell colSpan={6}>
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
                <TableCell>{item.uraian}</TableCell>
                <TableCell className="text-right">
                  {`Rp ${item.jumlah.toLocaleString("id-ID")}`}
                </TableCell>
                <TableCell>
                  {item.tanggal.toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
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
                       <DropdownMenuItem asChild>
                        <a href={item.fileUrl || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center w-full cursor-pointer">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          <span>Lihat di Tab Baru</span>
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(item.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Hapus</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Belum ada data. Silakan tambahkan arsip baru.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};