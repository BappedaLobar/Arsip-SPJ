import { useEffect } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { SPJ } from "@/types/spj";

const formSchema = z.object({
  nomorPembukuan: z.string().min(1, "No. Pembukuan harus diisi"),
  kodeRekening: z.string().min(1, "Kode Rekening harus diisi"),
  jenisSpj: z.enum(["GU", "LS"], { required_error: "Jenis SPJ harus dipilih" }),
  tanggal: z.date({ required_error: "Tanggal harus diisi" }),
  uraian: z.string().min(1, "Uraian harus diisi"),
  jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  file: z.any().optional(),
});

type SpjFormProps = {
  onSubmit: (data: Omit<SPJ, "id">) => void;
  onCancel: () => void;
  initialData?: SPJ | null;
};

export const SpjForm = ({ onSubmit, onCancel, initialData }: SpjFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
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
        file: undefined, // File input cannot be programmatically set for security reasons
      });
    } else {
      form.reset({
        nomorPembukuan: "",
        kodeRekening: "",
        uraian: "",
        jumlah: 0,
        jenisSpj: undefined,
        tanggal: undefined,
        file: undefined,
      });
    }
  }, [initialData, form]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    const file = values.file?.[0];
    onSubmit({
      nomorPembukuan: values.nomorPembukuan,
      kodeRekening: values.kodeRekening,
      jenisSpj: values.jenisSpj,
      tanggal: values.tanggal,
      uraian: values.uraian,
      jumlah: values.jumlah,
      file: file || initialData?.file, // Keep existing file if a new one isn't uploaded
    });
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
                        format(field.value, "PPP")
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
                <Input type="number" placeholder="Masukkan jumlah dalam angka" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <UploadCloud className="mr-2 h-4 w-4 text-primary" />
                Upload File (PDF/JPG/PNG)
              </FormLabel>
              <FormControl>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" {...form.register("file")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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