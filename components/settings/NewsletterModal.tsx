"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import {
  sendNewsletter,
  getSubscribers,
  validatePromoCode,
  storePromoCodes,
} from "@/action/newsletterActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewsletterModalProps {
  onClose: () => void;
  isOpen: boolean;
}

interface PromoCodeDetails {
  code: string;
  expiresAt: string;
  usageLimit: number;
  isUnique: boolean;
  isCustom: boolean;
}

export default function NewsletterModal({
  onClose,
  isOpen,
}: NewsletterModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    recipientType: "all",
    specificEmail: "",
    subject: "",
    message: "",
    includePromo: false,
  });
  const [promoCodeDetails, setPromoCodeDetails] = useState<PromoCodeDetails>({
    code: "",
    expiresAt: "",
    usageLimit: 1,
    isUnique: false,
    isCustom: false,
  });
  const [promoConfig, setPromoConfig] = useState({
    expiresIn: "7",
    usageLimit: "1",
    customExpiresDays: "",
    customUsageLimit: "",
    useCustomExpiry: false,
    useCustomLimit: false,
  });
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch subscribers from MongoDB
  useEffect(() => {
    const fetchSubscribers = async () => {
      setIsLoadingSubscribers(true);
      try {
        const result = await getSubscribers();
        if (result.success && result.data) {
          setSubscribers(result.data);
        } else {
          toast.error(result.message || "Failed to fetch subscribers");
        }
      } catch (error) {
        console.error("Error fetching subscribers:", error);
        toast.error("Error fetching subscribers");
      } finally {
        setIsLoadingSubscribers(false);
      }
    };

    if (isOpen) {
      fetchSubscribers();
    }
  }, [isOpen]);

  // Memoized filtered email suggestions with proper null checks
  const filteredSuggestions = useMemo(() => {
    if (!formData.specificEmail || !subscribers || subscribers.length === 0) {
      return [];
    }

    const searchTerm = formData.specificEmail.toLowerCase();
    return subscribers.filter(
      (email) =>
        email &&
        typeof email === "string" &&
        email.toLowerCase().includes(searchTerm)
    );
  }, [formData.specificEmail, subscribers]);

  // Generate promo code when recipient type changes
  useEffect(() => {
    if (
      formData.includePromo &&
      !promoCodeDetails.code &&
      !promoCodeDetails.isCustom
    ) {
      generatePromoCode();
    }
  }, [formData.includePromo, formData.recipientType]);

  const generatePromoCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPromoCodeDetails((prev) => ({
      ...prev,
      code,
      isUnique: formData.recipientType === "specific",
      isCustom: false,
    }));
    setValidationResult(null);
  };

  const handleCustomPromoCode = (code: string) => {
    setPromoCodeDetails((prev) => ({
      ...prev,
      code,
      isCustom: true,
    }));
    setValidationResult(null);
  };

  const handleValidatePromoCode = async () => {
    if (!promoCodeDetails.code) {
      setValidationResult({
        isValid: false,
        message: "Please generate or enter a promo code",
      });
      return;
    }

    try {
      const result = await validatePromoCode(promoCodeDetails.code);
      setValidationResult({
        isValid: result.success,
        message: result.message,
      });
    } catch (error) {
      console.error("Validation error:", error);
      setValidationResult({
        isValid: false,
        message: "Error validating promo code",
      });
    }
  };

  const calculateExpiryDate = () => {
    const days =
      promoConfig.useCustomExpiry && promoConfig.customExpiresDays
        ? parseInt(promoConfig.customExpiresDays)
        : parseInt(promoConfig.expiresIn);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate.toISOString();
  };

  const getUsageLimit = () => {
    if (promoConfig.useCustomLimit && promoConfig.customUsageLimit) {
      return parseInt(promoConfig.customUsageLimit);
    }
    return parseInt(promoConfig.usageLimit);
  };

  const storePromoCodesInDB = async (promoData: PromoCodeDetails) => {
    try {
      const result = await storePromoCodes({
        code: promoData.code,
        expiresAt: calculateExpiryDate(),
        usageLimit: getUsageLimit(),
        isUnique: promoData.isUnique,
        recipients:
          formData.recipientType === "all"
            ? subscribers
            : [formData.specificEmail],
      });

      if (!result.success) {
        throw new Error(result.message);
      }
      return true;
    } catch (error) {
      console.error("Error storing promo codes:", error);
      toast.error("Failed to store promo codes");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      // Store promo codes first if included
      if (formData.includePromo) {
        const stored = await storePromoCodesInDB(promoCodeDetails);
        if (!stored) return;
      }

      const newsletterData = {
        recipientType: formData.recipientType,
        subject: formData.subject,
        message: formData.message,
        recipients:
          formData.recipientType === "all"
            ? subscribers
            : [formData.specificEmail],
        promoCode: formData.includePromo ? promoCodeDetails.code : undefined,
      };

      const result = await sendNewsletter(newsletterData);

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message);
      onClose();
    } catch (error) {
      console.error("Error sending newsletter:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send newsletter"
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-semibold">
            Newsletter
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Send promotions and updates to your subscribers
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 space-y-4"
        >
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Recipient</Label>
            <RadioGroup
              value={formData.recipientType}
              className="flex flex-col sm:flex-row gap-4"
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, recipientType: value }));
                if (formData.includePromo) {
                  setPromoCodeDetails((prev) => ({
                    ...prev,
                    isUnique: value === "specific",
                  }));
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="text-sm sm:text-base">
                  All Subscribers ({subscribers.length})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific" className="text-sm sm:text-base">
                  Specific Subscriber
                </Label>
              </div>
            </RadioGroup>

            {formData.recipientType === "specific" && (
              <div className="space-y-2 relative">
                <Label htmlFor="specificEmail" className="text-sm sm:text-base">
                  Email Address
                </Label>
                <Input
                  id="specificEmail"
                  name="specificEmail"
                  type="email"
                  value={formData.specificEmail}
                  onChange={(e) => {
                    const value = e.target.value || "";
                    setFormData((prev) => ({ ...prev, specificEmail: value }));
                    setEmailSuggestions(value ? filteredSuggestions : []);
                  }}
                  placeholder="Enter subscriber email"
                  required
                  disabled={isLoadingSubscribers}
                  className="text-sm sm:text-base"
                />
                {isLoadingSubscribers && (
                  <Loader2 className="absolute right-3 top-8 h-4 w-4 animate-spin" />
                )}
                {emailSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {emailSuggestions.map((email) => (
                      <div
                        key={email}
                        className="px-4 py-2 hover:bg-accent cursor-pointer text-sm sm:text-base"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            specificEmail: email,
                          }));
                          setEmailSuggestions([]);
                        }}
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm sm:text-base">
              Subject
            </Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="Newsletter subject"
              required
              className="text-sm sm:text-base"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm sm:text-base">
              Message
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Write your newsletter content here"
              rows={6}
              className="min-h-[100px] max-h-[200px] resize-y text-sm sm:text-base"
              required
            />
          </div>

          {/* Promo Code Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includePromo"
                name="includePromo"
                checked={formData.includePromo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    includePromo: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              />
              <Label htmlFor="includePromo" className="text-sm sm:text-base">
                Include Promo Code
              </Label>
            </div>

            {formData.includePromo && (
              <>
                {/* Promo Code Validation */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <Label htmlFor="promoCode" className="text-sm sm:text-base">
                    Promo Code
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="promoCode"
                      name="promoCode"
                      value={promoCodeDetails.code}
                      onChange={(e) => handleCustomPromoCode(e.target.value)}
                      placeholder="Enter custom promo code"
                      className="text-sm sm:text-base"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generatePromoCode}
                        className="flex-1 text-sm sm:text-base"
                      >
                        Generate Random
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleValidatePromoCode}
                        className="flex-1 text-sm sm:text-base"
                      >
                        Validate
                      </Button>
                    </div>
                  </div>
                  {validationResult && (
                    <p
                      className={`text-sm mt-1 ${
                        validationResult.isValid
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {validationResult.message}
                    </p>
                  )}
                </div>

                {/* Promo Code Details */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-sm sm:text-base font-medium">
                    Promo Code Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="promoExpires"
                        className="text-sm sm:text-base"
                      >
                        Expires In
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select
                          value={promoConfig.expiresIn}
                          onValueChange={(value) =>
                            setPromoConfig((prev) => ({
                              ...prev,
                              expiresIn: value,
                              useCustomExpiry: false,
                            }))
                          }
                          disabled={promoConfig.useCustomExpiry}
                        >
                          <SelectTrigger className="text-sm sm:text-base">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="60">60 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant={
                            promoConfig.useCustomExpiry ? "default" : "outline"
                          }
                          onClick={() =>
                            setPromoConfig((prev) => ({
                              ...prev,
                              useCustomExpiry: !prev.useCustomExpiry,
                            }))
                          }
                          className="text-sm sm:text-base"
                        >
                          Custom
                        </Button>
                      </div>
                      {promoConfig.useCustomExpiry && (
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter days"
                          value={promoConfig.customExpiresDays}
                          onChange={(e) =>
                            setPromoConfig((prev) => ({
                              ...prev,
                              customExpiresDays: e.target.value,
                            }))
                          }
                          className="text-sm sm:text-base"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="promoUsageLimit"
                        className="text-sm sm:text-base"
                      >
                        Usage Limit
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select
                          value={promoConfig.usageLimit}
                          onValueChange={(value) =>
                            setPromoConfig((prev) => ({
                              ...prev,
                              usageLimit: value,
                              useCustomLimit: false,
                            }))
                          }
                          disabled={promoConfig.useCustomLimit}
                        >
                          <SelectTrigger className="text-sm sm:text-base">
                            <SelectValue placeholder="Select limit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 time</SelectItem>
                            <SelectItem value="5">5 times</SelectItem>
                            <SelectItem value="10">10 times</SelectItem>
                            <SelectItem value="100">100 times</SelectItem>
                            <SelectItem value="0">Unlimited</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant={
                            promoConfig.useCustomLimit ? "default" : "outline"
                          }
                          onClick={() =>
                            setPromoConfig((prev) => ({
                              ...prev,
                              useCustomLimit: !prev.useCustomLimit,
                            }))
                          }
                          className="text-sm sm:text-base"
                        >
                          Custom
                        </Button>
                      </div>
                      {promoConfig.useCustomLimit && (
                        <Input
                          type="number"
                          min="0"
                          placeholder="Enter limit"
                          value={promoConfig.customUsageLimit}
                          onChange={(e) =>
                            setPromoConfig((prev) => ({
                              ...prev,
                              customUsageLimit: e.target.value,
                            }))
                          }
                          className="text-sm sm:text-base"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </form>

        <div className="bg-background pt-2 pb-4 px-4 z-10">
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSending}
              className="text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={isSending || isLoadingSubscribers}
              className="min-w-[120px] text-sm sm:text-base"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Newsletter"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
