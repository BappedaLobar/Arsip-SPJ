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
import { gapi } from "gapi-script";

const formSchema = z.object({
  nomorPembukuan: z.string().min(1, "No. Pembukuan harus diisi"),
  kodeRekening: z.string().min(1, "Kode Rekening harus diisi"),
  jenisSpj: z.enum(["GU", "LS"], { required_error: "Jenis SPJ harus dipilih" }),
  bidang: z.enum(bidangOptions, { required_error: "Bidang harus dipilih" }),
  tanggal: z.date({ required_error: "Tanggal harus diisi" }),
  uraian: z.string().min(1, "Uraian harus diisi"),
  jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  file: z.any().optional(),
});

type SpjFormProps = {
  onSubmit: (data: Omit<SPJ, "id" | "fileUrl"> & { file?: File | { name: string; url: string } }) => void;
  onCancel: () => void;
  initialData?: SPJ | null;
};

export const SpjForm = ({ onSubmit, onCancel, initialData }: SpjFormProps) => {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomorPembukuan: "",
      kodeRekening: "",
      uraian: "",
      jumlah: 0,
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
        bidang: undefined,
        tanggal: undefined,
        file: undefined,
      });
      setSelectedFileName(null);
    }
  }, [initialData, form]);

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

  const handleGoogleDriveImport = () => {
    const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

    if (!API_KEY || !CLIENT_ID) {
      alert("Konfigurasi Google Drive API tidak ditemukan.");
      return;
    }

    const initializeGapi = () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
      }).then(() => {
        showPicker();
      });
    };

    const showPicker = () => {
      const token = gapi.auth.getToken();
      if (!token) {
        gapi.auth.authorize({ client_id: CLIENT_ID, scope: SCOPES, immediate: false }, (authResult) => {
          if (authResult && !authResult.error) {
            createPicker(authResult.access_token);
          }
        });
      } else {
        createPicker(token.access_token);
      }
    };

    const createPicker = (accessToken: string) => {
      const view = new google.picker.DocsView();
      view.setMimeTypes("application/pdf,image/png,image/jpeg");
      const picker = new google.picker.PickerBuilder()
        .setAppId(CLIENT_ID.split('-')[0])
        .setOAuthToken(accessToken)
        .addView(view)
        .setDeveloperKey(API_KEY)
        .setCallback(pickerCallback)
        .build();
      picker.setVisible(true);
    };

    const pickerCallback = (data: any) => {
      if (data.action === google.picker.Action.PICKED) {
        const doc = data.docs[0];
        const fileData = {
          name: doc.name,
          url: `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
          token: gapi.auth.getToken().access_token,
        };
        form.setValue("file", fileData as any);
        setSelectedFileName(doc.name);
      }
    };

    gapi.load("client:picker", initializeGapi);
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
            <Button type="button" variant="outline" onClick={handleGoogleDriveImport}>
              <Cloud className="mr-2 h-4 w-4" />
              Drive
            </Button>
          </div>
          {selectedFileName && (
            <p className="text-sm text-muted-foreground mt-2">
              File terpilih: {selectedFileName}
            </p>
          )}
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