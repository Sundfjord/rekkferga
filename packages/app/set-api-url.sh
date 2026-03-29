#!/bin/bash

TAILSCALE_IP="100.64.70.72"

echo "EXPO_PUBLIC_API_URL=http://$TAILSCALE_IP:5000" > .env.local
echo "Set API URL to http://$TAILSCALE_IP:5000"
