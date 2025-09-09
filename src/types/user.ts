import { Bidang } from "./spj";

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  nip?: string;
  jabatan?: string;
  bidang?: Bidang;
  avatar_url?: string;
  updated_at?: string;
}