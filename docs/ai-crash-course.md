# AI crash course landing page

Route: `/ai-crash-course/`. Static files follow the existing campaign-page architecture. No backend changes, registrations, or payment records are created by this page.

## Payment activation

Set `paymentUrl` in `public/ai-crash-course/config.js` to the institute's public HTTPS Razorpay Payment Link/Page for exactly INR 500. Supported hosts: rzp.io, rzp.me, pages.razorpay.com. Configure the hosted form to collect student name, phone and email, and identify the 2 November 2026 AI course batch. Confirm cancellation/refund terms, balance payment schedule, and daily batch timing before enabling payment.

Bump the config script's `?v=` in index.html when changing it. Until configured, payment stays hidden and visitors can enquire through WhatsApp or phone. No enquiry or redirect is represented as a paid booking. Confirm captured payments in the Razorpay dashboard. This implementation uses hosted registration; it does not automatically sync students/payments to the CRM. An embedded checkout plus automatic CRM reconciliation requires a separate server-side order, signature verification and webhook implementation.

Confirmed pricing: regular INR 5,999, offer INR 3,999, saving INR 2,000. INR 500 is included in the offer; balance INR 3,499. Project formats are illustrative pending final syllabus/tool list.

## Repository/deployment findings

- Frontend: React/Vite website and static campaigns in public/dien, dima, pyen and pyma. Google Sheet registration on those campaigns is for free events and is unsuitable as evidence of a paid registration.
- Backend: Spring Boot CRM; no existing Razorpay checkout/order/webhook integration found.
- Platform: devansh-deploy provides reusable infrastructure, but this frontend currently has CI only. The actual stack deployment is `.github/workflows/deploy.yml` in devanshedutech-backend, manually dispatched with confirm=DEPLOY.
- That workflow builds both repos, checks out the frontend at the backend branch name, runs tests, and rsyncs dist into `/srv/devanshedutech/frontend/current`. Deploy from main after merging the frontend, or ensure matching branches exist in both repositories.
- The server serves files with Caddy in dvt-frontend. All server access, including inspection/health checks/config application, must run from GitHub Actions per platform policy. Do not SSH from the developer machine.
- Existing deploy workflow does **not** upload `deploy/Caddyfile.static`. The new no-cache rule must also be applied to `/srv/devanshedutech/frontend/Caddyfile.static` through a reviewed GitHub Actions operation. Back up the existing file, apply the tracked config, validate it with Caddy, and restart dvt-frontend (admin API is disabled). Do not restart unrelated stacks.
- The service-worker fallback exclusion and versioned asset URLs are included in this change. Both bare route and trailing slash must serve the static page; the new page uses the trailing-slash canonical URL.

## Verification

Local production build, lint/typecheck and the existing test suite passed (52 existing lint warnings; 137 tests). Browser-check desktop/mobile layout, anchor navigation and FAQs. Before launch verify route/headers via GitHub Actions, enable the real payment URL, and perform an authorized Razorpay test-mode payment including cancellation/failure. No payment or production deployment was attempted while the link is pending.

## Conversion-focused page update

The page now leads with beginner outcomes, contains keyboard-accessible project preview tabs, audience-specific use cases, curriculum details, the existing founder photo and identity from public/pyen, a real institute review-page link, a batch-date banner and a final admission CTA. No trainer assignment, review quote, student count or seat scarcity is claimed.

The optional name/audience form opens a WhatsApp draft for the visitor to review and send. It does not submit a lead, store details or mark enrollment complete. Project mockups are explicitly labelled illustrative and are not represented as student work or live AI generation. The scripts and CSS URLs were version-bumped.

Additional verification: all preview tabs and arrow-key navigation, mobile layout with no horizontal overflow, founder image loading, unique HTML IDs/internal anchors, payment-host allowlist and malformed URLs, optional/Unicode enquiry draft encoding. The course payment link is still pending.
