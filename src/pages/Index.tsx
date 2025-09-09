import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SpjForm } from "@/components/SpjForm";
import { SpjTable } from "@/components/SpjTable";
import { SPJ } from "@/types/spj";
import { exportToExcel } from "@/lib/excelGenerator";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { showLoading, showError, dismissToast, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client"; // Import supabase client

// Import new modular components and hooks
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGoogleDriveIntegration } from "@/hooks/useGoogleDriveIntegration";
import { useSpjData } from "@/hooks/useSpjData";
import { SpjHeader } from "@/components/SpjHeader";
import { SpjFilters } from "@/components/SpjFilters";
import { FileViewerDialog } from "@/components/FileViewerDialog";
import { DownloadOptionsDialog } from "@/components/DownloadOptionsDialog";
import { SpjDashboard } from "@/components/SpjDashboard"; // Import SpjDashboard

const Index = () => {
  const navigate = useNavigate();
  const { session, isLoading: isSessionLoading } = useSession();

  // Custom Hooks
  const { userProfile, isLoadingProfile } = useUserProfile();
  const isAdmin = userProfile?.jabatan === "Bendahara Pengeluaran";

  // State for filters
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedBidang, setSelectedBidang] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Effect to set initial selectedBidang based on user profile
  useEffect(() => {
    if (!isLoadingProfile && userProfile && !isAdmin && userProfile.bidang) {
      setSelectedBidang(userProfile.bidang);
    } else if (!isLoadingProfile && isAdmin) {
      setSelectedBidang("all"); // Admin can see all
    }
  }, [isLoadingProfile, userProfile, isAdmin]);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpj, setEditingSpj] = useState<SPJ | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [isDownloadOptionsOpen, setIsDownloadOptionsOpen] = useState(false);

  // Data for filter dropdowns
  const years = ["2023", "2024", "2025", "2026"];
  const months = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" },
    { value: "3", label: "Maret" }, { value: "4", label: "April" },
    { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" },
    { value: "9", label: "September" }, { value: "10", label: "Oktober" },
    { value: "11", label: "November" }, { value: "12", label: "Desember" },
  ];

  const { isGoogleApiLoaded, handleTransferToDrive } = useGoogleDriveIntegration();
  const {
    spjData,
    filteredSpjData,
    isLoadingSpj,
    handleSaveSpj,
    handleDeleteSpj,
    handleDownloadArchives,
    totalSpjGu, // New
    totalSpjLs, // New
    spjCountByBidang, // New
  } = useSpjData({
    session,
    isSessionLoading,
    selectedYear,
    selectedMonth,
    selectedBidang,
    searchKeyword,
    months,
  });

  console.log("Index - isSessionLoading:", isSessionLoading, "isLoadingProfile:", isLoadingProfile, "userProfile:", userProfile);
  console.log("Index - isLoadingSpj:", isLoadingSpj, "spjData length:", spjData.length);

  // Handlers for UI actions
  const handleAddSpj = () => {
    setEditingSpj(null);
    setIsFormOpen(true);
  };

  const handleEditSpj = (spj: SPJ) => {
    setEditingSpj(spj);
    setIsFormOpen(true);
  };

  const handleFormDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingSpj(null);
    }
  };

  const handleSaveSpjAndCloseForm = async (data: Omit<SPJ, "id" | "fileUrl"> & { file?: File | { name: string; url: string; token: string } }) => {
    await handleSaveSpj(data, editingSpj, () => {
      setIsFormOpen(false);
      setEditingSpj(null);
    });
  };

  const handleViewFile = (url: string) => {
    setSelectedFileUrl(url);
    setIsFileViewerOpen(true);
  };

  const handleDownloadFile = async (url: string) => {
    if (!url) {
      showError("Tidak ada file untuk diunduh.");
      return;
    }
    const toastId = showLoading("Mengunduh file...");
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Gagal mengunduh file: ${response.statusText}`);
      }
      const blob = await response.blob();
      
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      
      const filename = url.split("/").pop() || "downloaded-file";
      const originalFilename = filename.substring(filename.indexOf('_') + 1);
      link.download = originalFilename;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      
      dismissToast(toastId);
      showSuccess("File berhasil diunduh.");
    } catch (error) {
      dismissToast(toastId);
      console.error("Download error:", error);
      showError(error instanceof Error ? error.message : "Terjadi kesalahan saat mengunduh file.");
    }
  };

  const resetFilters = () => {
    setSelectedYear("all");
    setSelectedMonth("all");
    // Reset bidang based on role
    if (isAdmin) {
      setSelectedBidang("all");
    } else if (userProfile?.bidang) {
      setSelectedBidang(userProfile.bidang);
    }
    setSearchKeyword("");
  };

  const handleLogout = async () => {
    const toastId = showLoading("Logging out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      dismissToast(toastId);
      showError("Gagal logout: " + error.message);
    } else {
      dismissToast(toastId);
      showSuccess("Berhasil logout!");
      navigate("/login");
    }
  };

  if (isSessionLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-100 text-blue-800 text-xl font-semibold">
        Loading user session and profile...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-full px-4 sm:px-6 lg:px-8">
      <SpjHeader
        userProfile={userProfile}
        spjData={spjData}
        onPrintReport={exportToExcel}
        onAddSpj={handleAddSpj}
        onLogout={handleLogout}
      />

      <SpjDashboard
        totalSpjGu={totalSpjGu}
        totalSpjLs={totalSpjLs}
        spjCountByBidang={spjCountByBidang}
      />

      <SpjFilters
        years={years}
        months={months}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedBidang={selectedBidang}
        setSelectedBidang={setSelectedBidang}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        resetFilters={resetFilters}
        onDownloadArchivesClick={() => setIsDownloadOptionsOpen(true)}
        isLoadingSpj={isLoadingSpj}
        spjDataLength={spjData.length}
        userProfile={userProfile}
      />

      <SpjTable
        data={filteredSpjData}
        onEdit={handleEditSpj}
        onDelete={handleDeleteSpj}
        onViewFile={handleViewFile}
        onDownload={handleDownloadFile}
        onTransferToDrive={handleTransferToDrive}
        isLoading={isLoadingSpj}
      />

      <Dialog open={isFormOpen} onOpenChange={handleFormDialogChange}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSpj ? "Edit Arsip SPJ" : "Tambah Arsip SPJ Baru"}
            </DialogTitle>
          </DialogHeader>
          <SpjForm
            onSubmit={handleSaveSpjAndCloseForm}
            onCancel={() => handleFormDialogChange(false)}
            initialData={editingSpj}
          />
        </DialogContent>
      </Dialog>

      <FileViewerDialog
        isOpen={isFileViewerOpen}
        onOpenChange={setIsFileViewerOpen}
        fileUrl={selectedFileUrl}
      />

      <DownloadOptionsDialog
        isOpen={isDownloadOptionsOpen}
        onOpenChange={setIsDownloadOptionsOpen}
        onDownload={handleDownloadArchives}
        years={years}
        months={months}
        initialYear={selectedYear}
        initialMonth={selectedMonth}
      />
    </div>
  );
};

export default Index;