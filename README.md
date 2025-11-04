# AygentX Vibe Coder

Production-ready Next.js app that lets users “chat to build.” It combines Clerk for auth, Neon Postgres via Prisma, background automation with Inngest, and deployment on Vercel. It also integrates Google Gemini (via @inngest/agent-kit) and E2B sandboxes for code execution.

Live: https://vibecode.aydie.in/

Status: Complete and production-ready.

License: Apache 2.0

---

## Quick commands (run each in its own terminal)

Below are commands to run in different terminals. Keep each command independent.

1) Client (web app in dev):
- npm run dev

2) Inngest (background jobs in dev):
- npx inngest-cli@1.8.0 dev

3) Prisma Studio (inspect the database):
- npx prisma studio

4) Build (production build):
- npm run build

5) Start (serve production build):
- npm run start

Notes:
- Use commands 1–3 for local development.
- Use 4 then 5 to run the app in production mode locally (http://localhost:3000 by default).

---

## Table of contents

- Key features
- Tech stack
- System architecture
- Environment variables
- Getting started
  - Local setup
  - Database (Neon + Prisma)
  - Running Inngest locally
  - Running the web app
- Deployment (Vercel)
- Data model
- API and server
  - Auth and middleware
  - tRPC routers and procedures
  - Inngest functions
- UI flows
- File-by-file reference
- Scripts
- Troubleshooting
- Security and compliance

---

## Key features

- Chat-to-build flow: Users create projects and send prompts. The system processes the prompt through an agent workflow, builds runnable code in an E2B sandbox, and returns a demo preview and code files.
- Authentication and plans with Clerk: Protects routes and procedures, and gates usage via a simple rate limit that also respects “pro” access.
- Persistent storage with Postgres (Neon) + Prisma: Projects, messages, fragments (previews), and usage limits.
- Background orchestration with Inngest: Event-driven function handles building and updating the sandbox, powered by Gemini.
- Production deployment on Vercel.

---

## Tech stack

- Frontend and app framework
  - Next.js 15 (App Router)
  - TypeScript
  - Tailwind CSS (preconfigured)
  - Radix UI primitives + shadcn-style components
  - TanStack Query for data fetching/caching
  - tRPC v11 for typesafe API

- Auth
  - Clerk (Next.js SDK)

- Data
  - Neon Postgres
  - Prisma ORM (generated client in src/generated/prisma)

- Agents and background
  - Inngest + @inngest/agent-kit (Gemini model integration)
  - E2B Sandbox (@e2b/code-interpreter) for command execution and file operations

- DevOps
  - Vercel for hosting
  - Prisma migrations

---

## System architecture

- Client renders pages using server-side hydration from TanStack Query and tRPC.
- Clerk middleware protects non-public routes; protected tRPC procedures double-check auth.
- When a user starts a project or sends a message, we:
  1) Deduct usage credits (rate limiter in DB).
  2) Persist the message in Postgres.
  3) Emit an Inngest event `code-agent/run` with the `projectId` and `prompt`.
- Inngest function:
  - Creates an E2B sandbox instance using a configured template (`E2B_TEMPLATE_NAME`).
  - Fetches the last messages for context.
  - Sets up an agent (Gemini 2.5 pro) with tools like `terminal` and `createOrUpdateFiles` to build or update code in the sandbox.
  - Stores assistant messages and the produced fragment (title, files, sandboxUrl) back in the DB.
- UI polls recent messages and automatically selects the newest assistant fragment to render a live preview (iframe) and file explorer (code view).

---

## Environment variables

Create `.env.local` (for local) and configure the same in Vercel:

Required:

- App
  - `NEXT_PUBLIC_APP_URL='http://localhost:3000'`

- Database (Neon)
  - `DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require`

- Google Gemini (via @inngest/agent-kit)
  - `GEMINI_API_KEY=`

- E2B (code sandbox)
  - `E2B_TEMPLATE_NAME=`
  - `E2B_TEAM_ID=`
  - `E2B_TEMPLATE_ID=`
  - `E2B_API_KEY=`

