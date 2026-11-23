import type { Promotion } from "@/types";

const JS_DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/**
 * Determina si una promoción se puede canjear en este preciso instante
 * según su estado, rango de fechas, día de la semana, franja horaria y cupo.
 */
export function isPromotionAvailableNow(promo: Promotion, now = new Date()): boolean {
  if (promo.status !== "ACTIVE") return false;

  const nowMs = now.getTime();
  if (new Date(promo.startDate).getTime() > nowMs) return false;
  if (new Date(promo.endDate).getTime() < nowMs) return false;

  if (promo.maxRedemptions > 0 && (promo.currentRedemptions || 0) >= promo.maxRedemptions) {
    return false;
  }

  if (promo.daysOfWeek && promo.daysOfWeek.length > 0) {
    const todayKey = JS_DAYS[now.getDay()];
    if (!promo.daysOfWeek.includes(todayKey)) {
      return false;
    }
  }

  if (promo.startTime && promo.endTime) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const currentHm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const startHm = promo.startTime.slice(0, 5);
    const endHm = promo.endTime.slice(0, 5);
    if (currentHm < startHm || currentHm >= endHm) {
      return false;
    }
  }

  return true;
}
