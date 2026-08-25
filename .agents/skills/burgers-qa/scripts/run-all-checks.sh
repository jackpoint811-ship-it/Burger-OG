#!/usr/bin/env bash
set -e

echo "🔍 [1/4] Checking Git Diff..."
git diff --check

echo "🔬 [2/4] Running TypeScript Typecheck..."
npm run typecheck

echo "📦 [3/4] Building Public Order App..."
npm run build:public

echo "📦 [4/4] Building Internal Chekeo App..."
npm run build:chekeo

echo "✅ All Burgers.exe verification checks passed successfully!"
