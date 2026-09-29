#!/usr/bin/env bash
set -euo pipefail

config_path="${1:-./nginx-showkibiotech.conf}"

if [[ ! -f "$config_path" ]]; then
  echo "Nginx config not found: $config_path" >&2
  exit 1
fi

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot python3-certbot-nginx
sudo install -d -m 0755 /var/www/showkibiotech/releases
sudo install -m 0644 "$config_path" /etc/nginx/sites-available/showkibiotech.conf
sudo ln -sfn /etc/nginx/sites-available/showkibiotech.conf /etc/nginx/sites-enabled/showkibiotech.conf
sudo nginx -t
sudo systemctl enable --now nginx

echo "Server bootstrap complete. Upload and deploy the static archive next."
