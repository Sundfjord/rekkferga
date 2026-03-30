#!/bin/bash

LOCAL_IP=$(ipconfig getifaddr en0)

echo "EXPO_PUBLIC_API_URL=http://$LOCAL_IP:5000" > .env.local
echo "Set API URL to http://$LOCAL_IP:5000"
