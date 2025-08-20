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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { SPJ } from "@/types/spj";

const formSchema = z.object({
  nomorSpj: z.string().min(1, "Nomor SPJ harus diisi"),
  jenisSpj: z.enum(["GU", "LS"], { required_error: "Jenis SPJ harus dipilih" }),
  tanggal: z.date({ required_error: "Tanggal harus diisi" }),
  uraian: z.string().min(1, "Uraian harus diisi"),
  jumlah: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
  file: z.any().optional(),
});

type SpjFormProps = {
  onSubmit: (data: Omit<SPJ, "id">) => void;
  onCancel: () => void;
};

export const SpjForm = ({ onSubmit, onCancel }: SpjFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomorSpj: "",
      uraian: "",
      jumlah: 0,
    },
  });

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    const file = values.file?.[0];
    onSubmit({ ...values, jenisSpj: values.jenisSpj!, tanggal: values.tanggal!, file });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nomorSpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor SPJ</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan nomor SPJ" {...field} />
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
              <FormLabel>Jenis SPJ</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormLabel>Tanggal</FormLabel>
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
              <FormLabel>Uraian</FormLabel>
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
              <FormLabel>Jumlah (Rp)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Masukkan jumlah" {...field} />
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
              <FormLabel>Upload File (PDF/JPG/PNG)</FormLabel>
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
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </Form>
  );
};