- Clerk
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=`
  - `CLERK_SECRET_KEY=`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"`

Notes:
- Prisma reads `DATABASE_URL`.
- E2B SDK reads its API key from env; the code creates/connects a sandbox using `E2B_TEMPLATE_NAME`.
- Clerk settings must include correct redirect URLs for local and production.
- If you run Inngest CLI locally, you may optionally configure Inngest-specific keys (not required by this repo’s code itself when served via `/api/inngest`).

---

## Getting started

### 1) Local setup

- Node.js 18+
- pnpm, npm, or yarn

Install dependencies:
- `pnpm install`
- or `npm install`

Copy your env:
- `cp .env.local.example .env.local` (if provided)
- Populate all variables from the Env list above.

Generate Prisma client (postinstall already does this, but it’s safe to run):
- `npx prisma generate`

### 2) Database (Neon + Prisma)

Apply migrations:
- For local dev: `npx prisma migrate dev`
- For production: `npx prisma migrate deploy`

Optional:
- `npx prisma studio` to inspect data locally.

The Prisma client is generated to `src/generated/prisma` per `prisma/schema.prisma`.

### 3) Running Inngest locally

In a separate terminal, run:
- `npx inngest-cli@latest dev --env-file .env.local`

This will discover and serve the functions exposed in `src/app/api/inngest/route.ts`.

### 4) Running the web app

Development:
- `pnpm dev` (or `npm run dev`)
- Open http://localhost:3000
- Sign in with Clerk, create a project and send a prompt.

Production (local):
- `npm run build`
- `npm run start`
- Open http://localhost:3000

---

## Deployment (Vercel)

1) Connect the GitHub repo to Vercel.  
2) Set all environment variables in Vercel Project Settings → Environment Variables.  
3) Ensure Prisma runs in build:
   - `postinstall` is set to `prisma generate`.
   - You must run `npx prisma migrate deploy` on deploy (via Vercel build step or a CI/CD step) to apply DB migrations on Neon.
4) The Inngest Next.js integration is served via the API route `/api/inngest`. Inngest will call your Vercel URL when executing functions.

---

## Data model

File: prisma/schema.prisma  
- datasource db: PostgreSQL (`DATABASE_URL`)  
- generator client: outputs Prisma client to `../src/generated/prisma`

Models:
- Project
  - id (uuid), name, userId
  - timestamps
  - messages: Message[]
- Message
  - id (uuid), content, role (enum: USER | ASSISTANT), type (enum: RESULT | ERROR)
  - timestamps
  - projectId → Project (onDelete: Cascade)
  - fragment?: Fragment
- Fragment
  - id (uuid), messageId unique → Message (onDelete: Cascade)
  - sandboxUrl, title, files (JSON)
  - timestamps
- Usage
  - key (string, primary key)
  - points (int)
  - expire (DateTime?)

Migrations (high level intent):
- 20251016113117_message_fragment: Introduces Message and Fragment tables and enums.
- 20251018154942_projects: Adds Project and links Message.projectId -> Project.
- 20251022111958_user_id: Adds userId to Project.
- 20251102142607_usage: Creates Usage with “point” (later fixed).
- 20251102162628_fix_usage_model: Renames Usage.point to Usage.points.

Note: The current schema uses `Usage.points`, and `rate-limiter-flexible` expects `(key, points, expire)` columns.

---

## API and server

### Auth and middleware

File: `src/middleware.ts`
- Public routes: “/”, “/sign-in(.*)”, “/sign-up(.*)”, and “/api(.*)”.
- All other routes are protected via Clerk; unauthenticated users are redirected.
- tRPC procedures also enforce auth via `protectedProcedure` as appropriate.

File: `src/app/layout.tsx`
- Wraps app with `ClerkProvider`, `TRPCReactProvider`, `ThemeProvider`, and `Toaster`.
- Global CSS and fonts are loaded here.

### tRPC routers and procedures

