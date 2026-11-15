import type { Metadata } from "next";
import { ConfirmEmailPage } from "../../../../features/auth/RecoveryPages";

export const metadata: Metadata = { title: "Verifikasi email" };

export default function Page() {
  return <ConfirmEmailPage />;
}
