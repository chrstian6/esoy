// components/settings/PromoCodeManagementModal.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, XCircle } from "lucide-react";
import { useModalStore } from "@/lib/stores";
import {
  redeemPromoCode,
  getPromoCodes,
  deactivatePromoCode,
  deletePromoCode,
} from "@/action/promoCodeActions";

interface PromoCode {
  _id: string;
  code: string;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  isUnique: boolean;
  recipients: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function PromoCodeManagementModal() {
  const { isPromoCodeManagementOpen, closePromoCodeManagement } =
    useModalStore();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'active', 'expired'

  useEffect(() => {
    const fetchPromoCodes = async () => {
      if (!isPromoCodeManagementOpen) return;

      setIsLoading(true);
      try {
        const result = await getPromoCodes();
        if (result.success && result.data) {
          setPromoCodes(result.data as PromoCode[]);
        } else {
          toast.error(result.message || "Failed to fetch promo codes");
        }
      } catch (error) {
        toast.error("Error fetching promo codes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromoCodes();
  }, [isPromoCodeManagementOpen]);

  const handleRedeem = async () => {
    if (!redeemCode) {
      toast.error("Please enter a promo code");
      return;
    }

    setIsRedeeming(true);
    try {
      const result = await redeemPromoCode(redeemCode);
      if (result.success) {
        toast.success(result.message);
        const updatedResult = await getPromoCodes();
        if (updatedResult.success && updatedResult.data) {
          setPromoCodes(updatedResult.data as PromoCode[]);
        }
        setRedeemCode("");
      } else {
        toast.error(result.message || "Failed to redeem promo code");
      }
    } catch (error) {
      console.error("Error redeeming promo code:", error);
      toast.error("Error redeeming promo code");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleDeactivate = async (codeId: string) => {
    setIsDeactivating(codeId);
    try {
      const result = await deactivatePromoCode(codeId);
      if (result.success) {
        toast.success("Promo code deactivated");
        const updatedResult = await getPromoCodes();
        if (updatedResult.success && updatedResult.data) {
          setPromoCodes(updatedResult.data as PromoCode[]);
        }
      } else {
        toast.error(result.message || "Failed to deactivate promo code");
      }
    } catch (error) {
      console.error("Error deactivating promo code:", error);
      toast.error("Error deactivating promo code");
    } finally {
      setIsDeactivating(null);
    }
  };

  const handleDelete = async (codeId: string) => {
    setIsDeleting(codeId);
    try {
      const result = await deletePromoCode(codeId);
      if (result.success) {
        toast.success("Promo code deleted");
        setPromoCodes(promoCodes.filter((code) => code._id !== codeId));
      } else {
        toast.error(result.message || "Failed to delete promo code");
      }
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast.error("Error deleting promo code");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredPromoCodes = promoCodes.filter((code) => {
    const now = new Date();
    const expiresAt = new Date(code.expiresAt);
    if (filter === "active") {
      return expiresAt > now && code.usedCount < code.usageLimit;
    }
    if (filter === "expired") {
      return expiresAt <= now || code.usedCount >= code.usageLimit;
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog
      open={isPromoCodeManagementOpen}
      onOpenChange={closePromoCodeManagement}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="sticky top-0 bg-none z-10 pb-4 border-b">
          <DialogTitle className="text-xl sm:text-2xl font-semibold">
            Promo Code Management
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            View and manage available promo codes
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 py-2 px-1">
          <div className="space-y-6">
            {/* Redeem Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">Redeem Promo Code</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="Enter promo code"
                  className="flex-1"
                />
                <Button
                  onClick={handleRedeem}
                  disabled={isRedeeming}
                  className="min-w-[120px]"
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    "Redeem"
                  )}
                </Button>
              </div>
            </div>

            {/* Promo Codes List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Available Promo Codes</h3>
                <div className="flex gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("active")}
                  >
                    Active
                  </Button>
                  <Button
                    variant={filter === "expired" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("expired")}
                  >
                    Expired
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredPromoCodes.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No promo codes found
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredPromoCodes.map((code) => {
                    const expiresAt = new Date(code.expiresAt);
                    const isExpired = expiresAt <= new Date();
                    const isUsedUp = code.usedCount >= code.usageLimit;
                    const isValid = !isExpired && !isUsedUp;

                    return (
                      <div
                        key={code._id}
                        className={`p-4 border rounded-lg ${
                          isValid ? "bg-white" : "bg-muted/50"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-mono font-bold">{code.code}</p>
                            <p className="text-sm text-muted-foreground">
                              Expires: {formatDate(code.expiresAt)}
                            </p>
                            {code.isUnique && (
                              <p className="text-xs text-blue-600 mt-1">
                                Single-use code
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              {code.usedCount}/{code.usageLimit} uses
                            </p>
                            <p
                              className={`text-xs ${
                                isValid ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {isExpired
                                ? "Expired"
                                : isUsedUp
                                ? "Fully redeemed"
                                : "Active"}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-3">
                          {isValid && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivate(code._id)}
                              disabled={isDeactivating === code._id}
                            >
                              {isDeactivating === code._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(code._id)}
                            disabled={isDeleting === code._id}
                          >
                            {isDeleting === code._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
