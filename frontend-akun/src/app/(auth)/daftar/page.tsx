import type { Metadata } from "next";
import RegisterPage from "../../../features/auth/RegisterPage";
import { GuestOnly } from "../../../features/auth/RouteGuards";

export const metadata: Metadata = { title: "Daftar" };

export default function Page() {
  return <GuestOnly><RegisterPage /></GuestOnly>;
}
