import { Paperclip, FileQuestion } from "lucide-react";

type FileViewerProps = {
  fileUrl: string | null | undefined;
};

export const FileViewer = ({ fileUrl }: FileViewerProps) => {
  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full border rounded-md bg-gray-50">
        <Paperclip className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600">Pratinjau Berkas</h3>
        <p className="text-sm text-gray-500">Pilih berkas dari tabel untuk melihat pratinjau di sini.</p>
      </div>
    );
  }

  const getViewerUrl = (url: string): { url: string; unsupported: boolean } => {
    const extension = url.split('.').pop()?.toLowerCase();
    const encodedUrl = encodeURIComponent(url);

    switch (extension) {
      case 'pdf':
        return { url: url, unsupported: false };
      case 'doc':
      case 'docx':
      case 'xls':
      case 'xlsx':
      case 'ppt':
      case 'pptx':
        return { url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`, unsupported: false };
      default:
        return { url: '', unsupported: true };
    }
  };

  const { url: viewerUrl, unsupported } = getViewerUrl(fileUrl);

  if (unsupported) {
    return (
      <div className="flex flex-col items-center justify-center h-full border rounded-md bg-gray-50">
        <FileQuestion className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium text-gray-600">Format Tidak Didukung</h3>
        <p className="text-sm text-gray-500">Pratinjau untuk jenis file ini tidak tersedia.</p>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-primary hover:underline">
          Unduh file
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-full border rounded-md overflow-hidden">
      <iframe
        src={viewerUrl}
        className="w-full h-full border-0"
        title="File Viewer"
      />
    </div>
  );
};