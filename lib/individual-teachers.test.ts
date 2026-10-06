import { afterEach, describe, expect, it, vi } from "vitest";
import { loadIndividualTeachers, TEACHERS_LOAD_ERROR } from "./individual-teachers";

const teacher = {
  id: "teacher-1",
  full_name: "Test Teacher",
  availability: [{
    id: "availability-1", weekday: 1, start_time: "18:00:00", end_time: "20:00:00",
    lesson_duration_minutes: 60, buffer_minutes: 0,
  }],
};

afterEach(() => vi.unstubAllGlobals());

describe("individual teacher loading", () => {
  it("loads teachers and forwards cancellation to the request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json([teacher]));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await expect(loadIndividualTeachers(controller.signal)).resolves.toEqual([teacher]);
    expect(fetchMock).toHaveBeenCalledWith("/api/individual/teachers", {
      cache: "no-store", signal: controller.signal,
    });
  });

  it("rejects the production 500 response instead of treating it as a teacher list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "TypeError: fetch failed" }, { status: 500 })));
    await expect(loadIndividualTeachers()).rejects.toThrow(TEACHERS_LOAD_ERROR);
  });

  it.each([null, { error: "Unavailable" }, [{}], [{ ...teacher, availability: null }], [{
    ...teacher, availability: [{ ...teacher.availability[0], lesson_duration_minutes: 0 }],
  }]])("rejects an unexpected successful response: %j", async data => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(data)));
    await expect(loadIndividualTeachers()).rejects.toThrow(TEACHERS_LOAD_ERROR);
  });

  it("allows an empty teacher list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));
    await expect(loadIndividualTeachers()).resolves.toEqual([]);
  });

  it("accepts unnamed teachers and dated availability without a weekday", async () => {
    const datedTeacher = { ...teacher, full_name: null, availability: [{ ...teacher.availability[0], weekday: null }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([datedTeacher])));
    await expect(loadIndividualTeachers()).resolves.toEqual([datedTeacher]);
  });

  it("rejects a non-JSON response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Unavailable</html>")));
    await expect(loadIndividualTeachers()).rejects.toThrow();
  });

  it("rejects a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(loadIndividualTeachers()).rejects.toThrow("fetch failed");
  });
});
