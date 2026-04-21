# Wit Web Application

A modern, beautiful web application for browsing repositories, managing pull requests, and handling issues. This is the GitHub.com equivalent for Wit.

## Tech Stack

- **Vite** + **React 19** - Fast development and building
- **React Router** - Client-side routing
- **TailwindCSS** + **shadcn/ui** - Beautiful, accessible UI components
- **TanStack Query** (via tRPC React) - Data fetching and caching
- **Lucide Icons** - Beautiful icons
- **React Markdown** - Markdown rendering with GFM support

## Getting Started

### Prerequisites

- Node.js 22.13.0 or higher
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server at http://localhost:5173
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
apps/web/
├── index.html              # Entry HTML
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # TailwindCSS configuration
├── src/
│   ├── main.tsx            # Entry point
│   ├── App.tsx             # Root with providers + router
│   ├── routes/
│   │   ├── index.tsx       # Landing/dashboard
│   │   ├── login.tsx       # Auth
│   │   ├── register.tsx
│   │   ├── owner.tsx       # User/org profile
│   │   ├── settings.tsx    # User settings
│   │   └── repo/
│   │       ├── index.tsx   # Repo home (README)
│   │       ├── tree.tsx    # Directory browser
│   │       ├── blob.tsx    # File viewer
│   │       ├── commits.tsx # Commit history
│   │       ├── branches.tsx # Branch list
│   │       ├── pulls.tsx   # PR list
│   │       ├── pull-detail.tsx # PR detail
│   │       ├── issues.tsx  # Issue list
│   │       ├── issue-new.tsx # Create issue
│   │       └── issue-detail.tsx # Issue detail
│   ├── components/
│   │   ├── ui/             # shadcn components
│   │   ├── layout/         # Header, Footer
│   │   ├── repo/           # File tree, code viewer
│   │   ├── diff/           # Diff viewer
│   │   ├── pr/             # PR components
│   │   ├── issue/          # Issue components
│   │   └── markdown/       # Markdown renderer
│   ├── lib/
│   │   ├── trpc.tsx        # tRPC client setup
│   │   ├── auth.ts         # Auth utilities
│   │   ├── utils.ts        # Utility functions
│   │   └── api-types.ts    # API type definitions
│   └── styles/
│       └── globals.css     # Global styles + CSS variables
└── package.json
```

## Features

### Core Pages

- **Landing Page** - Hero section, features, quick start
- **Dashboard** - Recent repos, activity feed (when logged in)
- **Repository Browser** - File tree, README display
- **Code Viewer** - Syntax highlighted with line numbers
- **Pull Request List** - Filter by state, labels
- **Pull Request Detail** - Diff viewer, conversation, merge
- **Issue List** - Filter by state, search
- **Issue Detail** - Comments, labels, assignees
- **User Profile** - Repositories, activity

### UI Components

- **File Tree** - Collapsible directory browser
- **Diff Viewer** - Line-by-line with add/remove highlighting
- **Branch Selector** - Dropdown with search
- **Merge Button** - Multiple merge strategies
- **Label Picker** - Add/remove labels
- **Markdown Renderer** - GFM support with code highlighting

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | tRPC API endpoint | `/trpc` |

## Theming

The app uses CSS variables for theming. Colors are defined in `src/styles/globals.css`:

```css
:root {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... more variables */
}
```

Both light and dark themes are supported with dark mode as the default.

## API Integration

The app is designed to work with a tRPC API. Currently, mock data is used for development. To connect to a real API:

1. Set up the tRPC server (see `src/api/` in the main project)
2. Update `VITE_API_URL` to point to your API
3. Import the actual `AppRouter` type from the server package

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to verify
5. Submit a pull request

## License

MIT
