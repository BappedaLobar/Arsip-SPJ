import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { showError } from "@/utils/toast";
import { UserProfile } from "@/types/user";

export const useUserProfile = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true); // Set loading to true at the start of fetch
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, nip, jabatan, bidang, avatar_url, updated_at")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error.message);
        showError("Gagal memuat profil pengguna: " + error.message);
        setUserProfile(null); // Ensure profile is null on error
      } else if (data) {
        setUserProfile(data as UserProfile);
      } else {
        setUserProfile(null); // Ensure profile is null if no data found
      }
    } else {
      setUserProfile(null); // No session user ID, so no profile
    }
    setIsLoadingProfile(false); // Set loading to false at the end
  }, [session?.user?.id]); // Dependency on session.user.id

  useEffect(() => {
    if (!isSessionLoading) { // Only run when session loading is complete
      fetchProfile();
    }
  }, [isSessionLoading, fetchProfile]); // Dependencies are isSessionLoading and memoized fetchProfile

  return { userProfile, isLoadingProfile };
};