tRPC server setup:
- `src/trpc/init.ts`: context = `{ auth: await auth() }` (Clerk), superjson transformer; `protectedProcedure` enforces `userId` presence.
- `src/app/api/trpc/[trpc]/route.ts`: `fetchRequestHandler` endpoint `/api/trpc`.
- `src/trpc/routers/_app.ts`: aggregates routers: messages, projects, usage.
- `src/trpc/server.tsx` & `src/trpc/client.tsx`: helpers to set up React Query + tRPC on server and client, with superjson hydration.

Routers:
- Messages (`src/modules/messages/server/procedures.ts`)
  - `getMany(input: { projectId })`: Auth required. Returns messages for the user’s project including attached fragment; ascending by `updatedAt`.
  - `create(input: { value, projectId })`: Auth required.
    - Verifies project belongs to user.
    - Consumes usage credits (throws on limit).
    - Creates user message (role USER, type RESULT).
    - Emits Inngest event `code-agent/run` with `{ value, projectId }`.
    - Returns created message.

- Projects (`src/modules/projects/server/procedures.ts`)
  - `getOne({ id })`: Auth required. Verifies ownership.
  - `getMany()`: Auth required. Lists user projects ordered by `createdAt` desc.
  - `create({ value })`: Auth required.
    - Consumes usage credits.
    - Creates project with generated slug name and a first user message containing the initial prompt.
    - Emits Inngest event `code-agent/run`.
    - Returns the project.

- Usage (`src/modules/usage/server/procedures.ts`)
  - `status()`: Auth required. Returns `remainingPoints` and `msBeforeNext` from rate-limiter-flexible via Prisma.

Credits and plans:
- `src/lib/usage.ts`
  - `FREE_POINTS = 6`, `PRO_POINTS = 100`, `DURATION = 30 days`, `cost = 1`.
  - `hasProAccess = has({ plan: "pro_user" })` via Clerk’s `auth.has`; UI checks plan "pro". Make sure your Clerk entitlement/plan naming matches your usage checks (either “pro_user” or update to “pro” consistently).

### Inngest functions

HTTP integration:
- `src/app/api/inngest/route.ts`: Exposes GET/POST/PUT via `serve({ client: inngest, functions: [codeAgentFunction] })`

Client:
- `src/inngest/client.ts`: `new Inngest({ id: "aygentx-vibe-coder" })`

Types/utilities:
- `src/inngest/types.ts`: `SANDBOX_TIME_OUT = 7 minutes`
- `src/inngest/utils.ts`:
  - `getSandbox(sandboxId)`: connect and set timeout
  - `lastAssistantTextMessageContent(result: AgentResult)`: helper to extract assistant text output

Main function:
- `src/inngest/functions.ts`:
  - Trigger: event `"code-agent/run"`
  - Step 1: Create sandbox from E2B template (requires `E2B_TEMPLATE_NAME`), set timeout.
  - Step 2: Load previous messages (last five) for the project from Prisma, map to agent-kit messages.
  - Step 3: Build state and agent:
    - Model: `gemini({ model: "gemini-2.5-pro" })`
    - Tools:
      - `terminal`: runs shell commands in the E2B sandbox with streamed stdout/stderr; returned stdout is captured.
      - `createOrUpdateFiles`: writes files into the sandbox (path, content).
    - System prompt and helpers from `src/prompts.tsx` (`PROMPT`, `FRAGMENT_TITLE_PROMPT`, `RESPONSE_PROMPT`).
  - The function is designed to run commands like `npm install`, write files, and persist results/summary back to the app via Prisma (assistant messages and fragments).

Prompts:
- `src/prompts.tsx`: Defines `PROMPT` (strict operating rules for the agent inside the sandbox), `FRAGMENT_TITLE_PROMPT`, `RESPONSE_PROMPT`.

---

## UI flows

- Home (`/`):
  - Navbar with Clerk sign-in/up buttons.
  - ProjectForm: Single text area with templates; uses tRPC mutation to create a project and navigate to it on success. Handles auth and rate-limit errors (redirects to `/pricing`).
  - ProjectsList: Shows user’s projects, linking to `/projects/[projectId]`.

