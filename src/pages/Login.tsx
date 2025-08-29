"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { showError } from "@/utils/toast";
import { Archive } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

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
            Selamat Datang
          </h2>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "hsl(var(--accent))",
                  brandAccent: "hsl(var(--destructive))",
                },
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin + "/"}
          view="sign_in" // Only show sign-in form
          localization={{
            variables: {
              sign_in: {
                email_label: "Alamat Email",
                password_label: "Kata Sandi",
                email_input_placeholder: "Masukkan alamat email Anda",
                password_input_placeholder: "Masukkan kata sandi Anda",
                button_label: "Masuk",
                social_provider_text: "Masuk dengan {{provider}}",
                link_text: "Lupa kata sandi Anda?", // Only show forgotten password link
              },
              forgotten_password: {
                email_label: "Alamat Email",
                password_label: "Kata Sandi Baru",
                email_input_placeholder: "Masukkan alamat email Anda",
                button_label: "Kirim instruksi reset kata sandi",
                link_text: "Lupa kata sandi Anda?",
              },
              update_password: {
                password_label: "Kata Sandi Baru",
                password_input_placeholder: "Masukkan kata sandi baru Anda",
                button_label: "Perbarui kata sandi",
              },
            },
          }}
          magicLink
          showLinks={false} // Mengatur ini ke false untuk menyembunyikan semua tautan bawaan
        />
        <div className="text-sm text-center mt-4">
          Belum punya akun?{" "}
          <Link to="/signup" className="font-medium text-primary hover:text-primary-dark">
            Daftar di sini
          </Link>
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">v.1.0.76</p>
      </div>
    </div>
  );
};

export default Login;