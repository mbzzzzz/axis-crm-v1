"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, MessageSquare, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppStatus {
  connected: boolean;
  status: 'connected' | 'not_connected';
  phoneNumber?: string;
  connectedAt?: string;
}

export default function WhatsAppSettingsPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  
  // Form fields
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/whatsapp/connect");
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching WhatsApp status:", error);
      setStatus({ connected: false, status: 'not_connected' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);

    try {
      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberId,
          accessToken,
          businessAccountId: businessAccountId || undefined,
          phoneNumber: phoneNumber || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to connect");
      }

      toast.success("WhatsApp connected successfully!");
      setShowConnectForm(false);
      setPhoneNumberId("");
      setAccessToken("");
      setBusinessAccountId("");
      setPhoneNumber("");
      await fetchStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect WhatsApp");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp?")) return;

    try {
      const response = await fetch("/api/whatsapp/connect", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to disconnect");

      toast.success("WhatsApp disconnected successfully");
      await fetchStatus();
    } catch (error) {
      toast.error("Failed to disconnect WhatsApp");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Integration</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Integration</h1>
        <p className="text-muted-foreground">
          Connect your WhatsApp Business account to send invoices and messages directly to tenants
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                {status?.connected
                  ? `Connected to ${status.phoneNumber || "WhatsApp"}`
                  : "Not connected"}
              </CardDescription>
            </div>
            {status?.connected ? (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="mr-1 h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {status?.connected ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Your WhatsApp is connected and ready to send messages.
                  {status.phoneNumber && (
                    <span className="block mt-1">Phone: {status.phoneNumber}</span>
                  )}
                </AlertDescription>
              </Alert>
              <Button variant="destructive" onClick={handleDisconnect}>
                Disconnect WhatsApp
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!showConnectForm ? (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connect your WhatsApp Business account to start sending invoices via WhatsApp.
                    </AlertDescription>
                  </Alert>
                  <Button onClick={() => setShowConnectForm(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Connect WhatsApp
                  </Button>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong>Need help setting up?</strong> See the{" "}
                      <a
                        href="/docs/whatsapp-setup"
                        target="_blank"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        setup guide
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                </>
              ) : (
                <form onSubmit={handleConnect} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
                    <Input
                      id="phoneNumberId"
                      value={phoneNumberId}
                      onChange={(e) => setPhoneNumberId(e.target.value)}
                      placeholder="e.g., 123456789012345"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Found in Meta for Developers → WhatsApp → API Setup
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessToken">Access Token *</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Your WhatsApp access token"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Generate in Meta for Developers → WhatsApp → API Setup
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessAccountId">Business Account ID (Optional)</Label>
                    <Input
                      id="businessAccountId"
                      value={businessAccountId}
                      onChange={(e) => setBusinessAccountId(e.target.value)}
                      placeholder="e.g., 123456789012345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g., +1234567890"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isConnecting}>
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowConnectForm(false);
                        setPhoneNumberId("");
                        setAccessToken("");
                        setBusinessAccountId("");
                        setPhoneNumber("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>Learn how to use WhatsApp integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">1. Set Up WhatsApp Business API</h4>
            <p className="text-muted-foreground">
              Create a Meta Business account and set up WhatsApp Business API in Meta for Developers.
              You'll need a verified business phone number.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">2. Connect Your Account</h4>
            <p className="text-muted-foreground">
              Enter your Phone Number ID and Access Token from Meta for Developers to connect your
              WhatsApp Business account.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">3. Send Invoices</h4>
            <p className="text-muted-foreground">
              Once connected, you can send invoices directly to tenants via WhatsApp. The system will
              automatically format the message and attach the PDF invoice.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
