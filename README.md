# Access Nexus

Build a state-of-the-art, ultra-professional web application for my desktop application download portal, featuring a gated user login flow, admin email approvals, and a private Admin Analytics Dashboard.

### TECH STACK REQUIREMENTS:

- Framework: Next.js (App Router, Server Actions, React Server Components)

- Styling: Tailwind CSS, CSS Modules (for custom shader grid overlays), Lucide Icons

- UI Component Libraries: Shadcn UI, Radix UI primitives

- Motion & FX: Framer Motion (page transitions, micro-interactions), Canvas-Confetti (login animations)

- Data Visualization: Recharts (dynamic charts for analytics)

- Database & Auth: Supabase JS Client (Free Tier integration or Next.js Mock API with LocalStorage fallback)

- Emails: Resend API or EmailJS (free notification triggers)

---

### VISUAL DESIGN & INTERACTIVE EFFECTS:

1. Cyber-Sleek Dark Theme:

   - Deep void background (`#080C14` / Slate-950) with radial mesh gradients.

   - Interactive Mouse-Tracking Spotlight Effect: A soft glowing light orb follows the user's cursor across the screen.

   - Glassmorphic Floating Cards: `backdrop-blur-2xl` panels, border glow effects on hover (`border-indigo-500/30`), and dynamic shadow response.

   - 3D Hover Tilt Effects: Perspective-based subtle card tilt on platform download cards.

2. Animations & Micro-Interactions:

   - Form Inputs: Neon ring expansion effect on focus with dynamic label floating.

   - Action Buttons: Animated light-sweep hover effect, springy click response (`scale-95`), and instant dynamic loading spinners.

   - Page Load Sequence: Staggered reveal animations using Framer Motion (`initial={{ opacity: 0, y: 20 }}`).

---

### CORE APPLICATION PAGES & FLOWS:

1. LANDING & ACCESS REQUEST PORTAL (`/` Route):

- Hero Section: High-impact headline, dynamic tag displaying application release status (`v2.4.0-LATEST`), and animated feature showcase pill badges.

- Access Gateway Card (Tabbed Interface):

  - TAB 1: "Request Access"

    - Form: Full Name and Email Address.

    - Action: On submit, record user as "PENDING" in database, trigger notification email to Admin via EmailJS/Resend, and display an animated glowing glass alert: "Request Submitted! Awaiting Admin Authorization."

  - TAB 2: "User Access Login"

    - Form: Registered Email.

    - Verification Logic:

      - If user status is "APPROVED": Trigger confetti blast (`canvas-confetti`), save session, and transition smoothly to the Download Portal.

      - If user status is "PENDING": Display glowing alert: "Access status is currently PENDING admin review."

      - If user status is NOT FOUND: Show inline error: "No access request found for this email."

2. PROTECTED USER DOWNLOAD PORTAL (`/dashboard` Route):

- Protected Route: Accessible only when authenticated with an approved email.

- Top Navigation Header:

  - Active user profile tag ("Welcome, [Name]"), pulse indicator for "System Operational" badge, and Logout button.

- Hero Release Section: System specs requirements, checksum hashes (SHA-256), and direct download section.

- Interactive Download Cards:

  - Separate download cards for Windows (.exe), macOS (.dmg / Apple Silicon & Intel), and Linux (.AppImage).

  - Hovering reveals version compatibility.

  - Clicking triggers an animated download progress bar, increments the user's download count in Supabase, and triggers simulated file download.

- Release Changelog: Collapsible Framer Motion accordions displaying patch updates.

3. ADMIN ANALYTICS & REQUEST QUEUE (`/admin` Route):

- Protected Route: Accessible via secret key or parameter (e.g. `?admin_key=secret123`).

- KPI Stat Cards (With animated counter numbers):

  - Total Registered / Approved Users

  - Active Daily Desktop Users

  - Total Pending Access Requests

  - Downloads by Operating System Split

- Dynamic Analytics Charts:

  - Recharts Area Chart: Daily Active App Users & Downloads over time.

  - Recharts Donut Chart: OS Breakdown (Windows vs Mac vs Linux).

- Live Access Approval Table:

  - Table showing Name, Email, Requested Date, and Status badge.

  - "Approve Access" Button: Updates database row to "APPROVED", triggers an automated email notification to the user ("Your access has been granted!"), and updates table metrics in real-time.

Please output fully functional, modular Next.js code including layout.tsx, page.tsx components, Framer Motion animations, and environment configuration (`.env.local`).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3fbfa68e-59bf-48b0-8231-68615d2bdce2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
