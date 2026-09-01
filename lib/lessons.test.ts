import { describe, expect, it } from "vitest";
import { expandIndividualBooking } from "./lessons";

const booking = {
  id: "booking-1", area: "tajweed", starts_on: "2026-01-01", duration_minutes: 60,
  meeting_link: "https://example.com/lesson", slots: [{ weekday: 1, start_time: "18:00" }],
};

describe("individual lesson calendar", () => {
  it("uses Stockholm winter and summer time", () => {
    const winter = expandIndividualBooking(booking, new Date("2026-01-05T00:00:00Z"), new Date("2026-01-05T23:00:00Z"));
    const summer = expandIndividualBooking(booking, new Date("2026-06-01T00:00:00Z"), new Date("2026-06-01T23:00:00Z"));
    expect(winter[0].scheduled_at).toBe("2026-01-05T17:00:00.000Z");
    expect(summer[0].scheduled_at).toBe("2026-06-01T16:00:00.000Z");
  });

  it("cancels or reschedules a single occurrence", () => {
    const cancelled = expandIndividualBooking({ ...booking, exceptions: [{ original_date: "2026-01-05", replacement_start: null, status: "cancelled" }] }, new Date("2026-01-05T00:00:00Z"), new Date("2026-01-05T23:00:00Z"));
    expect(cancelled).toHaveLength(0);
    const moved = expandIndividualBooking({ ...booking, exceptions: [{ original_date: "2026-01-05", replacement_start: "2026-01-06T19:00:00.000Z", status: "rescheduled" }] }, new Date("2026-01-05T00:00:00Z"), new Date("2026-01-07T00:00:00Z"));
    expect(moved[0].scheduled_at).toBe("2026-01-06T19:00:00.000Z");
  });
});
