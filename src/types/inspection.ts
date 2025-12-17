export type InspectionStatus = "draft" | "in_progress" | "complete";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Inspection {
  id: string;
  templateId: "gp-rail-car-inspection-v1";
  status: InspectionStatus;
  reviewStatus?: ReviewStatus;
  
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Title Page fields
  houseCode?: string;
  carNumber?: string;
  site?: string;
  startedAt: string;
  
  // Legacy fields (keep for backwards compatibility)
  siteConducted?: string;
  dateTime?: string;
  houseNumber?: string;
  vehicleId?: string;
  
  // Page 1 - Accept/Reject
  acceptReject?: "yes" | "no";
  rejectReason?: string;
  
  // Page 2 - Final Inspection
  isLoadBalanced?: "yes" | "no";
  loadNo?: string;
  
  // Media (photos)
  media: {
    doorwayExteriorAndInterior?: string[];
    doorwayBeforeClosing?: string[];
  };
  
  // Notes / actions stubs
  notes?: string[];
  
  // Dual signatures: initial (Page 1) and final (Page 2)
  inspectorSignatures?: {
    initial?: {
      fullName?: string;
      signatureDataUrl?: string;
      signedAt?: string;
    };
    final?: {
      fullName?: string;
      signatureDataUrl?: string;
      signedAt?: string;
    };
  };
  
  // Manager review
  managerNote?: string;
  
  // Legacy signature support (backwards compatibility)
  inspectorSignature?: {
    fullName?: string;
    signatureDataUrl?: string;
    signedAt?: string;
  };
}

export interface InspectionFormConfig {
  sections: {
    id: string;
    label: string;
    enabled: boolean;
    required: boolean;
    order: number;
  }[];
}