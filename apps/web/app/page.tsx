import { redirect } from "next/navigation";
import { auth } from "@/auth";

// The root URL is session aware: staff land on the dashboard, anonymous
// visitors land on the public room catalog.
export default async function Page() {
  const session = await auth();
  redirect(session ? "/dashboard" : "/guest");
}
