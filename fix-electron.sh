#!/bin/bash

echo "Fixing Electron installation..."

# Remove the electron directory
if [ -d "node_modules/.pnpm/electron@30.5.1" ]; then
  echo "Removing node_modules/.pnpm/electron@30.5.1..."
  rm -rf node_modules/.pnpm/electron@30.5.1
fi

if [ -d "node_modules/electron" ]; then
  echo "Removing node_modules/electron..."
  rm -rf node_modules/electron
fi

# Reinstall dependencies with pnpm
echo "Reinstalling dependencies with pnpm..."
pnpm install

echo "Electron reinstallation complete. Try running 'pnpm run dev' again."