- Project detail (`/projects/[projectId]`):
  - Server component prefetches messages and project via `trpc.server` and hydrates client.
  - ProjectView:
    - Left panel: ProjectHeader + MessageContainer
      - MessageContainer fetches messages (refetchInterval 10s) and autoscrolls; adds a “loading” shimmer when the last message is a USER message.
      - MessageCard renders user vs. assistant messages; assistant messages may include a FragmentCard to select a preview.
      - MessageForm: Sends new prompt; shows usage widget (credits and time to reset), handles rate-limit redirect to `/pricing`.
    - Right panel: Tabs for “Demo” (FragmentWeb) and “Code” (FileExplorer) for the currently active fragment. FragmentWeb renders `sandboxUrl` in an iframe with refresh/copy/open controls.

- Pricing (`/pricing`):
  - Uses Clerk `<PricingTable>` component; warns not to make real payments (portfolio project note).

- Theming and UI:
  - Tailwind + CSS variables theme in `src/app/globals.css`.
  - Many shadcn-style primitives under `src/components/ui/*` (Tabs, Form, Popover, ScrollArea, etc.).
  - Code highlighting theme at `src/components/code-view/code-theme.css` for Prism.js.
  - Hooks: `use-scroll` (header effects), `use-current-theme` (Clerk theming), `use-mobile` (screen size).

---

## File-by-file reference

Core data and config:
- prisma/schema.prisma  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/prisma/schema.prisma  
  Defines Project, Message, Fragment, Usage models and enums.

