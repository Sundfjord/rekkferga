# Rekkferga 🚢

A comprehensive ferry information and journey planning platform for Norway.

## 🎯 Product Overview

Rekkferga provides real-time ferry information, journey planning, and departure schedules across Norway's ferry network.

### Components

- **rekkferga-api** - Backend API service (Flask)
- **rekkferga-cron** - Scheduled data processing (Azure Functions)
- **rekkferga-app** - Mobile application (React Native/Expo)
- **rekkferga-web** - Web application (Next.js)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (optional)
- Expo CLI (for mobile development)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/rekkferga.git
cd rekkferga

# Install dependencies
npm install

# Set up environment variables
cp packages/api/.env.example packages/api/.env
cp packages/app/env.example packages/app/.env
cp packages/web/.env.example packages/web/.env

# Start development servers
npm run dev:all
```

### Development

```bash
# Start all services
npm run dev:all

# Start individual services
npm run dev:api    # API server on http://localhost:5000
npm run dev:web    # Web app on http://localhost:3000
npm run dev:app    # Mobile app (Expo)
```

### Building

```bash
# Build all components
npm run build:all

# Build individual components
npm run build:api
npm run build:web
npm run build:app
```

### Deployment

```bash
# Deploy all components
npm run deploy:all

# Deploy individual components
npm run deploy:api
npm run deploy:web
npm run deploy:cron
```

## 📁 Project Structure

```
rekkferga/
├── packages/
│   ├── api/          # Flask API backend
│   ├── cron/         # Azure Functions cron jobs
│   ├── app/          # React Native mobile app
│   └── web/          # Next.js web app
├── shared/
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utilities
│   └── constants/    # Shared constants
├── infrastructure/  # Docker, Terraform configs
├── docs/            # Documentation
└── scripts/         # Build and deployment scripts
```

## 🌐 Hosting

- **API**: Railway (`api.rekkferga.com`)
- **Web**: Vercel (`rekkferga.com`)
- **Cron**: Azure Functions
- **Mobile**: Expo EAS Build

## 📚 Documentation

- [API Documentation](docs/api/)
- [Deployment Guide](docs/deployment/)
- [Development Guide](docs/development/)
- [Architecture Overview](docs/architecture/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- [Issues](https://github.com/yourusername/rekkferga/issues)
- [Discussions](https://github.com/yourusername/rekkferga/discussions)
- [Documentation](docs/)
