# Rekkferga Web

A Next.js web application for ferry information and route planning, designed with a similar feel to the Fergo mobile app.

## Features

- **Header Component**: Responsive header with logo that adapts to light/dark themes
- **Theme System**: Automatic theme switching based on system preferences
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Norwegian Language**: Interface in Norwegian (Nynorsk/Bokmål)

## Project Structure

```
rekkferga-web/
├── app/
│   ├── layout.tsx          # Root layout with Header and ThemeProvider
│   ├── page.tsx            # Home page with ferry information cards
│   └── globals.css         # Global styles with CSS custom properties
├── components/
│   ├── Header.tsx          # Header component with logo and settings
│   └── ThemeProvider.tsx   # Theme context provider
├── public/
│   ├── logo-light.png      # Light theme logo
│   └── logo-dark.png       # Dark theme logo
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18.18.0 or higher (required for Next.js 15)
- npm or yarn

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   ```bash
   # Create .env.local file
   NEXT_PUBLIC_API_URL=your_api_url_here
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Design System

The app uses a design system inspired by the Fergo mobile app with:

- **Primary Colors**: Material Design Blue (#1976d2)
- **Secondary Colors**: Material Design Orange (#ff9800)
- **Theme Support**: Light and dark mode with system preference detection
- **Typography**: Geist Sans and Geist Mono fonts
- **Spacing**: Consistent spacing using Tailwind CSS utilities

## Components

### Header

- Centered logo that adapts to theme
- Optional settings button (gear icon)
- Responsive design with proper spacing

### ThemeProvider

- Wraps the app with theme context
- Supports light, dark, and system themes
- Automatic theme switching

## Styling

The app uses Tailwind CSS v4 with CSS custom properties for theming:

- CSS variables for colors and spacing
- Responsive design utilities
- Hover effects and transitions
- Consistent component styling

## Development

- **TypeScript**: Full TypeScript support
- **ESLint**: Code quality and consistency
- **Tailwind CSS**: Utility-first CSS framework
- **Next.js 15**: Latest React framework with App Router

## Building for Production

```bash
npm run build
npm start
```

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new components
3. Maintain the design system consistency
4. Test both light and dark themes
