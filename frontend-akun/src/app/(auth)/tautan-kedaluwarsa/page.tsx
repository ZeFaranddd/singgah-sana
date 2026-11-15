import type { Metadata } from "next";
import { LinkExpiredPage } from "../../../features/auth/RecoveryPages";

export const metadata: Metadata = { title: "Tautan kedaluwarsa" };

export default function Page() {
  return <LinkExpiredPage />;
}
