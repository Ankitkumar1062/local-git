<div align="center">

# myvcs

**Git that understands your code.**

A Git implementation with AI woven into the workflow — not bolted on.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.13.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Website](https://myvcs.sh) | [Documentation](https://docs.myvcs.sh) | [Quickstart](https://docs.myvcs.sh/quickstart) | [Roadmap](./ROADMAP.md)

</div>

---

## What is myvcs?

myvcs is a complete Git reimplementation in TypeScript with AI capabilities built into its core. It's not a wrapper around Git — it's a fresh take on version control that understands your code, not just your files.

```bash
$ myvcs search "where do we handle authentication?"

  src/core/auth.ts:45-89 (94% match)
  SessionManager.createSession()
  │ 45 │ async createSession(userId: string) {
  │ 46 │   const token = crypto.randomBytes(32)...
```

## Why myvcs?

| Problem | Git | myvcs |
|---------|-----|-----|
| Undo a mistake | `git reflog` + prayer | `myvcs undo` |
| Write commit message | You do it | `myvcs ai commit` does it |
| Find code by intent | `grep` everything | `myvcs search "how does X work?"` |
| Helpful errors | `fatal: bad revision` | Explains what went wrong + suggests fix |
| Branch with uncommitted changes | Stash, switch, pop, cry | Just switch. myvcs handles it. |

## Quick Start

```bash
# Install
git clone https://github.com/Ankitkumar1062/local-git.git && cd local-git
nvm use || nvm install
npm install && npm run build && npm link

# Start using it
myvcs init my-project && cd my-project
myvcs add . && myvcs commit -m "initial commit"

# Let AI help
myvcs ai commit -a -x              # AI writes the commit message
myvcs search "where is auth?"      # Semantic search, not grep
myvcs ai review                    # AI reviews your changes
```

## Features

### AI-Native Workflow

```bash
myvcs ai commit -a -x      # AI analyzes changes and writes the message
myvcs ai review            # Get AI code review before pushing
myvcs ai explain HEAD~3..  # Explain what happened in recent commits
myvcs search "error handling for API calls"  # Semantic search
```

### Quality of Life Commands

```bash
myvcs undo                 # Actually undo the last thing (journal-based)
myvcs wip -a               # Quick save with auto-generated message
myvcs amend -m "fix typo"  # Amend last commit easily
myvcs uncommit             # Undo commit but keep changes staged
myvcs cleanup              # Delete merged branches
```

### Visual Interfaces

```bash
myvcs web                  # Browser UI for your repo (like GitKraken)
myvcs ui                   # Terminal UI (keyboard-driven)
myvcs graph                # Commit graph in terminal
```

### Full Git Compatibility

myvcs implements Git from scratch but stays compatible:

- Push/pull to GitHub, GitLab, Bitbucket
- 66 commands covering the full Git workflow
- Works with existing Git repositories
- Same `.git` directory structure

## What's Included

| Category | What You Get |
|----------|--------------|
| **Git Commands** | 66 commands — init, add, commit, branch, merge, rebase, cherry-pick, bisect, stash, worktree, submodules... |
| **AI Tools** | Commit messages, code review, PR descriptions, conflict resolution, semantic search |
| **Visual UIs** | Web UI (`myvcs web`), Terminal UI (`myvcs ui`), commit graph |
| **Self-Hosted Server** | Git hosting with PRs, issues, webhooks, branch protection, releases |

## Status

This is early software. We're shipping fast, not perfect.

- **Git Implementation**: 98% complete
- **AI Features**: 95% complete  
- **Platform/Server**: 90% complete
- **Web UI**: 75% complete

Check the [ROADMAP](./ROADMAP.md) for details and what's coming.

## Documentation

| Resource | Description |
|----------|-------------|
| [Quickstart](https://docs.myvcs.sh/quickstart) | Zero to productive in 5 minutes |
| [Why myvcs?](https://docs.myvcs.sh/why-myvcs) | The problems we're solving |
| [Commands](https://docs.myvcs.sh/commands/overview) | Every command documented |
| [AI Features](https://docs.myvcs.sh/features/ai-powered) | Commit messages, review, semantic search |
| [Self-Hosting](https://docs.myvcs.sh/platform/self-hosting) | Run your own myvcs server |
| [IDE & Agent Vision](./docs/IDE_AND_AGENT_VISION.mdx) | Our roadmap to the best IDE ever |

## Command Reference

```bash
# Basics
myvcs init                 # Initialize new repo
myvcs add . && myvcs commit  # Standard workflow
myvcs switch -c feature    # Create and switch to branch
myvcs undo                 # Undo last operation

# AI (requires OPENAI_API_KEY or ANTHROPIC_API_KEY)
myvcs ai commit -a -x      # AI writes commit message
myvcs ai review            # AI reviews your changes
myvcs search "how does X work?"

# Daily workflow
myvcs wip -a               # Quick work-in-progress save
myvcs amend -m "fix typo"  # Fix last commit
myvcs cleanup              # Delete merged branches
myvcs stash                # Stash changes

# Visual
myvcs web                  # Browser UI
myvcs ui                   # Terminal UI
myvcs graph                # Commit graph
```

## Self-Hosting

myvcs can run as a full Git hosting platform — think self-hosted GitHub:

```bash
# Start the server
myvcs serve --port 3000 --repos ./repos

# Start the web app
cd apps/web && npm run dev
```

You get:
- **Git hosting** via HTTP and SSH
- **Pull requests** with reviews, comments, and merge options
- **Issues** with Linear-inspired workflows
- **Branch protection** rules
- **Webhooks** for integrations
- **tRPC API** for building your own tools

### `myvcs web` vs `myvcs serve`

| | `myvcs web` | `myvcs serve` |
|---|-----------|-------------|
| **Purpose** | View current repo in browser | Host multiple repos |
| **Setup** | None | Database + config |
| **Features** | Read-only browser | Full platform (PRs, issues, auth) |
| **Use case** | Quick visualization | Team collaboration |

## Requirements

- **Node.js** >= 22.13.0
- **AI features** require `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

The repo includes `.nvmrc` and `.node-version`, and uses `engine-strict=true` in `.npmrc` so incorrect Node versions fail fast during install.

## Built With

myvcs stands on the shoulders of these excellent open source projects:

### Backend

| Project | What it does |
|---------|--------------|
| [Hono](https://github.com/honojs/hono) | Fast, lightweight web framework |
| [tRPC](https://github.com/trpc/trpc) | End-to-end typesafe APIs |
| [Drizzle ORM](https://github.com/drizzle-team/drizzle-orm) | TypeScript ORM with great DX |
| [better-auth](https://github.com/better-auth/better-auth) | Authentication for TypeScript |
| [Mastra](https://github.com/mastra-ai/mastra) | AI agent framework |
| [Vercel AI SDK](https://github.com/vercel/ai) | AI/LLM integrations |
| [Zod](https://github.com/colinhacks/zod) | TypeScript-first schema validation |

### Frontend

| Project | What it does |
|---------|--------------|
| [React](https://github.com/facebook/react) | UI library |
| [Vite](https://github.com/vitejs/vite) | Build tool and dev server |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) | Utility-first CSS |
| [Radix UI](https://github.com/radix-ui/primitives) | Unstyled, accessible components |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | Re-usable components built on Radix |
| [Monaco Editor](https://github.com/microsoft/monaco-editor) | Code editor that powers VS Code |
| [Zustand](https://github.com/pmndrs/zustand) | State management |
| [TanStack Query](https://github.com/TanStack/query) | Data fetching and caching |
| [React Flow](https://github.com/xyflow/xyflow) | Node-based graph UI |
| [Lucide](https://github.com/lucide-icons/lucide) | Icons |
| [Shiki](https://github.com/shikijs/shiki) | Syntax highlighting |
| [cmdk](https://github.com/pacocoursey/cmdk) | Command palette component |
| [dnd-kit](https://github.com/clauderic/dnd-kit) | Drag and drop toolkit |
| [React Router](https://github.com/remix-run/react-router) | Client-side routing |
| [date-fns](https://github.com/date-fns/date-fns) | Date utility library |

### CLI & TUI

| Project | What it does |
|---------|--------------|
| [OpenTUI](https://github.com/pavi2410/opentui) | Terminal UI framework |
| [Solid.js](https://github.com/solidjs/solid) | Reactive UI primitives (for TUI) |

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

```bash
git clone https://github.com/Ankitkumar1062/local-git.git
cd local-git
npm install
npm run build
npm test
```

## About This Project

myvcs is an experiment in AI-led software development. The technical direction, architecture, and priorities are defined by Claude (an AI), with a human co-founder providing guidance and autonomy.

Read more in the [ROADMAP](./ROADMAP.md).

## License

MIT
