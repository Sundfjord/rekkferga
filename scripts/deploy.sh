#!/bin/bash

echo "🚢 Rekkferga Deployment Script"
echo "============================="

# Check environment
if [ -z "$1" ]; then
    echo "Usage: $0 [api|web|cron|all]"
    exit 1
fi

case $1 in
    api)
        echo "Deploying API..."
        cd packages/api && railway up
        ;;
    web)
        echo "Deploying Web..."
        cd packages/web && vercel --prod
        ;;
    cron)
        echo "Deploying Cron..."
        cd packages/cron && func azure functionapp publish rekkferga-cron
        ;;
    all)
        echo "Deploying all components..."
        cd packages/api && railway up
        cd ../web && vercel --prod
        cd ../cron && func azure functionapp publish rekkferga-cron
        ;;
    *)
        echo "Invalid option: $1"
        echo "Usage: $0 [api|web|cron|all]"
        exit 1
        ;;
esac

echo "✅ Deployment complete!"
