import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/login-form";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#fdfbfc] text-stone-500">
      <div className="fixed inset-x-0 top-0 z-30 flex justify-center pt-8 md:pt-12">
        <Link
          href="/"
          className="text-xs lowercase tracking-[0.3em] text-stone-500 transition-opacity duration-200 ease-out hover:opacity-70"
        >
          y company
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-20">
        <div className="mb-10 space-y-2 text-center">
          <h1 className="text-sm lowercase tracking-[0.3em] text-stone-600">
            admin
          </h1>
          <p className="text-xs lowercase tracking-[0.2em]">owner access only</p>
        </div>

        <AdminLoginForm />
      </div>
    </div>
  );
}
