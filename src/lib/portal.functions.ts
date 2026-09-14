import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PortalUser = {
  fullName: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  downloadCount: number;
};

const emailSchema = z.string().trim().toLowerCase().email().max(255);

export const requestAccess = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        fullName: z.string().trim().min(2).max(100),
        email: emailSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { notifyAdminOfRequest } = await import("./portal-email.server");

    const { data: existing } = await supabaseAdmin
      .from("access_requests")
      .select("status")
      .eq("email", data.email)
      .maybeSingle();

    if (existing) {
      return {
        ok: true as const,
        duplicate: true as const,
        status: existing.status as PortalUser["status"],
      };
    }

    const { error } = await supabaseAdmin
      .from("access_requests")
      .insert({ full_name: data.fullName, email: data.email });

    if (error) throw new Error(error.message);

    await notifyAdminOfRequest(data.fullName, data.email);
    return { ok: true as const, duplicate: false as const, status: "pending" as const };
  });

export const loginWithEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ email: emailSchema }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("access_requests")
      .select("full_name, email, status, download_count")
      .eq("email", data.email)
      .maybeSingle();

    if (!row) return { outcome: "not_found" as const };
    if (row.status !== "approved") return { outcome: "pending" as const };

    await supabaseAdmin
      .from("access_requests")
      .update({ last_login_at: new Date().toISOString() })
      .eq("email", data.email);

    return {
      outcome: "approved" as const,
      user: {
        fullName: row.full_name,
        email: row.email,
        status: row.status,
        downloadCount: row.download_count,
      } satisfies PortalUser,
    };
  });

export const verifySession = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ email: emailSchema }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("access_requests")
      .select("full_name, email, status, download_count")
      .eq("email", data.email)
      .maybeSingle();

    if (!row || row.status !== "approved") return { valid: false as const };
    return {
      valid: true as const,
      user: {
        fullName: row.full_name,
        email: row.email,
        status: row.status,
        downloadCount: row.download_count,
      } satisfies PortalUser,
    };
  });

export const recordDownload = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        email: emailSchema,
        os: z.enum(["windows", "macos", "linux"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("access_requests")
      .select("download_count, status")
      .eq("email", data.email)
      .maybeSingle();

    if (!row || row.status !== "approved") throw new Error("Not authorized to download");

    await supabaseAdmin.from("downloads").insert({ email: data.email, os: data.os });
    await supabaseAdmin
      .from("access_requests")
      .update({ download_count: row.download_count + 1 })
      .eq("email", data.email);

    return { downloadCount: row.download_count + 1 };
  });

/* ---------------- Admin ---------------- */

function assertAdminKey(key: string) {
  const expected = process.env["ADMIN_PORTAL_KEY"] ?? "secret123";
  if (key !== expected) throw new Error("Invalid admin key");
}

export const getAdminAnalytics = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ adminKey: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    assertAdminKey(data.adminKey);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: requests }, { data: downloads }] = await Promise.all([
      supabaseAdmin
        .from("access_requests")
        .select("id, full_name, email, status, download_count, last_login_at, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("downloads").select("os, created_at, email"),
    ]);

    const rows = requests ?? [];
    const dl = downloads ?? [];

    const dayCount = 14;
    const timeline = Array.from({ length: dayCount }, (_, idx) => {
      const day = new Date();
      day.setUTCHours(0, 0, 0, 0);
      day.setUTCDate(day.getUTCDate() - (dayCount - 1 - idx));
      const next = new Date(day);
      next.setUTCDate(next.getUTCDate() + 1);

      const inDay = (value: string | null) =>
        value !== null && new Date(value) >= day && new Date(value) < next;

      return {
        date: day.toISOString().slice(5, 10),
        downloads: dl.filter((d) => inDay(d.created_at)).length,
        activeUsers: new Set(dl.filter((d) => inDay(d.created_at)).map((d) => d.email)).size,
      };
    });

    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

    return {
      kpis: {
        totalUsers: rows.length,
        approvedUsers: rows.filter((r) => r.status === "approved").length,
        pendingRequests: rows.filter((r) => r.status === "pending").length,
        activeDaily: rows.filter(
          (r) => r.last_login_at !== null && new Date(r.last_login_at).getTime() > dayAgo,
        ).length,
        totalDownloads: dl.length,
      },
      osSplit: (["windows", "macos", "linux"] as const).map((os) => ({
        os,
        value: dl.filter((d) => d.os === os).length,
      })),
      timeline,
      requests: rows.map((r) => ({
        id: r.id,
        fullName: r.full_name,
        email: r.email,
        status: r.status as PortalUser["status"],
        downloadCount: r.download_count,
        createdAt: r.created_at,
      })),
    };
  });

export const approveRequest = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ adminKey: z.string().min(1).max(200), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    assertAdminKey(data.adminKey);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { notifyUserApproved } = await import("./portal-email.server");

    const { data: row, error } = await supabaseAdmin
      .from("access_requests")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("full_name, email")
      .single();

    if (error) throw new Error(error.message);
    await notifyUserApproved(row.full_name, row.email);
    return { ok: true as const };
  });
