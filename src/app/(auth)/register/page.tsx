import { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register - Supply Chain Intelligence",
  description: "Create your account and company",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Create account</h2>
        <p className="text-gray-600 mt-2">
          Set up your company and start analyzing your supply chain
        </p>
      </div>
      <RegisterForm />
    </div>
  );
} 