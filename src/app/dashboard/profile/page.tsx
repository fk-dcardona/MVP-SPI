"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Building, Phone, Mail, Shield, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfilePage() {
  const { user, userProfile, company, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    role: "analyst" as "admin" | "manager" | "analyst",
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.full_name || "",
        phoneNumber: userProfile.phone_number || "",
        role: userProfile.role,
      });
    }
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userProfile) {
    router.push("/login");
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          role: formData.role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setMessage("Profile updated successfully");
        setIsEditing(false);
        // Refresh the page to show updated data
        window.location.reload();
      }
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
    // Reset form data
    setFormData({
      fullName: userProfile.full_name || "",
      phoneNumber: userProfile.phone_number || "",
      role: userProfile.role,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
      </div>

      {message && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Manage your personal details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            {isEditing ? (
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{userProfile.full_name || "Not set"}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="inline h-4 w-4 mr-1" />
              Email
            </Label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              <Phone className="inline h-4 w-4 mr-1" />
              Phone Number
            </Label>
            {isEditing ? (
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1234567890"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {userProfile.phone_number || "Not set"}
                </p>
                {userProfile.whatsapp_verified && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    WhatsApp Verified
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              <Shield className="inline h-4 w-4 mr-1" />
              Role
            </Label>
            {isEditing ? (
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "manager" | "analyst") => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground capitalize">{userProfile.role}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              Your organization details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <p className="text-sm text-muted-foreground">{company.name}</p>
              </div>

              <div className="space-y-2">
                <Label>Industry</Label>
                <p className="text-sm text-muted-foreground">{company.industry || "Not set"}</p>
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <p className="text-sm text-muted-foreground">{company.country || "Not set"}</p>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <p className="text-sm text-muted-foreground">{company.currency || "USD"}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Contact your administrator to update company information
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={() => router.push("/forgot-password")}>
            Change Password
          </Button>
          
          {!userProfile.whatsapp_verified && userProfile.phone_number && (
            <Button variant="outline" onClick={() => router.push("/verify-whatsapp")}>
              Verify WhatsApp Number
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}