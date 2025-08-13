// types/newsletter.ts
export interface NewsletterData {
  recipientType: string;
  specificEmail?: string;
  subject: string;
  message: string;
  includePromo?: boolean;
  promoCode?: string;
  promoData?: {
    promoCode: string;
    expiresAt: string;
    usageLimit: number;
    isUnique: boolean;
  };
  recipients?: string[];
}
