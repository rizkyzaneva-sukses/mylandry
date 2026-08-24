#!/bin/sh
set -e

echo "🚀 Starting MyLaundry..."

# Push schema to database (creates tables without migration files)
echo "📦 Syncing database schema..."
npx prisma db push --accept-data-loss

# Seed database (only if plans table is empty)
echo "🌱 Seeding database..."
node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts

echo "✅ Starting Next.js server..."
exec node server.js
