#!/bin/bash

# Migration script for Vibe University (PostgreSQL)

set -e

echo "🚀 Starting Database Migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL is not set."
  echo "Please set DATABASE_URL in your .env file or environment."
  exit 1
fi

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🔄 Running Migrations..."
npx prisma migrate deploy

echo "🌱 Seeding Database..."
# Check if seed script exists in package.json
if grep -q "seed" package.json; then
  npm run seed
else
  echo "⚠️  No seed script found in package.json. Skipping seeding."
fi

echo "✅ Database Migration Complete!"
