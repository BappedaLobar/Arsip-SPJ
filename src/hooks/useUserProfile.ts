import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { showError } from "@/utils/toast";
import { Bidang } from "@/types/spj"; // Import Bidang type

interface UserProfile {
  first_name: string;
  last_name?: string;
  nip: string;
  jabatan: string;
  bidang: Bidang; // Diperbaiki: Menggunakan tipe Bidang
}

export const useUserProfile = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, nip, jabatan, bidang")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error.message);
          showError("Gagal memuat profil pengguna.");
        } else if (data) {
          setUserProfile(data);
        }
      }
      setIsLoadingProfile(false);
    };

    if (session && !isSessionLoading) {
      fetchProfile();
    } else if (!session && !isSessionLoading) {
      setUserProfile(null);
      setIsLoadingProfile(false);
    }
  }, [session, isSessionLoading]);

  return { userProfile, isLoadingProfile };
};