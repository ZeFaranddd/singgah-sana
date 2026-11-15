import type { Metadata } from "next";
import { ResetPasswordPage } from "../../../features/auth/RecoveryPages";

export const metadata: Metadata = { title: "Buat kata sandi baru" };

export default function Page() {
  return <ResetPasswordPage />;
}
