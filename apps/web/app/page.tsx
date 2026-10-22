import { redirect } from "next/navigation";
import { auth } from "@/auth";

// The root URL is session aware: guests land on the public room catalog,
// staff/admin land on the dashboard, anonymous visitors land on the catalog.
export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/guest");
  }
  redirect(session.user?.role === "guest" ? "/guest" : "/dashboard");
}
