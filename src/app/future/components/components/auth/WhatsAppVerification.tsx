"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, MessageCircle, CheckCircle, RefreshCw } from "lucide-react";

interface WhatsAppVerificationProps {
  phoneNumber: string;
  onVerified: () => void;
  onSkip?: () => void;
}

export default function WhatsAppVerification({ 
  phoneNumber, 
  onVerified, 
  onSkip 
}: WhatsAppVerificationProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Send initial OTP
    sendOTP();
  }, [phoneNumber]);

  useEffect(() => {
    // Countdown timer for resend
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOTP = async () => {
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setSuccess("OTP sent to your WhatsApp!");
      setCountdown(60); // 60 second cooldown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    await sendOTP();
    setIsResending(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      setSuccess("Phone number verified successfully!");
      setTimeout(() => {
        onVerified();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format as: +1 (555) 123-4567
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          <CardTitle>WhatsApp Verification</CardTitle>
        </div>
        <CardDescription>
          We&apos;ve sent a verification code to your WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Phone Number</Label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{formatPhoneNumber(phoneNumber)}</span>
          </div>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter 6-digit code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
              }}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
              required
              disabled={isLoading}
              autoComplete="one-time-code"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResendOTP}
              disabled={countdown > 0 || isResending}
              className="flex-1"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend Code'
              )}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || otp.length !== 6}
              className="flex-1"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </form>

        {onSkip && (
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Skip for now
            </Button>
          </div>
        )}

        <div className="text-center text-xs text-gray-500">
          <p>Didn&apos;t receive the code? Check your WhatsApp messages</p>
          <p className="mt-1">Make sure you&apos;ve joined our WhatsApp sandbox</p>
        </div>
      </CardContent>
    </Card>
  );
}