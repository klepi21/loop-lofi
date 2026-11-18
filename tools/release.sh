#!/bin/bash
# LOOP is web only. Stamps a build number and deploys the site to its own Vercel project.
#   tools/release.sh
set -e
cd "$(dirname "$0")/.."
export PATH=/opt/homebrew/bin:$PATH
python3 tools/stamp.py
vercel deploy --prod --yes >/dev/null && echo "web: live"
