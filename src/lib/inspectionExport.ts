/**
 * Inspection export utilities
 * Handles PDF generation, JSON export, and compressed storage
 */

import { Inspection } from "@/types/inspection";

const COMPRESSED_STORAGE_KEY = "gp_compressed_inspections_v1";

export interface CompressedInspection {
  id: string;
  carNumber: string;
  site: string;
  completedAt: string;
  status: string;
  dataUrl: string; // Base64 compressed JSON
  size: number;
}

/**
 * Compress inspection data for storage
 * Removes large media files, keeps references only
 */
export function compressInspection(inspection: Inspection): CompressedInspection {
  // Create lightweight copy without full media data
  const lightCopy = {
    ...inspection,
    media: {
      doorwayExteriorAndInterior: inspection.media.doorwayExteriorAndInterior?.map(() => "[IMAGE_REMOVED]"),
      doorwayBeforeClosing: inspection.media.doorwayBeforeClosing?.map(() => "[IMAGE_REMOVED]"),
    },
  };

  const jsonString = JSON.stringify(lightCopy);
  const dataUrl = `data:application/json;base64,${btoa(jsonString)}`;

  return {
    id: inspection.id,
    carNumber: inspection.carNumber || "Unknown",
    site: inspection.site || "Unknown",
    completedAt: inspection.completedAt || inspection.createdAt,
    status: inspection.status,
    dataUrl,
    size: jsonString.length,
  };
}

/**
 * Decompress inspection from storage
 */
export function decompressInspection(compressed: CompressedInspection): Partial<Inspection> {
  try {
    const base64 = compressed.dataUrl.split(",")[1];
    const jsonString = atob(base64);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("[InspectionExport] Failed to decompress:", error);
    return {};
  }
}

/**
 * Save compressed inspection to internal storage
 */
export function saveCompressedInspection(inspection: Inspection) {
  if (typeof window === "undefined") return;

  const compressed = compressInspection(inspection);
  const existing = getCompressedInspections();
  
  // Replace if exists, otherwise add
  const index = existing.findIndex(c => c.id === compressed.id);
  if (index >= 0) {
    existing[index] = compressed;
  } else {
    existing.push(compressed);
  }

  try {
    localStorage.setItem(COMPRESSED_STORAGE_KEY, JSON.stringify(existing));
    console.log(`[InspectionExport] Compressed inspection ${inspection.id} (${compressed.size} bytes)`);
  } catch (error) {
    console.error("[InspectionExport] Failed to save compressed inspection:", error);
  }
}

/**
 * Get all compressed inspections
 */
export function getCompressedInspections(): CompressedInspection[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(COMPRESSED_STORAGE_KEY);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch (error) {
    console.error("[InspectionExport] Failed to load compressed inspections:", error);
    return [];
  }
}

/**
 * Export inspection as JSON download
 */
