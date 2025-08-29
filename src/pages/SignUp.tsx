"use client";

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Archive, User, Mail, Lock, Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bidangOptions } from "@/types/spj";

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nip, setNip] = useState("");
  const [position, setPosition] = useState("");
  const [bidang, setBidang] = useState("");
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
            last_name: lastName,
            nip: nip,
            position: position,
            bidang: bidang,
          },
        },
      });

      if (error) {
        showError("Gagal mendaftar: " + error.message);
      } else if (data.user) {
        showSuccess("Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.");
        navigate("/login"); // Redirect to login after successful sign-up
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
            <Archive className="h-12 w-12 text-primary" />
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
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <Label htmlFor="first-name" className="sr-only">Nama Depan</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="first-name"
                  name="first-name"
                  type="text"
                  autoComplete="given-name"
                  required
                  className="pl-9 mb-3"
                  placeholder="Nama Depan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="last-name" className="sr-only">Nama Belakang</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="last-name"
                  name="last-name"
                  type="text"
                  autoComplete="family-name"
                  required
                  className="pl-9 mb-3"
                  placeholder="Nama Belakang"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="nip" className="sr-only">NIP</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nip"
                  name="nip"
                  type="text"
                  autoComplete="off"
                  required
                  className="pl-9 mb-3"
                  placeholder="NIP"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="position" className="sr-only">Jabatan</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="position"
                  name="position"
                  type="text"
                  autoComplete="off"
                  required
                  className="pl-9 mb-3"
                  placeholder="Jabatan"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="mb-3">
              <Label htmlFor="bidang" className="sr-only">Bidang</Label>
              <Select onValueChange={setBidang} value={bidang} disabled={loading}>
                <SelectTrigger className="w-full pl-9">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-9 mb-3"
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={loading}
            >
              {loading ? "Mendaftar..." : "Daftar"}
            </Button>
          </div>
        </form>
        <div className="text-sm text-center mt-4">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary-foreground">
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;