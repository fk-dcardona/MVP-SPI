import { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password - Supply Chain Intelligence",
  description: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Reset password</h2>
        <p className="text-gray-600 mt-2">
          Enter your email to receive a password reset link
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
} 