export function exportAsJSON(inspection: Inspection) {
  const json = JSON.stringify(inspection, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `inspection-${inspection.carNumber || inspection.id}-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate PDF report (simplified - can be enhanced with proper PDF library)
 */
export function exportAsPDF(inspection: Inspection) {
  // Create HTML content for PDF
  const htmlContent = generateInspectionHTML(inspection);
  
  // Open print dialog (browser will handle PDF conversion)
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate PDF");
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

/**
 * Generate HTML for inspection report
 */
function generateInspectionHTML(inspection: Inspection): string {
  const mediaCount = 
    (inspection.media.doorwayExteriorAndInterior?.length || 0) +
    (inspection.media.doorwayBeforeClosing?.length || 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Inspection Report - ${inspection.carNumber || inspection.id}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
    h2 { color: #3b82f6; margin-top: 30px; }
    .section { margin: 20px 0; }
    .field { margin: 10px 0; }
    .label { font-weight: bold; color: #4b5563; }
    .value { margin-left: 10px; }
    .status-complete { color: #059669; font-weight: bold; }
    .status-draft { color: #d97706; font-weight: bold; }
    .signature { margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; }
    img { max-width: 200px; border: 1px solid #d1d5db; margin: 10px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>Railcar Inspection Report</h1>
  
  <div class="section">
    <div class="field">
      <span class="label">Inspection ID:</span>
      <span class="value">${inspection.id}</span>
    </div>
    <div class="field">
      <span class="label">Status:</span>
      <span class="value status-${inspection.status}">${inspection.status.toUpperCase()}</span>
    </div>
    <div class="field">
      <span class="label">Car Number:</span>
      <span class="value">${inspection.carNumber || "N/A"}</span>
    </div>
    <div class="field">
      <span class="label">House Code:</span>
      <span class="value">${inspection.houseCode || "N/A"}</span>
    </div>
    <div class="field">
      <span class="label">Site:</span>
      <span class="value">${inspection.site || "N/A"}</span>
    </div>
    <div class="field">
      <span class="label">Created:</span>
      <span class="value">${new Date(inspection.createdAt).toLocaleString()}</span>
    </div>
    ${inspection.completedAt ? `
    <div class="field">
      <span class="label">Completed:</span>
      <span class="value">${new Date(inspection.completedAt).toLocaleString()}</span>
    </div>
    ` : ""}
  </div>

  <h2>Inspection Details</h2>
  <div class="section">
    <div class="field">
      <span class="label">Accept/Reject:</span>
      <span class="value">${inspection.acceptReject === "yes" ? "✓ Accepted" : "✗ Rejected"}</span>
    </div>
    ${inspection.rejectReason ? `
    <div class="field">
      <span class="label">Reject Reason:</span>
      <span class="value">${inspection.rejectReason}</span>
    </div>
    ` : ""}
    <div class="field">
      <span class="label">Load Balanced:</span>
      <span class="value">${inspection.isLoadBalanced === "yes" ? "Yes" : "No"}</span>
    </div>
    ${inspection.loadNo ? `
    <div class="field">
      <span class="label">Load Number:</span>
      <span class="value">${inspection.loadNo}</span>
    </div>
    ` : ""}
  </div>

  ${inspection.notes && inspection.notes.length > 0 ? `
  <h2>Notes</h2>
  <div class="section">
    ${inspection.notes.map(note => `<p>• ${note}</p>`).join("")}
  </div>
  ` : ""}

  <h2>Media</h2>
  <div class="section">
    <p>Total Photos: ${mediaCount}</p>
  </div>

  ${inspection.inspectorSignatures?.initial || inspection.inspectorSignatures?.final ? `
  <h2>Signatures</h2>
  ${inspection.inspectorSignatures.initial ? `
  <div class="signature">
    <strong>Initial Signature</strong><br>
    Inspector: ${inspection.inspectorSignatures.initial.fullName || "N/A"}<br>
    Signed: ${inspection.inspectorSignatures.initial.signedAt ? new Date(inspection.inspectorSignatures.initial.signedAt).toLocaleString() : "N/A"}
  </div>
  ` : ""}
  ${inspection.inspectorSignatures.final ? `
  <div class="signature">
    <strong>Final Signature</strong><br>
    Inspector: ${inspection.inspectorSignatures.final.fullName || "N/A"}<br>
    Signed: ${inspection.inspectorSignatures.final.signedAt ? new Date(inspection.inspectorSignatures.final.signedAt).toLocaleString() : "N/A"}
  </div>
  ` : ""}
  ` : ""}

  ${inspection.managerNote ? `
  <h2>Manager Review</h2>
  <div class="section">
    <p>${inspection.managerNote}</p>
  </div>
  ` : ""}

  <p class="no-print" style="margin-top: 40px; text-align: center; color: #6b7280;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </p>
</body>
</html>
  `;
}

/**
 * Send inspection via email (requires backend API endpoint)
 * This is a placeholder - you'll need to implement actual email sending
 */
export async function sendInspectionEmail(
  inspection: Inspection,
  recipients: string[],
  subject: string,
  body: string
): Promise<boolean> {
  console.log("[InspectionExport] Email sending requested:", {
    recipients,
    subject,
    inspectionId: inspection.id,
  });

  // TODO: Implement actual email API call
  // Example:
  // const response = await fetch("/api/send-inspection-email", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     inspection,
  //     recipients,
  //     subject,
  //     body,
  //   }),
  // });
  // return response.ok;

  // For now, return simulated success after delay
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("[InspectionExport] Email sent successfully (simulated)");
      resolve(true);
    }, 1500);
  });
}