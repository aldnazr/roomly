import type { AvailabilityQueryInput } from "../schema";
import type { AvailabilityRepository, NightlyPrice, AvailableRoomTypeResult, AvailabilityResponseDto } from "./ports";

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (current < end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export class AvailabilityService {
  constructor(private readonly repository: AvailabilityRepository) {}

  async searchAvailability(query: AvailabilityQueryInput): Promise<AvailabilityResponseDto> {
    const dates = getDatesInRange(query.check_in, query.check_out);
    const nights = dates.length;

    const roomTypes = await this.repository.listRoomTypes(query.guests);

    const results: AvailableRoomTypeResult[] = [];

    for (const rt of roomTypes) {
      const operableRooms = await this.repository.listOperableRooms(rt.id);
      const operableRoomIds = new Set(operableRooms.map((r) => r.id));
      const totalOperable = operableRoomIds.size;

      if (totalOperable === 0) continue;

      const reservations = await this.repository.listReservations(rt.id, query.check_out, query.check_in);

      let minAvailable = totalOperable;

      for (const date of dates) {
        const activeForDate = reservations.filter(
          (r) => r.check_in <= date && r.check_out > date,
        );

        const assignedOperable = new Set<string>();
        let unassignedCount = 0;

        for (const res of activeForDate) {
          if (res.room_id !== null) {
            if (operableRoomIds.has(res.room_id)) {
              assignedOperable.add(res.room_id);
            }
          } else {
            unassignedCount += 1;
          }
        }

        const bookedCount = assignedOperable.size + unassignedCount;
        const availableOnDate = Math.max(0, totalOperable - bookedCount);

        if (availableOnDate < minAvailable) {
          minAvailable = availableOnDate;
        }

        if (minAvailable === 0) break;
      }

      if (minAvailable <= 0) continue;

      const pricingRules = await this.repository.listPricingRules(rt.id, query.check_out, query.check_in);

      const nightly: NightlyPrice[] = dates.map((date) => {
        const activeRule = pricingRules.find(
          (rule) => rule.start_date <= date && rule.end_date >= date,
        );

        let price = rt.base_price;
        if (activeRule) {
          if (activeRule.price_override !== null) {
            price = activeRule.price_override;
          } else if (activeRule.multiplier !== null) {
            price = Math.round(rt.base_price * activeRule.multiplier);
          }
        }

        return { date, price };
      });

      const total = nightly.reduce((sum, item) => sum + item.price, 0);
      const average_nightly = Math.round(total / nights);

      results.push({
        room_type: rt,
        available_rooms: minAvailable,
        price: { nightly, total, average_nightly },
      });
    }

    return {
      check_in: query.check_in,
      check_out: query.check_out,
      nights,
      guests: query.guests,
      results,
    };
  }
}
