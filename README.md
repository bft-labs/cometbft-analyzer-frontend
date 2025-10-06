This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your configuration:
```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/v1

# Default User ID for your application
NEXT_PUBLIC_DEFAULT_USER_ID=your-user-id-here
```

### Environment Files

- **`.env.local`**: Local development (not tracked in git)
- **`.env.development`**: Development environment defaults
- **`.env.production`**: Production environment configuration
- **`.env.example`**: Template file for new developers

### Environment Variables

- **`NEXT_PUBLIC_API_BASE_URL`**: Base URL for the API backend
- **`NEXT_PUBLIC_DEFAULT_USER_ID`**: Default user ID for API requests
- **`NODE_ENV`**: Environment mode (development/production)

> **Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Keep sensitive data in server-side only variables.
```

## Getting Started

After setting up your environment, run the development server:

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
