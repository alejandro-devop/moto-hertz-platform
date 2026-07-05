#!/bin/bash
export PATH="/Users/jako/.nvm/versions/node/v20.11.0/bin:$PATH"
cd "$(dirname "$0")/.."
exec pnpm --filter ./web dev
