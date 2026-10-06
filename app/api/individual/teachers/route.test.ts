import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { GET } from "./route";

type QueryResult = {
  data: unknown[] | null;
  error: { message: string; code: string } | null;
};

function query(result: Promise<QueryResult>) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: result.then.bind(result),
  };
}

function adminClient(
  teachers: Promise<QueryResult> = Promise.resolve({ data: [], error: null }),
  availability: Promise<QueryResult> = Promise.resolve({ data: [], error: null }),
) {
  return {
    from: vi.fn()
      .mockReturnValueOnce(query(teachers))
      .mockReturnValueOnce(query(availability)),
  };
}

async function expectLoadError(cause: unknown) {
  const response = await GET();

  expect(response.status).toBe(500);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({ error: "Could not load teachers. Please try again." });
  expect(console.error).toHaveBeenCalledWith("Could not load individual lesson teachers:", cause);
}

describe("GET /api/individual/teachers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns teachers with their availability and prevents caching", async () => {
    const teachers = [
      { id: "teacher-1", full_name: "Ahmed", avatar_url: null },
      { id: "teacher-2", full_name: "Fatima", avatar_url: null },
    ];
    const availability = [
      { id: "weekly-slot", teacher_id: "teacher-1", weekday: 1, specific_date: null, start_time: "09:00:00", end_time: "10:00:00", lesson_duration_minutes: 60, buffer_minutes: 5 },
      { id: "dated-slot", teacher_id: "teacher-1", weekday: null, specific_date: "2026-10-10", start_time: "09:00:00", end_time: "10:00:00", lesson_duration_minutes: 60, buffer_minutes: 5 },
    ];
    mocks.createAdminClient.mockReturnValue(adminClient(
      Promise.resolve({ data: teachers, error: null }),
      Promise.resolve({ data: availability, error: null }),
    ));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual([
      { ...teachers[0], availability },
      { ...teachers[1], availability: [] },
    ]);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("returns an empty array when the queries contain no rows", async () => {
    mocks.createAdminClient.mockReturnValue(adminClient(
      Promise.resolve({ data: null, error: null }),
      Promise.resolve({ data: null, error: null }),
    ));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it.each(["teachers", "availability"])("reports a %s query error without exposing database details", async (failedQuery) => {
    const cause = { message: "Internal database connection details", code: "PGRST205" };
    const failed = Promise.resolve({ data: null, error: cause });
    const succeeded = Promise.resolve({ data: [], error: null });
    mocks.createAdminClient.mockReturnValue(adminClient(
      failedQuery === "teachers" ? failed : succeeded,
      failedQuery === "availability" ? failed : succeeded,
    ));

    await expectLoadError(cause);
  });

  it("handles errors thrown while creating the admin client", async () => {
    const cause = new Error("supabaseUrl is required.");
    mocks.createAdminClient.mockImplementation(() => { throw cause; });

    await expectLoadError(cause);
  });

  it("handles rejected network requests", async () => {
    const cause = new TypeError("fetch failed");
    mocks.createAdminClient.mockReturnValue(adminClient(Promise.reject(cause)));

    await expectLoadError(cause);
  });
});
