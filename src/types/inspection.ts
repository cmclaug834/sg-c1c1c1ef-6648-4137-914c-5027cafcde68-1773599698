export type InspectionStatus = "draft" | "in_progress" | "complete";

export interface Inspection {
  id: string;
  templateId: "gp-rail-car-inspection-v1";
  status: InspectionStatus;
  
  createdAt: string;
  updatedAt: string;
  
  // Title Page fields
  siteConducted?: string;
  dateTime?: string;
  houseNumber?: string;
  vehicleId?: string;
  loadNo?: string;
  
  // Page 1 - Accept/Reject
  acceptReject?: "yes" | "no";
  rejectReason?: string;
  
  // Page 2 - Final Inspection
  isLoadBalanced?: "yes" | "no";
  
  // Media placeholders
  media: {
    doorwayExteriorAndInterior?: string[];
    doorwayBeforeClosing?: string[];
  };
  
  // Notes / actions stubs
  notes?: string[];
  
  // Signature
  inspectorSignature?: {
    fullName?: string;
    signatureDataUrl?: string;
    signedAt?: string;
  };
}