import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileQuestion } from "lucide-react";

interface FileViewerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string | null;
}

const getViewerInfo = (url: string | null): { url: string; type: 'iframe' | 'image' | 'unsupported' } => {
  if (!url) return { url: "", type: 'unsupported' };
  const extension = url.split('?')[0].split('.').pop()?.toLowerCase();
  const encodedUrl = encodeURIComponent(url);

  switch (extension) {
    case 'pdf':
      return { url: `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`, type: 'iframe' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return { url: url, type: 'image' };
    case 'doc':
    case 'docx':
    case 'xls':
    case 'xlsx':
    case 'ppt':
    case 'pptx':
      return { url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`, type: 'iframe' };
    default:
      return { url: url, type: 'unsupported' };
  }
};

export const FileViewerDialog: React.FC<FileViewerDialogProps> = ({
  isOpen,
  onOpenChange,
  fileUrl,
}) => {
  const { url: viewerUrl, type: viewerType } = getViewerInfo(fileUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pratinjau Berkas</DialogTitle>
        </DialogHeader>
        <div className="flex-grow bg-gray-100 dark:bg-gray-800 rounded-md">
          {viewerType === 'unsupported' ? (
            <div className="flex flex-col items-center justify-center h-full">
              <FileQuestion className="w-12 h-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium text-gray-600">Format Tidak Didukung</h3>
              <p className="text-sm text-gray-500">Pratinjau untuk jenis file ini tidak tersedia.</p>
              <a href={viewerUrl || '#'} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-primary hover:underline">
                Buka di tab baru atau unduh file
              </a>
            </div>
          ) : viewerType === 'image' ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img src={viewerUrl} alt="Pratinjau Berkas" className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
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
  );
};