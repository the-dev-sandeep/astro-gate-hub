/**
 * Notification hooks for the access-request lifecycle.
 *
 * Sending real mail requires a verified sender domain. Until one is configured
 * these calls are logged server-side so the flow stays fully functional.
 */

async function send(subject: string, to: string, body: string) {
  console.log(`[portal-email] to=${to} subject="${subject}"\n${body}`);
  return { sent: false as const, reason: "no_sender_domain" as const };
}

export async function notifyAdminOfRequest(fullName: string, email: string) {
  const adminEmail = process.env["ADMIN_NOTIFY_EMAIL"] ?? "admin@example.com";
  return send(
    "New access request pending approval",
    adminEmail,
    `${fullName} (${email}) requested access to the desktop app. Approve them in the admin dashboard.`,
  );
}

export async function notifyUserApproved(fullName: string, email: string) {
  return send(
    "Your access has been granted!",
    email,
    `Hi ${fullName}, your access request is approved. Sign in with ${email} to download the desktop app.`,
  );
}
