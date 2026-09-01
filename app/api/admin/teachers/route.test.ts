import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createAdminClient: vi.fn(),
  sendTeacherInviteEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/require-admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/email", () => ({ sendTeacherInviteEmail: mocks.sendTeacherInviteEmail }));

import { POST } from "./route";

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/admin/teachers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function adminClient(existingProfile: { id: string; role: string } | null, linkType: "invite" | "recovery" = "invite") {
  const upsert = vi.fn(async () => ({ error: null }));
  const maybeSingle = vi.fn(async () => ({ data: existingProfile, error: null }));
  const from = vi.fn()
    .mockReturnValueOnce({
      select: () => ({ ilike: () => ({ limit: () => ({ maybeSingle }) }) }),
    })
    .mockReturnValueOnce({ upsert });
  const generateLink = vi.fn(async ({ type }: { type: string }) => {
    if (type !== linkType) return { data: {}, error: new Error("wrong link type") };
    return {
      data: { user: { id: existingProfile?.id ?? "new-teacher-id" }, properties: { action_link: "https://example.test/set-password" } },
      error: null,
    };
  });
  return { client: { from, auth: { admin: { generateLink } } }, upsert, generateLink };
}

describe("POST /api/admin/teachers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ supabase: {}, error: null });
    mocks.sendTeacherInviteEmail.mockResolvedValue(undefined);
  });

  it("creates a new auth user directly as a teacher and sends an invite", async () => {
    const admin = adminClient(null);
    mocks.createAdminClient.mockReturnValue(admin.client);

    const response = await POST(request({ full_name: "Ahmed Hassan", email: " Ahmed@Example.com " }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: "new-teacher-id", created: true, promoted: false });
    expect(admin.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: "new-teacher-id", email: "ahmed@example.com", full_name: "Ahmed Hassan", role: "teacher" }), { onConflict: "id" });
    expect(mocks.sendTeacherInviteEmail).toHaveBeenCalledWith(expect.objectContaining({ toEmail: "ahmed@example.com" }));
  });

  it("requires confirmation before promoting an existing student", async () => {
    const admin = adminClient({ id: "student-id", role: "student" }, "recovery");
    mocks.createAdminClient.mockReturnValue(admin.client);

    const response = await POST(request({ full_name: "Fatima", email: "fatima@example.com" }));

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "existing_student" });
    expect(admin.generateLink).not.toHaveBeenCalled();
  });

  it("promotes an existing student after explicit confirmation", async () => {
    const admin = adminClient({ id: "student-id", role: "student" }, "recovery");
    mocks.createAdminClient.mockReturnValue(admin.client);

    const response = await POST(request({ full_name: "Fatima", email: "fatima@example.com", confirm_existing: true }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ created: false, promoted: true });
    expect(admin.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: "student-id", role: "teacher" }), { onConflict: "id" });
  });

  it("never changes an admin account into a teacher", async () => {
    const admin = adminClient({ id: "admin-id", role: "admin" }, "recovery");
    mocks.createAdminClient.mockReturnValue(admin.client);

    const response = await POST(request({ full_name: "Admin", email: "admin@example.com", confirm_existing: true }));

    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("adminkonto");
    expect(admin.generateLink).not.toHaveBeenCalled();
  });
});
