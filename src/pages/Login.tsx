"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { showError } from "@/utils/toast";

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

    // Check initial session
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
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Masuk atau Daftar
        </h2>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Anda bisa menambahkan 'google', 'github', dll. di sini
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "hsl(var(--primary))",
                  brandAccent: "hsl(var(--primary-foreground))",
                },
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin + "/"}
          localization={{
            variables: {
              sign_in: {
                email_label: "Alamat Email",
                password_label: "Kata Sandi",
                email_input_placeholder: "Masukkan alamat email Anda",
                password_input_placeholder: "Masukkan kata sandi Anda",
                button_label: "Masuk",
                social_provider_text: "Masuk dengan {{provider}}",
                link_text: "Sudah punya akun? Masuk",
              },
              sign_up: {
                email_label: "Alamat Email",
                password_label: "Kata Sandi",
                email_input_placeholder: "Masukkan alamat email Anda",
                password_input_placeholder: "Buat kata sandi Anda",
                button_label: "Daftar",
                social_provider_text: "Daftar dengan {{provider}}",
                link_text: "Belum punya akun? Daftar",
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
          showLinks={true}
        />
      </div>
    </div>
  );
};

export default Login;