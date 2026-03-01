export interface RedeemCodeRewards {
  nexusCoins?: number;
  packs?: string[]; // Pack IDs from BoosterPack system
  cards?: string[]; // Individual card IDs (future feature)
}

export interface RedeemCode {
  id: string;
  code: string; // The actual redemption code (e.g., "WELCOME2024")
  rewards: RedeemCodeRewards;
  expiryDate: Date;
  isActive: boolean;
  isMultiUse: boolean; // Can be used by multiple users
  usageLimit?: number; // Maximum total uses (for multi-use codes)
  usedCount: number; // Current usage count
  createdAt: Date;
  createdBy: string; // Admin who created the code
  description?: string; // Internal description for admin
}

export interface RedeemResult {
  success: boolean;
  error?: string;
  rewards?: RedeemCodeRewards;
  message?: string; // Success message to show user
  // Details of awarded items for UI animations
  details?: {
    coins?: number;
    packs?: any[]; // BoosterPack
    cards?: import('../models/cards-extended').ExtendedCard[];
  };
}

export interface UserRedemptionHistory {
  code: string;
  redeemedAt: Date;
  rewards: RedeemCodeRewards;
}

// Extended user document fields for redeem system
export interface UserRedeemData {
  redeemedCodes: string[]; // Array of redeemed code strings
  lastCodeRedeemed?: {
    code: string;
    redeemedAt: Date;
  };
}
