# GitHub Secrets Setup Guide

This guide explains how to set up all the required GitHub secrets for the Rekkferga deployment workflows.

## 🔐 Required Secrets

### API Deployment (Railway)

#### `RAILWAY_TOKEN`

**Description**: Railway authentication token
**How to get it**:

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click on your profile → Settings → Tokens
3. Create a new token with "Full Access"
4. Copy the token value

#### `RAILWAY_PROJECT_ID`

**Description**: Your Railway project ID
**How to get it**:

1. Go to your Railway project
2. Click on Settings → General
3. Copy the Project ID

#### `COSMOS_CONNECTION_STRING`

**Description**: Azure Cosmos DB connection string
**How to get it**:

1. Go to Azure Portal → Cosmos DB
2. Select your database → Keys
3. Copy the Primary Connection String

### Web Deployment (Vercel)

#### `VERCEL_TOKEN`

**Description**: Vercel authentication token
**How to get it**:

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "Rekkferga Deploy")
4. Select "Full Account" scope
5. Copy the token

#### `VERCEL_ORG_ID`

**Description**: Your Vercel organization ID
**How to get it**:

1. Go to Vercel Dashboard → Settings → General
2. Copy the Team ID (this is your org ID)

#### `VERCEL_PROJECT_ID`

**Description**: Your Vercel project ID
**How to get it**:

1. Go to your Vercel project
2. Click Settings → General
3. Copy the Project ID

#### `NEXT_PUBLIC_API_URL`

**Description**: Public API URL for the web app
**Value**: `https://api.rekkferga.com`

### Cron Deployment (Azure Functions)

#### `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

**Description**: Azure Functions publish profile
**How to get it**:

1. Go to Azure Portal → Function App
2. Select your function app
3. Click "Get publish profile"
4. Download the file and copy its contents

### Mobile App Build (EAS)

#### `EXPO_TOKEN`

**Description**: Expo authentication token
**How to get it**:

1. Install EAS CLI: `npm install -g @expo/eas-cli`
2. Login: `eas login`
3. Go to [Expo Dashboard](https://expo.dev/accounts/[username]/settings/access-tokens)
4. Create a new access token
5. Copy the token

#### `EXPO_PUBLIC_API_URL`

**Description**: Public API URL for the mobile app
**Value**: `https://api.rekkferga.com`

## 🛠️ Setting Up Secrets

### Method 1: GitHub Web Interface

1. Go to your GitHub repository
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the name and value

### Method 2: GitHub CLI

```bash
# Install GitHub CLI
gh auth login

# Add secrets
gh secret set RAILWAY_TOKEN --body "your-railway-token"
gh secret set RAILWAY_PROJECT_ID --body "your-project-id"
gh secret set COSMOS_CONNECTION_STRING --body "your-cosmos-connection-string"
gh secret set VERCEL_TOKEN --body "your-vercel-token"
gh secret set VERCEL_ORG_ID --body "your-org-id"
gh secret set VERCEL_PROJECT_ID --body "your-project-id"
gh secret set NEXT_PUBLIC_API_URL --body "https://api.rekkferga.com"
gh secret set AZURE_FUNCTIONAPP_PUBLISH_PROFILE --body "your-publish-profile"
gh secret set EXPO_TOKEN --body "your-expo-token"
gh secret set EXPO_PUBLIC_API_URL --body "https://api.rekkferga.com"
```

## 🔧 Environment-Specific Secrets

### Development Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_API_URL=http://localhost:5000
```

### Staging Environment

```bash
NEXT_PUBLIC_API_URL=https://staging-api.rekkferga.com
EXPO_PUBLIC_API_URL=https://staging-api.rekkferga.com
```

### Production Environment

```bash
NEXT_PUBLIC_API_URL=https://api.rekkferga.com
EXPO_PUBLIC_API_URL=https://api.rekkferga.com
```

## 🚨 Security Best Practices

### 1. Token Permissions

- Use the minimum required permissions for each token
- Regularly rotate tokens (every 90 days)
- Never commit tokens to your repository

### 2. Environment Variables

- Use different tokens for different environments
- Keep production tokens separate from development
- Use environment-specific API URLs

### 3. Access Control

- Limit who has access to repository secrets
- Use organization-level secrets when possible
- Audit secret access regularly

## 🔍 Troubleshooting

### Common Issues

#### "Invalid Railway Token"

- Check if the token has expired
- Verify the token has the correct permissions
- Ensure the token is for the right Railway account

#### "Vercel Project Not Found"

- Verify the project ID is correct
- Check if the token has access to the project
- Ensure the project exists in the specified organization

#### "Azure Functions Deploy Failed"

- Check if the publish profile is valid
- Verify the function app exists
- Ensure the Azure subscription is active

#### "EAS Build Failed"

- Verify the Expo token is valid
- Check if the project is configured correctly
- Ensure the EAS project exists

### Debugging Workflows

1. **Check workflow logs**:

   - Go to Actions tab in your repository
   - Click on the failed workflow
   - Review the step-by-step logs

2. **Test secrets locally**:

   ```bash
   # Test Railway
   railway login
   railway up

   # Test Vercel
   vercel login
   vercel --prod

   # Test EAS
   eas login
   eas build --platform all
   ```

3. **Verify environment variables**:
   - Check if all required secrets are set
   - Verify the values are correct
   - Ensure no extra spaces or characters

## 📋 Checklist

- [ ] Railway token and project ID
- [ ] Vercel token, org ID, and project ID
- [ ] Azure Functions publish profile
- [ ] Expo token
- [ ] Cosmos DB connection string
- [ ] API URLs for different environments
- [ ] Test all deployment workflows
- [ ] Verify secrets are working correctly

## 🆘 Support

If you encounter issues:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review the [Railway documentation](https://docs.railway.app)
3. Check the [Vercel documentation](https://vercel.com/docs)
4. Review the [Azure Functions documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
5. Check the [Expo documentation](https://docs.expo.dev)

## 🔄 Updating Secrets

To update a secret:

1. Go to repository Settings → Secrets and variables → Actions
2. Find the secret you want to update
3. Click "Update"
4. Enter the new value
5. Click "Update secret"

The new value will be used in the next workflow run.
