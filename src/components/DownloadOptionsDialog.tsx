import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DownloadCloud } from "lucide-react";

type DownloadOptionsDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (year: string, month: string) => void;
  years: string[];
  months: { value: string; label: string }[];
  initialYear: string;
  initialMonth: string;
};

export const DownloadOptionsDialog = ({
  isOpen,
  onOpenChange,
  onDownload,
  years,
  months,
  initialYear,
  initialMonth,
}: DownloadOptionsDialogProps) => {
  const [downloadYear, setDownloadYear] = useState<string>(initialYear);
  const [downloadMonth, setDownloadMonth] = useState<string>(initialMonth);

  useEffect(() => {
    if (isOpen) {
      setDownloadYear(initialYear);
      setDownloadMonth(initialMonth);
    }
  }, [isOpen, initialYear, initialMonth]);

  const handleDownloadByYear = () => {
    onDownload(downloadYear, "all"); // Unduh semua bulan untuk tahun yang dipilih
    onOpenChange(false);
  };

  const handleDownloadByMonth = () => {
    onDownload(downloadYear, downloadMonth); // Unduh bulan dan tahun yang spesifik
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg"> {/* Diubah dari sm:max-w-[425px] menjadi sm:max-w-lg */}
        <DialogHeader>
          <DialogTitle>Pilih Opsi Unduh Arsip</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="downloadYear" className="text-right">
              Tahun
            </label>
            <Select value={downloadYear} onValueChange={setDownloadYear}>
              <SelectTrigger className="col-span-3">
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
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="downloadMonth" className="text-right">
              Bulan
            </label>
            <Select
              value={downloadMonth}
              onValueChange={setDownloadMonth}
            >
              <SelectTrigger className="col-span-3">
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
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleDownloadByYear}
            disabled={downloadYear === "all" && downloadMonth !== "all"}
          >
            <DownloadCloud className="mr-2 h-4 w-4" />
            Unduh per Tahun
          </Button>
          <Button
            type="button"
            onClick={handleDownloadByMonth}
            disabled={downloadYear === "all" || downloadMonth === "all"}
          >
            <DownloadCloud className="mr-2 h-4 w-4" />
            Unduh per Bulan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};