#!/usr/bin/env bash
# Udyami Manch installer for a fresh Ubuntu or Debian VPS. Run as root.
#   curl -fsSL https://raw.githubusercontent.com/edezabhishek/udyami-manch/main/deploy/install.sh | DOMAIN=udyamimanch.com bash
set -euo pipefail
DOMAIN="${DOMAIN:-udyamimanch.com}"
DIR=/opt/udyami-manch

echo "==> Installing Docker and git"
if ! command -v docker >/dev/null; then curl -fsSL https://get.docker.com | sh; fi
apt-get install -y git >/dev/null

echo "==> Adding 2 GB swap so the build does not run out of memory"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q /swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Fetching the code"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone --depth 1 https://github.com/edezabhishek/udyami-manch "$DIR"; fi
cd "$DIR/deploy"

if [ ! -f .env ]; then
  echo "DOMAIN=$DOMAIN" > .env
  echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
  echo "ADMIN_EMAIL=${ADMIN_EMAIL:-nepal@udyamimanch.com}" >> .env
  echo "ADMIN_PASSWORD=Um-$(openssl rand -hex 8)-Aa1" >> .env
  chmod 600 .env
fi

echo "==> Building and starting (the first build takes 10 to 20 minutes)"
docker compose up -d --build

echo
echo "Done. Open https://$DOMAIN"
echo "Admin sign in (you will be asked to choose a new password straight away):"
echo "  Email:    $(grep '^ADMIN_EMAIL=' .env | cut -d= -f2-)"
echo "  Password: $(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2-)"
echo "Back up $DIR/deploy/.env, data and uploads."
