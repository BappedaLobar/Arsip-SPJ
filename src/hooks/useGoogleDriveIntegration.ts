import { useState, useEffect, useCallback } from "react";
import { gapi } from "gapi-script";
import { showError, showLoading, dismissToast, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { SPJ } from "@/types/spj";

interface GoogleAuthResult {
  access_token?: string;
  error?: string;
}

interface GoogleDriveFile {
  name: string;
  url: string;
  token: string;
}

export const useGoogleDriveIntegration = () => {
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);

  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
  const PICKER_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

  useEffect(() => {
    const loadClient = () => {
      gapi.load("client:auth2", () => {
        (gapi as any).client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          scope: `${DRIVE_SCOPE} ${PICKER_SCOPE}`, // Load both scopes
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        }).then(() => {
          setIsGoogleApiLoaded(true);
          console.log("Google API client and auth2 initialized.");
        }).catch(error => {
          console.error("Error initializing Google API client:", error);
          showError("Gagal memuat Google API. Pastikan API Key dan Client ID benar.");
        });
      });
    };

    if (API_KEY && CLIENT_ID) {
      loadClient();
    } else {
      console.warn("Google API Key or Client ID is missing. Google Drive features will be limited.");
      showError("Google API Key atau Client ID tidak ditemukan. Fitur Google Drive mungkin tidak berfungsi.");
    }
  }, [API_KEY, CLIENT_ID]);

  const authorizeGoogleDrive = useCallback(async (scope: string): Promise<string | null> => {
    if (!isGoogleApiLoaded) {
      showError("Google API belum dimuat sepenuhnya. Coba lagi sebentar.");
      return null;
    }

    try {
      const authInstance = (gapi as any).auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error("Google Auth2 instance not available.");
      }

      let authResponse: GoogleAuthResult;

      if (authInstance.isSignedIn.get() && authInstance.currentUser.get().hasGrantedScopes(scope)) {
        authResponse = authInstance.currentUser.get().getAuthResponse(true);
      } else {
        authResponse = await authInstance.signIn({ scope });
      }

      if (!authResponse || authResponse.error) {
        throw new Error(authResponse?.error || "Authorization failed.");
      }

      return authResponse.access_token || null;
    } catch (error) {
      console.error("Error during Google Drive authorization:", error);
      showError(`Gagal otorisasi Google Drive: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }, [isGoogleApiLoaded, API_KEY, CLIENT_ID]);


  const handleGoogleDriveImport = useCallback((callback: (file: GoogleDriveFile) => void) => {
    const initializeGapiAndShowPicker = async () => {
      const accessToken = await authorizeGoogleDrive(PICKER_SCOPE);
      if (!accessToken) return;

      gapi.load("picker", () => {
        const view = new (window as any).google.picker.DocsView();
        view.setMimeTypes("application/pdf,image/png,image/jpeg");
        const picker = new (window as any).google.picker.PickerBuilder()
          .setAppId(CLIENT_ID.split('-')[0])
          .setOAuthToken(accessToken)
          .addView(view)
          .setDeveloperKey(API_KEY)
          .setCallback((data: any) => {
            if (data.action === (window as any).google.picker.Action.PICKED) {
              const doc = data.docs[0];
              const fileData: GoogleDriveFile = {
                name: doc.name,
                url: `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
                token: accessToken,
              };
              callback(fileData);
            }
          })
          .build();
        picker.setVisible(true);
      });
    };

    initializeGapiAndShowPicker();
  }, [authorizeGoogleDrive, API_KEY, CLIENT_ID]);

  const handleTransferToDrive = useCallback(async (spj: SPJ) => {
    if (!spj.fileUrl) {
      showError("Tidak ada file untuk ditransfer.");
      return;
    }

    const toastId = showLoading("Mempersiapkan transfer ke Google Drive...");

    try {
      const accessToken = await authorizeGoogleDrive(DRIVE_SCOPE);
      if (!accessToken) {
        dismissToast(toastId);
        return;
      }

      const response = await fetch(spj.fileUrl);
      if (!response.ok) {
        throw new Error(`Gagal mengambil file dari Supabase: ${response.statusText}`);
      }
      const blob = await response.blob();

      const filenameParts = spj.fileUrl.split("/").pop()?.split('_');
      const originalFilename = filenameParts && filenameParts.length > 1 ? filenameParts.slice(1).join('_') : `arsip_${spj.nomorPembukuan}`;
      const fileExtension = originalFilename.split('.').pop();
      const mimeType = blob.type || `application/${fileExtension}`;

      const fileMetadata = {
        name: `${spj.nomorPembukuan}_${originalFilename}`,
        mimeType: mimeType,
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
      form.append('file', blob);

      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: form,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`Gagal mengunggah ke Google Drive: ${errorData.error.message || uploadResponse.statusText}`);
      }

      const uploadedFile = await uploadResponse.json();
      dismissToast(toastId);
      showSuccess(`File berhasil ditransfer ke Google Drive! ID: ${uploadedFile.id}`);
      console.log("Uploaded file to Google Drive:", uploadedFile);

    } catch (error) {
      dismissToast(toastId);
      console.error("Error transferring to Google Drive:", error);
      showError(error instanceof Error ? error.message : "Terjadi kesalahan saat transfer ke Google Drive.");
    }
  }, [authorizeGoogleDrive, supabase]);

  return { isGoogleApiLoaded, handleGoogleDriveImport, handleTransferToDrive };
};