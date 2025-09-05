import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  CircleDollarSign,
  FileText,
  Hash,
  MessageSquare,
  Save,
  Tags,
  UploadCloud,
  Cloud,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { SPJ, bidangOptions } from "@/types/spj";
import { useGoogleDriveIntegration } from "@/hooks/useGoogleDriveIntegration";
import { useUserProfile } from "@/hooks/useUserProfile"; // Import useUserProfile

// Define a simple interface for the Google API authorization result
interface GoogleAuthResult {
  access_token?: string;
  error?: string;
}

interface GoogleDriveFile {
  name: string;
  url: string;
  token: string;
}

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

const formSchema = z.object({
  nomorPembukuan: z.string().min(1, "No. Pembukuan harus diisi"),
  kodeRekening: z.string().min(1, "Kode Rekening harus diisi"),
  jenisSpj: z.enum(["GU", "LS"], { required_error: "Jenis SPJ harus dipilih" }),
  bidang: z.enum(bidangOptions, { required_error: "Bidang harus dipilih" }),
  tanggal: z.date({ required_error: "Tanggal harus diisi" }),
  uraian: z.string().min(1, "Uraian harus diisi"),
  jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  file: z.any()
    .optional()
    .refine((value) => {
      // If no file is selected, or it's not a FileList (e.g., Google Drive object), pass validation
      if (!value || !(value instanceof FileList) || value.length === 0) {
        return true;
      }
      // If it is a FileList, check the size of the first file
      const file = value[0];
      return file.size <= MAX_FILE_SIZE;
    }, "Ukuran file maksimal adalah 3 MB."),
});

type SpjFormProps = {
  onSubmit: (data: Omit<SPJ, "id" | "fileUrl"> & { file?: File | GoogleDriveFile }) => void;
  onCancel: () => void;
  initialData?: SPJ | null;
};

export const SpjForm = ({ onSubmit, onCancel, initialData }: SpjFormProps) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const { isGoogleApiLoaded, handleGoogleDriveImport } = useGoogleDriveIntegration();
  const { userProfile } = useUserProfile(); // Dapatkan profil pengguna
  const isAdmin = userProfile?.jabatan === "Bendahara Pengeluaran";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomorPembukuan: "",
      kodeRekening: "",
      uraian: "",
      jumlah: 0,
      bidang: isAdmin ? undefined : userProfile?.bidang, // Set default bidang jika bukan admin
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        file: undefined,
      });
      setSelectedFileName(null);
    } else {
      form.reset({
        nomorPembukuan: "",
        kodeRekening: "",
        uraian: "",
        jumlah: 0,
        jenisSpj: undefined,
        bidang: isAdmin ? undefined : userProfile?.bidang, // Set default bidang jika bukan admin
        tanggal: undefined,
        file: undefined,
      });
      setSelectedFileName(null);
    }
  }, [initialData, form, isAdmin, userProfile?.bidang]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    const file = values.file?.[0] || values.file;
    onSubmit({
      nomorPembukuan: values.nomorPembukuan,
      kodeRekening: values.kodeRekening,
      jenisSpj: values.jenisSpj,
      bidang: values.bidang,
      tanggal: values.tanggal,
      uraian: values.uraian,
      jumlah: values.jumlah,
      file: file,
    });
  };

  const onGoogleDriveFilePicked = (fileData: GoogleDriveFile) => {
    form.setValue("file", fileData);
    setSelectedFileName(fileData.name);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nomorPembukuan"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-primary" />
                No. Pembukuan
              </FormLabel>
              <FormControl>
                <Input placeholder="Masukkan No. Pembukuan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="kodeRekening"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Hash className="mr-2 h-4 w-4 text-primary" />
                Kode Rekening
              </FormLabel>
              <FormControl>
                <Input placeholder="Masukkan kode rekening" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jenisSpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Tags className="mr-2 h-4 w-4 text-primary" />
                Jenis SPJ
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis SPJ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="GU">SPJ GU</SelectItem>
                  <SelectItem value="LS">SPJ LS</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bidang"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4 text-primary" />
                Bidang
              </FormLabel>
              {/* Properti disabled dihapus agar semua pengguna dapat memilih bidang */}
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bidang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bidangOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tanggal"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                Tanggal
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: id })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    locale={id}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="uraian"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                Uraian
              </FormLabel>
              <FormControl>
                <Textarea placeholder="Masukkan uraian singkat" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jumlah"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <CircleDollarSign className="mr-2 h-4 w-4 text-yellow-500" />
                Terbilang (Rp)
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah dalam angka"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel className="flex items-center">
            <UploadCloud className="mr-2 h-4 w-4 text-primary" />
            Upload File (PDF/JPG/PNG)
          </FormLabel>
          <div className="flex gap-2">
            <FormControl className="flex-grow">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                {...form.register("file")}
                onChange={(e) => {
                  form.register("file").onChange(e);
                  setSelectedFileName(e.target.files?.[0]?.name || null);
                }}
              />
            </FormControl>
            <Button type="button" variant="outline" onClick={() => handleGoogleDriveImport(onGoogleDriveFilePicked)} disabled={!isGoogleApiLoaded}>
              <Cloud className="mr-2 h-4 w-4" />
              Drive
            </Button>
          </div>
          {selectedFileName && (
            <p className="text-sm text-muted-foreground mt-2">
              File terpilih: {selectedFileName}
            </p>
          )}
          <p className="text-xs text-muted-foreground">Ukuran file maksimal 3 MB.</p>
          <FormMessage />
        </FormItem>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            Simpan
          </Button>
        </div>
      </form>
    </Form>
  );
};