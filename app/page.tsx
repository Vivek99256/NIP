import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const auth = await getCurrentUser();
  if (auth) {
    if (auth.user.role === "ADMIN") redirect("/admin/dashboard");
    if (auth.user.role === "DOCTOR") redirect("/doctor/dashboard");
    redirect("/dashboard");
  }

  redirect("/login");
}
