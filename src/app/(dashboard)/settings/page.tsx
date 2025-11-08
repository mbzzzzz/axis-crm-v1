"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Building2, Mail, Lock, Cloud, CheckCircle, AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function SettingsPage() {
  const [emailConnected, setEmailConnected] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [userRole, setUserRole] = useState("agent");

  const handleConnectEmail = () => {
    toast.info("Email integration setup coming soon!");
    // In real implementation, this would redirect to OAuth flow
    // window.location.href = "/api/auth/gmail";
  };

  const handleConnectDrive = () => {
    toast.info("Google Drive integration setup coming soon!");
    // In real implementation, this would redirect to OAuth flow
    // window.location.href = "/api/auth/drive";
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5" />
              Company Information
            </CardTitle>
            <CardDescription>Update your business details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" placeholder="Acme Realty" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={userRole} onValueChange={setUserRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="agent">Agent / Realtor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" placeholder="https://example.com" />
            </div>
            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Email Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              Email Integration
            </CardTitle>
            <CardDescription>Connect your email to send invoices automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emailConnected ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="size-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Email account connected successfully
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="size-4" />
                <AlertDescription>
                  Connect your Gmail or Outlook account to send invoices directly to clients
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleConnectEmail}
              >
                <svg className="mr-2 size-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#4285F4"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Connect Gmail
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleConnectEmail}>
                <svg className="mr-2 size-5" viewBox="0 0 24 24">
                  <path
                    fill="#0078D4"
                    d="M23 12.3v5.338a1.361 1.361 0 01-1.361 1.362H18.91v-6.7zm-6.09 6.7H7.09v-6.7h9.82zm-9.82-6.7H1v5.338A1.361 1.361 0 002.361 19H7.09zM2.361 5A1.361 1.361 0 001 6.361V11h6.09V5zm4.729 6h9.82V5h-9.82zM18.91 5v6h4.729V6.361A1.361 1.361 0 0022.278 5z"
                  />
                </svg>
                Connect Outlook
              </Button>
            </div>

            {emailConnected && (
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connected Account</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">john.doe@gmail.com</p>
                <Button variant="outline" size="sm" className="w-full">
                  Disconnect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Drive Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="size-5" />
              Google Drive Integration
            </CardTitle>
            <CardDescription>Auto-save invoices to your Google Drive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {driveConnected ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="size-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Google Drive connected successfully
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="size-4" />
                <AlertDescription>
                  Connect your Google Drive to automatically backup all invoices
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleConnectDrive}
            >
              <svg className="mr-2 size-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M7.71 3.5L1.15 15l2.85 5h5.7l6.56-11.5z"
                />
                <path
                  fill="#0F9D58"
                  d="m7.71 3.5l6.56 11.5H23l-4.99-8.7z"
                />
                <path
                  fill="#F4B400"
                  d="M14.27 15L7.71 3.5L1.15 15l2.85 5z"
                />
                <path
                  fill="#0F9D58"
                  d="M14.27 15H23l-4.99 8.7z"
                />
              </svg>
              Connect Google Drive
            </Button>

            {driveConnected && (
              <div className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage Location</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">/Axis CRM/Invoices/</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Open Folder
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button className="w-full">Update Password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure email notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Property Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when properties are added
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Invoice Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive invoice payment notifications
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">Get weekly business summaries</p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            User Role & Permissions
          </CardTitle>
          <CardDescription>Your current role and what you can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Role:</span>
              <Badge variant="outline" className="text-base">
                {userRole === "owner" ? "Property Owner" : "Agent / Realtor"}
              </Badge>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold">Permissions:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {userRole === "owner" ? (
                  <>
                    <li>✓ View all properties and financial reports</li>
                    <li>✓ Manage agents and team members</li>
                    <li>✓ Full access to all features</li>
                    <li>✓ View complete profit and ROI analysis</li>
                  </>
                ) : (
                  <>
                    <li>✓ Manage assigned properties</li>
                    <li>✓ View commission calculations</li>
                    <li>✓ Create and send invoices</li>
                    <li>✓ Track property listings</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}