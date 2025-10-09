import SignInFormAdmin from "@/components/auth/SignInFormAdmin";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Admin Sign In | Nuvisa Admin System",
  description: "Sign in to Nuvisa Admin System",
};

export default function SignIn() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Link href={"/"} className="mb-12 inline-flex justify-center">
            <Image
              className="dark:hidden"
              src="/images/logo/logo.svg"
              alt="Logo"
              width={150}
              height={40}
            />
            <Image
              className="hidden dark:block"
              src="/images/logo/logo-dark.svg"
              alt="Logo"
              width={150}
              height={40}
            />
          </Link>
        </div>
        <div className="mb-6">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Admin Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Welcome back! Please sign in to your admin account.
          </p>
        </div>
        <SignInFormAdmin />
      </div>
    </div>
  );
}
