import type { Metadata } from "next";
import { PasswordSuccessPage } from "../../../../features/auth/RecoveryPages";

export const metadata: Metadata = { title: "Kata sandi diperbarui" };

export default function Page() {
  return <PasswordSuccessPage />;
}
