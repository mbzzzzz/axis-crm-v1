"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  FileDown,
  FileUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  exportToCSV,
  exportToExcel,
  generatePropertyTemplate,
  generateInvoiceTemplate,
  importFromFile,
  validatePropertyData,
  validateInvoiceData,
} from "@/lib/export-utils";
import { useDropzone } from "react-dropzone";
import { AnimatedDownload } from "@/components/ui/animated-download";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "properties" | "invoices";
  data: any[];
  onImportSuccess: () => void;
}

export function ImportExportDialog({
  open,
  onOpenChange,
  type,
  data,
  onImportSuccess,
}: ImportExportDialogProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: any[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    setIsExporting(true);
    const filename = `${type}-${new Date().toISOString().split("T")[0]}.csv`;
    exportToCSV(data, filename);
    toast.success("CSV exported successfully");
    setTimeout(() => setIsExporting(false), 900);
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    const filename = `${type}-${new Date().toISOString().split("T")[0]}.xlsx`;
    exportToExcel(data, filename, type === "properties" ? "Properties" : "Invoices");
    toast.success("Excel file exported successfully");
    setTimeout(() => setIsExporting(false), 900);
  };

  const handleDownloadTemplate = () => {
    if (type === "properties") {
      generatePropertyTemplate();
    } else {
      generateInvoiceTemplate();
    }
    toast.success("Template downloaded successfully");
  };

  const handleImport = async (file: File) => {
    if (!file) return;

    setIsImporting(true);
    setImportProgress(10);
    setImportResults(null);

    try {
      // Read file
      const importedData = await importFromFile(file);
      setImportProgress(30);

      // Validate data
      const validation =
        type === "properties"
          ? validatePropertyData(importedData)
          : validateInvoiceData(importedData);

      setImportProgress(50);

      // Import valid records
      let successCount = 0;
      for (let i = 0; i < validation.valid.length; i++) {
        const record = validation.valid[i];
        try {
          const endpoint = type === "properties" ? "/api/properties" : "/api/invoices";
          const payload =
            type === "properties"
              ? {
                  ...record,
                  userId: 1, // In real app, get from session
                  propertyType: record.propertyType?.toLowerCase(),
                  status: record.status?.toLowerCase(),
                }
              : {
                  ...record,
                  userId: 1,
                  paymentStatus: record.paymentStatus?.toLowerCase(),
                };

          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            successCount++;
          }
        } catch (error) {
          console.error("Failed to import record:", error);
        }

        setImportProgress(50 + ((i + 1) / Math.max(1, validation.valid.length)) * 50);
      }

      setImportResults({
        success: successCount,
        failed: validation.errors.length,
        errors: validation.errors,
      });

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} ${type}`);
        onImportSuccess();
      }

      if (validation.errors.length > 0) {
        toast.warning(`${validation.errors.length} records failed validation`);
      }
    } catch (error) {
      toast.error("Failed to import file");
      console.error(error);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleImport(file);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles?.[0];
    if (file) {
      handleImport(file);
    }
  }, [handleImport]);

  const { getRootProps, getInputProps, isDragActive, isDragReject, acceptedFiles } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    disabled: isImporting,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import & Export {type === "properties" ? "Properties" : "Invoices"}</DialogTitle>
          <DialogDescription>
            Import data from CSV/Excel files or export your existing data
          </DialogDescription>
        </DialogHeader>

        {(isImporting || isExporting) && (
          <div className="flex justify-center mb-4">
            <AnimatedDownload
              className="max-w-md"
              isAnimating={isImporting || isExporting}
              activeText={isImporting ? "IMPORTING" : "EXPORTING"}
            />
          </div>
        )}

        <Tabs defaultValue="export" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Options</CardTitle>
                <CardDescription>
                  Download your {type} in CSV or Excel format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="size-8 text-green-600" />
                    <div>
                      <h4 className="font-medium">Export to Excel</h4>
                      <p className="text-sm text-muted-foreground">
                        Download as .xlsx file with formatting
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleExportExcel} disabled={isExporting}>
                    <Download className="mr-2 size-4" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FileDown className="size-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Export to CSV</h4>
                      <p className="text-sm text-muted-foreground">
                        Download as .csv file for compatibility
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleExportCSV} disabled={isExporting}>
                    <Download className="mr-2 size-4" />
                    Export
                  </Button>
                </div>

                <Alert>
                  <AlertDescription>
                    Exporting {data.length} {type} to your selected format
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Data</CardTitle>
                <CardDescription>
                  Upload CSV or Excel files to bulk import {type}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Step 1: Download Template</Label>
                  <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
                    <Download className="mr-2 size-4" />
                    Download Import Template
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Use this template to ensure your data is formatted correctly
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Step 2: Drag & Drop or Click to Upload</Label>
                  <div
                    {...getRootProps()}
                    className={`flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : isDragReject
                        ? "border-destructive/60 bg-destructive/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex items-center gap-2 mb-2">
                      <FileUp className="size-5 text-muted-foreground" />
                      <span className="text-sm font-medium">Drop your CSV/XLSX here</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      or click to browse files
                    </p>
                    {acceptedFiles?.[0] && (
                      <p className="mt-2 text-xs">Selected: {acceptedFiles[0].name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Or choose a file</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isImporting}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="w-full"
                  >
                    <Upload className="mr-2 size-4" />
                    {isImporting ? "Importing..." : "Choose File"}
                  </Button>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <Label>Import Progress</Label>
                    <Progress value={importProgress} />
                    <p className="text-sm text-muted-foreground">
                      {importProgress < 30 && "Reading file..."}
                      {importProgress >= 30 && importProgress < 50 && "Validating data..."}
                      {importProgress >= 50 && "Importing records..."}
                    </p>
                  </div>
                )}

                {importResults && (
                  <Alert>
                    <AlertDescription className="space-y-2">
                      <div className="flex items-center gap-2">
                        {importResults.success > 0 && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="mr-1 size-3" />
                            {importResults.success} Successful
                          </Badge>
                        )}
                        {importResults.failed > 0 && (
                          <Badge variant="destructive">
                            <AlertCircle className="mr-1 size-3" />
                            {importResults.failed} Failed
                          </Badge>
                        )}
                      </div>
                      {importResults.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">
                            View Errors
                          </summary>
                          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                            {importResults.errors.map((error, i) => (
                              <div key={i} className="rounded bg-muted p-2">
                                <strong>Row {error.row}:</strong> {error.errors.join(", ")}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}