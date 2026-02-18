export const BOOSTER_DURATION_HOURS = 24;

export const QR_BOOSTER_CONFIG: Record<string, { multiplier: number; label: string }> = {
  food:       { multiplier: 1.5, label: "건강식품" },
  supplement: { multiplier: 1.3, label: "건강보조식품" },
  drink:      { multiplier: 1.2, label: "건강음료" },
  default:    { multiplier: 1.2, label: "기본" },
};

export function getBoosterMultiplier(qrType?: string): { multiplier: number; boosterType: string } {
  const key = qrType?.toLowerCase() || "default";
  const config = QR_BOOSTER_CONFIG[key] || QR_BOOSTER_CONFIG.default;
  const boosterType = `QR_${(key === "default" ? "DEFAULT" : key).toUpperCase()}`;
  return { multiplier: config.multiplier, boosterType };
}
