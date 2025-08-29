import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, FolderArchive, FileSpreadsheet, LogOut, UserCircle } from "lucide-react";
import { SPJ } from "@/types/spj";
import { UserProfile } from "@/types/user"; // Import UserProfile dari file terpusat

interface SpjHeaderProps {
  userProfile: UserProfile | null;
  spjData: SPJ[];
  onPrintReport: (data: SPJ[]) => void;
  onAddSpj: () => void;
  onLogout: () => void;
}

export const SpjHeader: React.FC<SpjHeaderProps> = ({
  userProfile,
  spjData,
  onPrintReport,
  onAddSpj,
  onLogout,
}) => {
  const isAdmin = userProfile?.jabatan === "Bendahara Pengeluaran";

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <FolderArchive className="h-12 w-12 text-primary" />
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight">
            e-SPJ
          </h1>
          <p className="text-muted-foreground">
            BAPPEDA KAB. LOMBOK BARAT
          </p>
          {userProfile ? (
            <div className="text-sm text-muted-foreground mt-2">
              <p className="flex items-center gap-1">
                <UserCircle className="h-4 w-4" />
                {userProfile.first_name} {userProfile.last_name}
              </p>
              <p className="flex items-center gap-1">
                <span className="font-semibold">NIP:</span> {userProfile.nip}
              </p>
              <p className="flex items-center gap-1">
                <span className="font-semibold">Jabatan:</span> {userProfile.jabatan}
              </p>
              <p className="flex items-center gap-1">
                <span className="font-semibold">Bidang:</span> {userProfile.bidang}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              Memuat profil pengguna...
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={spjData.length === 0}
          onClick={() => onPrintReport(spjData)}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Cetak Laporan
        </Button>
        {/* Tombol Tambah Arsip SPJ sekarang selalu terlihat */}
        <Button onClick={onAddSpj}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Arsip SPJ
        </Button>
        <Button variant="destructive" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};