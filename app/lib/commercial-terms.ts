export const DIRECT_APPLICATION_TERMS = {
  standardDepositTwd: 6000,
  promoDepositTwd: 3000,
  promoDeadlineDays: 7,
} as const;

export const CONSULTATION_TERMS = {
  priceTwd: 800,
  originalPriceTwd: 1000,
  bookingHoldHours: 24,
} as const;

export const ACCOMMODATION_TERMS = {
  arrangementFeeTwd: 1500,
  arrangementFeeOriginalTwd: 2000,
  arrangementFeeRefundable: false,
} as const;

export const LEEVIN_TERMS = {
  hostel: { minimumWeeks: 1, longStayDiscountFromWeeks: 4 },
  student: { minimumWeeks: 4, longStayDiscountFromWeeks: 8 },
  // IMPORTANT: The Lilai-Leevin partner agreement is the source of truth.
  // Do not update these rules from public retail terms without business approval.
  cancellationPolicy: [
    ["入住日前 21 天以上", "住宿費全額退還"],
    ["入住日前 14–21 天", "退還住宿費 50%"],
    ["入住日前 14 天以內", "住宿費不退"],
    ["No-show（未通知未到）", "住宿費不退"],
  ] as const,
} as const;

export function formatTwd(value: number): string {
  return `NT$${value.toLocaleString("en-US")}`;
}
