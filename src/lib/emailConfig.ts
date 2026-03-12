/**
 * Email configuration storage for inspection auto-send
 */

export interface EmailConfig {
  enabled: boolean;
  recipients: string[]; // Multiple email addresses
  subject: string;
  bodyTemplate: string;
  autoSendOnComplete: boolean;
  lastSentAt?: string;
}

const EMAIL_CONFIG_KEY = "gp_email_config_v1";

export const emailConfigStorage = {
  getConfig: (): EmailConfig => {
    if (typeof window === "undefined") {
      return getDefaultEmailConfig();
    }
    
    try {
      const saved = localStorage.getItem(EMAIL_CONFIG_KEY);
      if (!saved) return getDefaultEmailConfig();
      return JSON.parse(saved);
    } catch (error) {
      console.error("[EmailConfig] Failed to load config:", error);
      return getDefaultEmailConfig();
    }
  },

  saveConfig: (config: EmailConfig) => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error("[EmailConfig] Failed to save config:", error);
    }
  },

  addRecipient: (email: string) => {
    const config = emailConfigStorage.getConfig();
    if (!config.recipients.includes(email)) {
      config.recipients.push(email);
      emailConfigStorage.saveConfig(config);
    }
  },

  removeRecipient: (email: string) => {
    const config = emailConfigStorage.getConfig();
    config.recipients = config.recipients.filter(e => e !== email);
    emailConfigStorage.saveConfig(config);
  },
};

function getDefaultEmailConfig(): EmailConfig {
  return {
    enabled: false,
    recipients: [],
    subject: "Inspection Report - {{carNumber}} - {{date}}",
    bodyTemplate: "Please find attached the inspection report for railcar {{carNumber}}.\n\nInspection completed on {{date}} at {{site}}.\n\nStatus: {{status}}\n\nThank you.",
    autoSendOnComplete: false,
  };
}

/**
 * Template variable replacement for email subject/body
 */
export function fillEmailTemplate(template: string, inspection: any): string {
  return template
    .replace(/\{\{carNumber\}\}/g, inspection.carNumber || "N/A")
    .replace(/\{\{date\}\}/g, new Date(inspection.completedAt || inspection.createdAt).toLocaleDateString())
    .replace(/\{\{site\}\}/g, inspection.site || "N/A")
    .replace(/\{\{status\}\}/g, inspection.status || "N/A")
    .replace(/\{\{houseCode\}\}/g, inspection.houseCode || "N/A");
}