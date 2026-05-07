#!/bin/sh
set -eu

api_base_url="${API_BASE_URL:-}"
escaped_api_base_url=$(printf '%s' "$api_base_url" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > config.js <<EOF
window.APP_CONFIG = {
  API_BASE_URL: "$escaped_api_base_url"
};
EOF
