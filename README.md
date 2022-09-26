# Livesign

A simplification of in-person signatures.

## Getting Started

### Set up .env file

Set up .env file based on [src/env/schema.mjs](./src/env/schema.mjs)

Set up [Google authentication for NextAuth](https://next-auth.js.org/providers/google) for your users and fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.

Enable experimental [Scheduled Functions](https://docs.netlify.com/netlify-labs/experimental-features/scheduled-functions/#getting-started) in Netlify to support [this cron job](/netlify/functions/caffeinate-planetscale.ts).

### Install dependencies

```sh
npm install
```

### Set up a local database

```sh
docker compose up -d
```

### Push database schema to your local database

```sh
npx prisma db push
```

## Create T3 App

This is an app bootstrapped according to the [init.tips](https://init.tips) stack, also known as the T3-Stack.

## TODO

- Design sapling page
- Design homepage
- Support Dropbox login
- Improve mobile navbar
