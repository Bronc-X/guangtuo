#!/usr/bin/env bash
set -euo pipefail

archive_path="${1:-}"

if [[ -z "$archive_path" || ! -f "$archive_path" ]]; then
  echo "Usage: $0 /path/to/showkibiotech-static.tar.gz" >&2
  exit 1
fi

site_root="/var/www/showkibiotech"
release_id="$(date -u +%Y%m%dT%H%M%SZ)"
release_dir="$site_root/releases/$release_id"

sudo install -d -m 0755 "$release_dir"
sudo tar -xzf "$archive_path" -C "$release_dir"

if [[ ! -f "$release_dir/index.html" || ! -f "$release_dir/robots.txt" || ! -f "$release_dir/sitemap.xml" ]]; then
  echo "Archive is missing required static-site files." >&2
  exit 1
fi

sudo chown -R root:root "$release_dir"
sudo find "$release_dir" -type d -exec chmod 0755 {} +
sudo find "$release_dir" -type f -exec chmod 0644 {} +
sudo ln -sfn "$release_dir" "$site_root/current.next"
sudo mv -Tf "$site_root/current.next" "$site_root/current"
sudo nginx -t
sudo systemctl reload nginx

echo "Deployed release: $release_id"
