# VegucationStation

An educational touchscreen kiosk application for farmers markets that helps customers learn about fresh produce and discover recipes.

## Features

- **Seller Mode** (PIN-protected): Market vendors can select which produce items are available for the day
- **Explore Produce**: Customers can browse available items and learn fun facts and nutritional information
- **AI-Powered Education**: Uses Claude API to generate engaging, kid-friendly educational content
- **Recipe Generator**: Select ingredients to get personalized recipe suggestions
- **Offline Support**: Caches content locally for use when internet is unavailable
- **Email Recipes**: Send recipes directly to customer email addresses

## Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI components
- **TypeScript** - Type safety
- **Zustand** - State management (MVVM pattern)
- **Tailwind CSS** - Touch-friendly styling
- **SQLite** (better-sqlite3) - Local database
- **Claude API** - AI content generation

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Anthropic API key for Claude

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/vegucation-station.git
cd vegucation-station
```

2. Install dependencies:
```bash
pnpm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

### Development

Run the development server:
```bash
pnpm dev
```

This starts both the Vite dev server for the renderer and TypeScript watcher for the main process.

### Building

Build for production:
```bash
pnpm build
```

Create Windows installer:
```bash
pnpm dist:win
```

The installer will be created in the `release/` directory.

## Project Structure

```
vegucation-station/
├── src/
│   ├── main/                # Electron main process
│   │   ├── database/        # SQLite operations
│   │   ├── services/        # Claude API, email, printer
│   │   └── ipc/             # IPC handlers
│   ├── renderer/            # React application
│   │   ├── models/          # TypeScript interfaces
│   │   ├── viewmodels/      # Zustand stores
│   │   ├── views/           # React components
│   │   └── hooks/           # Custom React hooks
│   └── shared/              # Shared types
├── assets/                  # Images and icons
└── database/                # Seed data
```

## Default PIN

The default seller PIN is `1234`. Change this after first use by modifying the settings in the database.

## Configuration

### Email Service

Configure email sending in `.env`:

**SendGrid:**
```
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_key
```

**SMTP:**
```
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=username
SMTP_PASS=password
```

## Kiosk Mode

In production builds, the application automatically runs in kiosk mode (fullscreen, no frame). During development, it runs in windowed mode with DevTools available.

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/your-username/vegucation-station/issues) page.
