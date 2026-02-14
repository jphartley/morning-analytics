This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Configuration

Copy `.env.example` to `.env.local` and fill in the values. Variables prefixed with `NEXT_PUBLIC_*` are exposed to the browser.

### Gemini (text analysis)

- `GEMINI_API_KEY`: required for real Gemini analysis.
- `GEMINI_MODEL`: optional override for the Gemini model ID.

### Discord + Midjourney (image generation)

- `DISCORD_BOT_TOKEN`: bot token used to listen for Midjourney responses.
- `DISCORD_CHANNEL_ID`: channel to watch for completed Midjourney images.
- `DISCORD_USER_TOKEN`: user token used to trigger `/imagine`.
- `DISCORD_GUILD_ID`: guild where `/imagine` is triggered.
- `MIDJOURNEY_APP_ID`: Midjourney application ID (leave default unless it changes).
- `MIDJOURNEY_IMAGINE_COMMAND_ID`: Midjourney `/imagine` command ID.

### Supabase (analytics history storage)

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (browser + server).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon key for client reads.
- `SUPABASE_SERVICE_ROLE_KEY`: server-side key for writes (keep secret).

### Mocking and local testing

- `USE_AI_MOCKS`: when `true`, mocks Gemini + Discord/Midjourney (no external calls).
- `NEXT_PUBLIC_IMAGE_PROVIDER`: set to `mock` to use local images from `app/public/mock-images`, or `midjourney` for real generation.

### Workspace root (Turbopack)

This repo keeps the Next.js app in the `app/` subdirectory. To avoid workspace-root inference issues (e.g., resolving `tailwindcss` from the wrong folder), `app/next.config.ts` pins both `turbopack.root` and `outputFileTracingRoot` to the `app/` directory. If you see root warnings again, keep these settings in place and ensure your local lockfiles are stable.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
