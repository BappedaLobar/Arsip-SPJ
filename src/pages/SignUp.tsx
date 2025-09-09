"use client";

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Archive, User, Mail, Lock, Briefcase, CreditCard, Building } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bidangOptions } from "@/types/spj";

const jabatanOptions = [
  "Bendahara Pengeluaran",
  "Bendahara Pembantu",
] as const;

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [nip, setNip] = useState("");
  const [jabatan, setJabatan] = useState<typeof jabatanOptions[number]>("Bendahara Pembantu");
  const [bidang, setBidang] = useState<typeof bidangOptions[number]>(bidangOptions[0]);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = showLoading("Mendaftar akun...");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            nip: nip,
            jabatan: jabatan,
            bidang: bidang,
          },
        },
      });

      if (error) {
        showError("Gagal mendaftar: " + error.message);
      } else if (data.session) {
        showSuccess("Pendaftaran berhasil! Anda telah masuk.");
        navigate("/");
      } else if (data.user && !data.session) {
        showError("Pendaftaran berhasil, tetapi verifikasi email diperlukan. Silakan cek email Anda.");
        navigate("/login");
      } else {
        showError("Pendaftaran gagal. Silakan coba lagi.");
      }
    } catch (error: any) {
      showError("Terjadi kesalahan: " + error.message);
    } finally {
      dismissToast(toastId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Archive className="h-12 w-12 text-primary flex-shrink-0" />
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
              e-SPJ
            </h1>
          </div>
          <p className="mt-2 text-xl text-gray-700">Bappeda</p>
          <p className="text-lg text-gray-600">Kabupaten Lombok Barat</p>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Daftar Akun Baru
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="first-name" className="sr-only">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                <Input
                  id="first-name"
                  name="first-name"
                  type="text"
                  autoComplete="name"
                  required
                  className="pl-9"
                  placeholder="Nama Lengkap"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="nip" className="sr-only">NIP</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                <Input
                  id="nip"
                  name="nip"
                  type="text"
                  autoComplete="off"
                  required
                  className="pl-9"
                  placeholder="NIP"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="jabatan" className="sr-only">Jabatan</Label>
              <Select onValueChange={(value) => setJabatan(value as typeof jabatanOptions[number])} value={jabatan} disabled={loading}>
                <SelectTrigger className="w-full pl-9">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                  <SelectValue placeholder="Pilih Jabatan" />
                </SelectTrigger>
                <SelectContent>
                  {jabatanOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bidang" className="sr-only">Bidang</Label>
              <Select onValueChange={(value) => setBidang(value as typeof bidangOptions[number])} value={bidang} disabled={loading} required>
                <SelectTrigger className="w-full pl-9">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                  <SelectValue placeholder="Pilih Bidang" />
                </SelectTrigger>
                <SelectContent>
                  {bidangOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="email-address" className="sr-only">Alamat Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-9"
                  placeholder="Alamat Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="sr-only">Kata Sandi</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="pl-9"
                  placeholder="Kata Sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={loading}
            >
              {loading ? "Mendaftar..." : "Daftar"}
            </Button>
          </div>
        </form>
        <div className="text-sm text-center mt-4">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;