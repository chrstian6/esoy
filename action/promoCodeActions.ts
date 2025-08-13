// action/promoCodeActions.ts
"use server";

import PromoCode, { IPromoCode } from "@/models/PromoCode";
import dbConnect from "@/lib/mongodb";

interface ISerializedPromoCode
  extends Omit<IPromoCode, "_id" | "expiresAt" | "createdAt" | "updatedAt"> {
  _id: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export const getPromoCodes = async () => {
  try {
    await dbConnect();
    const promoCodes = await PromoCode.find<IPromoCode>()
      .sort({ createdAt: -1 })
      .lean<IPromoCode[]>();

    const serializedPromoCodes: ISerializedPromoCode[] = promoCodes.map(
      (code) => ({
        _id: code._id!.toString(),
        code: code.code,
        expiresAt: code.expiresAt.toISOString(),
        usageLimit: code.usageLimit,
        usedCount: code.usedCount,
        isUnique: code.isUnique,
        recipients: code.recipients,
        createdAt: code.createdAt!.toISOString(),
        updatedAt: code.updatedAt!.toISOString(),
        __v: code.__v!,
      })
    );

    return {
      success: true,
      data: serializedPromoCodes,
    };
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return {
      success: false,
      message: "Failed to fetch promo codes",
    };
  }
};

export const redeemPromoCode = async (code: string) => {
  try {
    await dbConnect();
    const now = new Date();

    const promoCode = await PromoCode.findOne({ code });
    if (!promoCode) {
      return {
        success: false,
        message: "Promo code not found",
      };
    }

    if (new Date(promoCode.expiresAt) <= now) {
      return {
        success: false,
        message: "This promo code has expired",
      };
    }

    if (promoCode.usedCount >= promoCode.usageLimit) {
      return {
        success: false,
        message: "This promo code has been fully redeemed",
      };
    }

    promoCode.usedCount += 1;
    await promoCode.save();

    return {
      success: true,
      message: "Promo code redeemed successfully",
    };
  } catch (error) {
    console.error("Error redeeming promo code:", error);
    return {
      success: false,
      message: "Error redeeming promo code",
    };
  }
};

export const deactivatePromoCode = async (id: string) => {
  try {
    await dbConnect();

    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return {
        success: false,
        message: "Promo code not found",
      };
    }

    // Set expiration to now to deactivate
    promoCode.expiresAt = new Date();
    await promoCode.save();

    return {
      success: true,
      message: "Promo code deactivated successfully",
    };
  } catch (error) {
    console.error("Error deactivating promo code:", error);
    return {
      success: false,
      message: "Error deactivating promo code",
    };
  }
};

export const deletePromoCode = async (id: string) => {
  try {
    await dbConnect();

    const result = await PromoCode.findByIdAndDelete(id);
    if (!result) {
      return {
        success: false,
        message: "Promo code not found",
      };
    }

    return {
      success: true,
      message: "Promo code deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return {
      success: false,
      message: "Error deleting promo code",
    };
  }
};