- prisma/migrations/*  
  Several migrations evolving Message/Fragment/Project and Usage models.

- src/lib/db.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/lib/db.ts  
  Singleton Prisma client (cached in dev to avoid hot-reload instantiation).

- src/lib/usage.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/lib/usage.ts  
  rate-limiter-flexible over Prisma for credits, using Clerk auth.has to grant higher limits to “pro” users.

Authentication and middleware:
- src/middleware.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/middleware.ts  
  Declares public routes and Clerk route protection.

tRPC:
- src/trpc/init.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/trpc/init.ts  
- src/trpc/routers/_app.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/trpc/routers/_app.ts  
- src/app/api/trpc/[trpc]/route.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/app/api/trpc/%5Btrpc%5D/route.ts  
- src/trpc/server.tsx, src/trpc/client.tsx, src/trpc/query-client.ts  
  Client/server bindings and hydration for React Query + tRPC with superjson.

Domain routers (server):
- src/modules/projects/server/procedures.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/modules/projects/server/procedures.ts  
- src/modules/messages/server/procedures.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/modules/messages/server/procedures.ts  
- src/modules/usage/server/procedures.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/modules/usage/server/procedures.ts

Inngest:
- src/app/api/inngest/route.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/app/api/inngest/route.ts
- src/inngest/client.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/inngest/client.ts
- src/inngest/utils.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/inngest/utils.ts
- src/inngest/types.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/inngest/types.ts
- src/inngest/functions.ts  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/inngest/functions.ts

App and pages:
- src/app/layout.tsx  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/app/layout.tsx
- src/app/globals.css  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/app/globals.css
- src/app/(home)/layout.tsx  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/app/%28home%29/layout.tsx
- src/app/(home)/page.tsx  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/app/%28home%29/page.tsx
- src/app/(home)/pricing/page.tsx  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/app/%28home%29/pricing/page.tsx
- src/app/projects/[projectId]/page.tsx  
  https://github.com/aydiegithub/aygentx-vibe-coder/blob/main/src/app/projects/%5BprojectId%5D/page.tsx

Home module (UI):
- src/modules/home/constants.ts  
  Project prompt templates (e.g., Netflix clone, Spotify clone).
- src/modules/home/ui/components/navbar.tsx  
  Clerk sign-in/out buttons and user control.
- src/modules/home/ui/components/project-form.tsx  
  Create project form with Enter shortcut and templates.
- src/modules/home/ui/components/projects-list.tsx  
  Lists existing projects.

Projects module (UI):
- src/modules/projects/ui/views/project-view.tsx  
  Left/right panels with messages and preview/code tabs.
- src/modules/projects/ui/components/project-header.tsx  
  Theme switcher, project navigation.
- src/modules/projects/ui/components/messages-container.tsx  
  Polls and renders messages; auto-selects latest fragment.
- src/modules/projects/ui/components/message-card.tsx  
  Renders user and assistant messages; fragment preview chip.
- src/modules/projects/ui/components/message-form.tsx  
  Prompt input, usage display, and submit handling.
- src/modules/projects/ui/components/fragment-web.tsx  
  Iframe preview with refresh, copy, and open controls.
- src/modules/projects/ui/components/usage.tsx  
  Displays credits remaining and reset time, upgrade CTA.

Shared components and hooks:
- src/components/user-control.tsx  
  Clerk `<UserButton>` with theme-aware appearance.
- src/components/hint.tsx  
  Tooltip helper.
- src/components/ui/*  
  Numerous shadcn-style components (tabs, form, popover, scroll-area, carousel, kbd, skeleton, etc.).
- src/components/code-view/code-theme.css  
  Prism.js code theme (including dark mode tokens).
- src/hooks/use-scroll.ts, `use-current-theme.ts`, `use-mobile.ts`  
  Scrolling state, current theme, and mobile detection.

Prompts:
- `src/prompts.tsx`  
  Contains system and post-processing prompts used by the agent.

Types and utils:
- `src/types.ts`  
  TreeItem type for file explorers.
- `src/lib/utils.ts`  
  `cn()` and `convertFilesToTreeItems()` for transforming a flat file map into nested tree items.

Config:
- `package.json`  
  Scripts: `dev` (turbopack), `build`, `start`, `lint`, `postinstall` (`prisma generate`).  
  Dependencies include: next 15.3.4, @clerk/nextjs, @inngest/agent-kit, inngest, @e2b/code-interpreter, @prisma/client, @tanstack/react-query, @trpc/*, shadcn+radix components, superjson, prismjs.

- `tsconfig.json`  
  Path alias `@/*` → `./src/*`; `moduleResolution: "bundler"`; `strict: true`.

- `LICENSE`  
  Apache 2.0.

---

## Scripts

From package.json:
- `dev`: `next dev --turbopack`
- `build`: `next build`
- `start`: `next start`
- `lint`: `next lint`
- `postinstall`: `prisma generate`

Useful commands:
- `npx prisma migrate dev`          # Dev migrations
- `npx prisma migrate deploy`       # Prod migrations
- `npx prisma studio`               # DB inspector (dev)
- `npx inngest-cli@latest dev --env-file .env.local`   # Inngest local
- `npm run build && npm run start`  # Local production run

---

## Troubleshooting

- Clerk auth errors
  - Ensure all `NEXT_PUBLIC_CLERK_*` and `CLERK_SECRET_KEY` are set correctly.
  - Update Clerk dashboard redirect URLs for local (http://localhost:3000) and Vercel domains.

- Rate limit says “out of credits” unexpectedly
  - Verify your Clerk “plan” string matches the code. Server checks `has({ plan: "pro_user" })` but some UI references "pro".
  - Confirm Usage model has `points` (not `point`). Later migration fixes this.

- Prisma connection issues (Neon)
  - Make sure your `DATABASE_URL` uses `sslmode=require`.
  - Ensure migrations were applied (`npx prisma migrate deploy` in production).

- Inngest function not triggering locally
  - Ensure the dev process is running (Inngest CLI) alongside Next dev, and that the `/api/inngest` route is reachable.

- E2B sandbox errors
  - Confirm `E2B_API_KEY` and `E2B_TEMPLATE_NAME` are set.
  - The sandbox timeout is 7 minutes; long jobs may be terminated.

---

## Security and compliance

- Do not commit secrets; use env variables.
- Limit scopes for Clerk, Neon, E2B, and Gemini keys.
- Rotate keys if compromised.
- Respect user data privacy: messages, projects, and fragments are stored per-user. Ensure row-level access checks (already enforced in tRPC procedures via `userId` constraints) remain intact on future changes.

---
