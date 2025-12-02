"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CheckCircle2, AlertCircle, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type SessionStatus = "CONNECTED" | "SCAN_QR_CODE" | "WORKING" | "STOPPED" | "STARTING" | "UNKNOWN";

interface SessionInfo {
  status: SessionStatus;
  name: string;
}

export default function WhatsAppSettingsPage() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("UNKNOWN");
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isFetchingQr, setIsFetchingQr] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const qrPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkSessionStatus = async () => {
    try {
      const response = await fetch("/api/whatsapp/status");
      
      if (!response.ok) {
        // Try to get detailed error from response
        let errorMessage = `Failed to check status: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
            if (errorData.details) {
              errorMessage += ` - ${errorData.details}`;
            }
          }
        } catch {
          // If JSON parsing fails, use the default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const status = (data.status || "UNKNOWN").toUpperCase() as SessionStatus;
      
      setSessionStatus(status);
      setLastChecked(new Date());
      setError(null);

      // If status is SCAN_QR_CODE, fetch QR code
      if (status === "SCAN_QR_CODE" && !qrCodeUrl && !isFetchingQr) {
        fetchQrCode();
      } else if ((status === "CONNECTED" || status === "WORKING") && qrCodeUrl) {
        // Clear QR code when connected
        setQrCodeUrl(null);
      }
    } catch (err) {
      console.error("Error checking session status:", err);
      setError(err instanceof Error ? err.message : "Failed to check WhatsApp connection status");
      setSessionStatus("UNKNOWN");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQrCode = async () => {
    if (isFetchingQr) return;
    
    setIsFetchingQr(true);
    try {
      const response = await fetch("/api/whatsapp/qr");
      
      if (!response.ok) {
        // Try to get detailed error from response
        let errorMessage = `Failed to fetch QR code: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
            if (errorData.details) {
              errorMessage += ` - ${errorData.details}`;
            }
          }
        } catch {
          // If JSON parsing fails, use the default message
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setQrCodeUrl(url);
      setError(null);
    } catch (err) {
      console.error("Error fetching QR code:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch QR code");
    } finally {
      setIsFetchingQr(false);
    }
  };

  // Initial status check
  useEffect(() => {
    checkSessionStatus();
  }, []);

  // Poll for status every 3 seconds
  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      checkSessionStatus();
    }, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll for QR code when status is SCAN_QR_CODE
  useEffect(() => {
    if (sessionStatus === "SCAN_QR_CODE") {
      // Fetch QR code immediately
      if (!qrCodeUrl && !isFetchingQr) {
        fetchQrCode();
      }

      // Poll for QR code updates every 5 seconds
      qrPollingIntervalRef.current = setInterval(() => {
        if (!isFetchingQr) {
          fetchQrCode();
        }
      }, 5000);
    } else {
      // Clear QR polling when not in SCAN_QR_CODE state
      if (qrPollingIntervalRef.current) {
        clearInterval(qrPollingIntervalRef.current);
        qrPollingIntervalRef.current = null;
      }
    }

    return () => {
      if (qrPollingIntervalRef.current) {
        clearInterval(qrPollingIntervalRef.current);
      }
    };
  }, [sessionStatus]);

  // Cleanup QR code URL on unmount
  useEffect(() => {
    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [qrCodeUrl]);

  const getStatusBadge = () => {
    switch (sessionStatus) {
      case "CONNECTED":
      case "WORKING":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        );
      case "SCAN_QR_CODE":
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            <QrCode className="mr-1 h-3 w-3" />
            Scan QR Code
          </Badge>
        );
      case "STOPPED":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Disconnected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    checkSessionStatus();
    if (sessionStatus === "SCAN_QR_CODE") {
      fetchQrCode();
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Integration</h1>
        <p className="text-muted-foreground">
          Connect your WhatsApp account to send invoices and messages directly to tenants
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>
                Current WhatsApp session status
                {lastChecked && (
                  <span className="ml-2 text-xs">
                    (Last checked: {lastChecked.toLocaleTimeString()})
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && sessionStatus === "UNKNOWN" ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Make sure the WAHA service is running and accessible at the configured URL.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Status: {sessionStatus}</p>
                {sessionStatus === "CONNECTED" || sessionStatus === "WORKING" ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your WhatsApp is connected and ready to send messages.
                  </p>
                ) : sessionStatus === "SCAN_QR_CODE" ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please scan the QR code below with your WhatsApp mobile app to connect.
                  </p>
                ) : sessionStatus === "STOPPED" ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your WhatsApp session is disconnected. Please restart the WAHA service or create a new session.
                  </p>
                ) : null}
              </div>

              {sessionStatus === "SCAN_QR_CODE" && (
                <div className="space-y-4 rounded-lg border bg-muted/50 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">QR Code</h3>
                    {isFetchingQr && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  
                  {qrCodeUrl ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="rounded-lg border-2 border-primary bg-white p-4">
                        <img
                          src={qrCodeUrl}
                          alt="WhatsApp QR Code"
                          className="h-64 w-64"
                        />
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        <p className="font-medium">Scan this QR code with WhatsApp</p>
                        <ol className="mt-2 list-decimal list-inside space-y-1 text-left">
                          <li>Open WhatsApp on your phone</li>
                          <li>Go to Settings → Linked Devices</li>
                          <li>Tap "Link a Device"</li>
                          <li>Point your phone at this QR code</li>
                        </ol>
                      </div>
                    </div>
                  ) : isFetchingQr ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading QR code...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        QR code not available. Click refresh to try again.
                      </p>
                      <Button variant="outline" size="sm" onClick={fetchQrCode}>
                        Refresh QR Code
                      </Button>
                    </div>
                  )}
                </div>
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
            <h4 className="font-semibold">1. Connect Your WhatsApp</h4>
            <p className="text-muted-foreground">
              Scan the QR code above with your WhatsApp mobile app to link your account. This allows
              the system to send messages on your behalf.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">2. Send Invoices</h4>
            <p className="text-muted-foreground">
              Once connected, you can send invoices directly to tenants via WhatsApp. The system will
              automatically format the message and attach the PDF invoice.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">3. Privacy & Security</h4>
            <p className="text-muted-foreground">
              Your WhatsApp connection is secure and only used to send messages you authorize. The
              QR code is only displayed when needed for initial setup.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

