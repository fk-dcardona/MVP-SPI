"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number with country code"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  role: z.enum(["admin", "manager", "analyst"]),
  industry: z.string().min(1, "Please select an industry"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const INDUSTRIES = [
  "Retail",
  "Manufacturing",
  "Healthcare",
  "Technology",
  "Food & Beverage",
  "Automotive",
  "Fashion",
  "Electronics",
  "Pharmaceuticals",
  "Other",
];

export default function RegisterFormEnhanced() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"register" | "verify-otp">("register");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phoneNumber: "",
      companyName: "",
      role: "analyst" as const,
      industry: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (step === "register") {
      setIsLoading(true);
      setError("");

      try {
        // First, create or get the company
        const { data: existingCompany } = await supabase
          .from("companies")
          .select("id")
          .eq("name", values.companyName)
          .single();

        let companyId = existingCompany?.id;

        if (!companyId) {
          // Create new company if it doesn't exist
          const { data: newCompany, error: companyError } = await supabase
            .from("companies")
            .insert({
              name: values.companyName,
              industry: values.industry,
              whatsapp_number: values.phoneNumber,
              email: values.email,
            })
            .select("id")
            .single();

          if (companyError) {
            setError("Failed to create company");
            setIsLoading(false);
            return;
          }

          companyId = newCompany.id;
        }

        // Sign up the user
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.fullName,
              phone_number: values.phoneNumber,
              company_id: companyId,
              role: values.role,
            },
          },
        });

        if (error) {
          setError(error.message);
        } else if (data.user) {
          // Send OTP for WhatsApp verification
          const response = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: values.phoneNumber }),
          });

          const result = await response.json();

          if (result.success) {
            setOtpSent(true);
            setStep("verify-otp");
          } else {
            setError("Failed to send OTP. You can still login with email.");
            setTimeout(() => {
              router.push("/login?message=Check your email to confirm your account");
            }, 3000);
          }
        }
      } catch (error) {
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function verifyOtp() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: form.getValues("phoneNumber"),
          otp: otp,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update user profile to mark WhatsApp as verified
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ whatsapp_verified: true })
          .eq("id", (await supabase.auth.getUser()).data.user?.id);

        if (!updateError) {
          router.push("/dashboard");
        } else {
          setError("Failed to update verification status");
        }
      } else {
        setError(result.error || "Invalid OTP");
      }
    } catch (error) {
      setError("Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          {step === "register" 
            ? "Join Finkargo Analytics to optimize your supply chain" 
            : "Verify your WhatsApp number"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "register" ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+1234567890"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                We&apos;ve sent a verification code to your WhatsApp number. Please enter it below.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">
                Verification Code
              </label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={verifyOtp}
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Skip for now
            </Button>
          </div>
        )}

        <div className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}