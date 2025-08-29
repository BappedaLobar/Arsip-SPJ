import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DownloadCloud, Search, X } from "lucide-react";
import { UserProfile } from "@/types/user"; // Import UserProfile dari file terpusat
import { bidangOptions } from "@/types/spj"; // Tetap import bidangOptions

interface SpjFiltersProps {
  years: string[];
  months: { value: string; label: string }[];
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedBidang: string;
  setSelectedBidang: (bidang: string) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  resetFilters: () => void;
  onDownloadArchivesClick: () => void;
  isLoadingSpj: boolean;
  spjDataLength: number;
  userProfile: UserProfile | null;
}

export const SpjFilters: React.FC<SpjFiltersProps> = ({
  years,
  months,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedBidang,
  setSelectedBidang,
  searchKeyword,
  setSearchKeyword,
  resetFilters,
  onDownloadArchivesClick,
  isLoadingSpj,
  spjDataLength,
  userProfile,
}) => {
  const isAdmin = userProfile?.jabatan === "Bendahara Pengeluaran";
  const userBidang = userProfile?.bidang;

  const showResetButton =
    selectedYear !== "all" ||
    selectedMonth !== "all" ||
    (isAdmin ? selectedBidang !== "all" : false) ||
    searchKeyword !== "";

  return (
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
      <Select
        value={selectedBidang}
        onValueChange={setSelectedBidang}
        disabled={!isAdmin && !!userBidang}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Pilih Bidang" />
        </SelectTrigger>
        <SelectContent>
          {isAdmin && <SelectItem value="all">Semua Bidang</SelectItem>}
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
      {showResetButton && (
        <Button variant="ghost" onClick={resetFilters}>
          <X className="mr-2 h-4 w-4" />
          Reset Filter
        </Button>
      )}
      <Button
        variant="outline"
        onClick={onDownloadArchivesClick}
        disabled={isLoadingSpj || spjDataLength === 0}
      >
        <DownloadCloud className="mr-2 h-4 w-4" />
        Unduh Arsip
      </Button>
    </div>
  );
};