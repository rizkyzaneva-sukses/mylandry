#!/bin/sh
set -e

echo "🚀 Starting MyLandry..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Seed database (only if plans table is empty)
echo "🌱 Checking if seed is needed..."
SEED_CHECK=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.plan.count().then(c => { console.log(c); prisma.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$SEED_CHECK" = "0" ]; then
  echo "🌱 Seeding database..."
  npx tsx prisma/seed.ts
fi

echo "✅ Starting Next.js server..."
exec node server.js
