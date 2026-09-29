#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
app_dir=/opt/showkibiotech/app
node_version=24.19.0
if [[ ! -f "$app_dir/package.json" || ! -f "$app_dir/services/content-admin/server.ts" ]]; then
  echo "Extract the runtime source bundle into $app_dir first." >&2; exit 1
fi
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nginx certbot python3-certbot-nginx curl xz-utils ca-certificates
if ! /usr/local/bin/node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)" 2>/dev/null; then
  node_arch="$(uname -m)"
  case "$node_arch" in x86_64) node_arch=x64;; aarch64) node_arch=arm64;; *) echo "Unsupported architecture" >&2; exit 1;; esac
  node_tmp="$(mktemp -d)"
  node_archive="node-v${node_version}-linux-${node_arch}.tar.xz"
  curl --fail --location --proto '=https' --tlsv1.2 "https://nodejs.org/dist/v${node_version}/${node_archive}" -o "$node_tmp/$node_archive"
  curl --fail --location --proto '=https' --tlsv1.2 "https://nodejs.org/dist/v${node_version}/SHASUMS256.txt" -o "$node_tmp/SHASUMS256.txt"
  (cd "$node_tmp" && grep " ${node_archive}$" SHASUMS256.txt | sha256sum --check -)
  sudo tar -xJf "$node_tmp/$node_archive" --strip-components=1 -C /usr/local
fi
id showkibiotech >/dev/null 2>&1 || sudo useradd --system --home /var/lib/showkibiotech --shell /usr/sbin/nologin showkibiotech
sudo loginctl enable-linger showkibiotech
sudo install -d -m 0755 -o showkibiotech -g showkibiotech /var/lib/showkibiotech /var/www/showkibiotech /var/www/showkibiotech/releases
sudo install -d -m 0750 -o showkibiotech -g showkibiotech /var/lib/showkibiotech/cms
sudo install -d -m 0750 -o root -g showkibiotech /etc/showkibiotech
if [[ ! -e /etc/showkibiotech/runtime.env ]]; then
  sudo install -m 0640 -o root -g showkibiotech "$script_dir/runtime.env.example" /etc/showkibiotech/runtime.env
fi
# Build dependencies are required for CMS-triggered static builds; do not use --prod.
sudo /usr/local/bin/npm install --global pnpm@11.19.0
(cd "$app_dir" && sudo /usr/local/bin/pnpm install --frozen-lockfile)
sudo chmod -R a+rX "$app_dir/node_modules"
if [[ ! -e /var/lib/showkibiotech/cms/published-content.json ]]; then
  sudo install -m 0640 -o showkibiotech -g showkibiotech "$app_dir/content/published-content.json" /var/lib/showkibiotech/cms/published-content.json
fi
# 2 GB instances need swap for the transient static build peak. Existing swap is preserved.
if [[ "$(swapon --show --noheadings | wc -l)" -eq 0 && ! -e /swapfile ]]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 0600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi
# Allow cold build pages to use swap before the CMS cgroup reaches its memory ceiling.
# With swappiness=0, reclaim can stall the API even when swap is available.
echo 'vm.swappiness = 60' | sudo tee /etc/sysctl.d/90-showkibiotech-build-memory.conf >/dev/null
sudo sysctl -p /etc/sysctl.d/90-showkibiotech-build-memory.conf
sudo install -m 0644 "$script_dir/showkibiotech-cms.service" /etc/systemd/system/showkibiotech-cms.service
sudo install -m 0644 "$script_dir/nginx-showkibiotech.conf" /etc/nginx/sites-available/showkibiotech.conf
sudo ln -sfn /etc/nginx/sites-available/showkibiotech.conf /etc/nginx/sites-enabled/showkibiotech.conf
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable --now nginx
echo 'Runtime installed. Configure HTTPS and the private runtime.env; run cms:setup as showkibiotech, then enable --now showkibiotech-cms.'
