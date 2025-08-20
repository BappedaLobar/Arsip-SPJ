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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { SPJ } from "@/types/spj";

type SpjTableProps = {
  data: SPJ[];
  onDelete: (id: string) => void;
  onEdit: (spj: SPJ) => void;
};

export const SpjTable = ({ data, onDelete, onEdit }: SpjTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. SPJ</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Uraian</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
            <TableHead>File</TableHead>
            <TableHead>
              <span className="sr-only">Aksi</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.nomorSpj}</TableCell>
                <TableCell>{item.jenisSpj}</TableCell>
                <TableCell>
                  {item.tanggal.toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell>{item.uraian}</TableCell>
                <TableCell className="text-right">
                  {`Rp ${item.jumlah.toLocaleString("id-ID")}`}
                </TableCell>
                <TableCell>{item.file?.name || "Tidak ada file"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Buka menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
              <TableCell colSpan={7} className="h-24 text-center">
                Belum ada data.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};