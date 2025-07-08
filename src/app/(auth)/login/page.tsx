import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login - Supply Chain Intelligence",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
        <p className="text-gray-600 mt-2">
          Sign in to your account to continue
        </p>
      </div>
      <LoginForm />
    </div>
  );
} 