---
name: coolify
description: "Reference for deploying and managing applications with Coolify CLI (coolify-cli). Use this skill whenever the user mentions deploying, deployment, Coolify, managing servers, syncing environment variables to production/staging, checking deployment logs, or managing databases/backups on their infrastructure. Also trigger when the user asks about their hosting platform or how to push changes live."
---

# Coolify CLI

The user's deployment platform is **Coolify** (self-hosted PaaS). The CLI tool `coolify` is installed and available.

- **Docs / Source**: https://github.com/coollabsio/coolify-cli
- **Config**: `~/.config/coolify/config.json`
- **Self-hosted instance** (single context)

## Setup

If the CLI is not configured yet:

1. Get an API token from the Coolify dashboard at `/security/api-tokens`
2. Add context: `coolify context add -d <name> <url> <token>`
3. Verify: `coolify context list`

## Common Commands

### Deploying

```bash
coolify deploy name <app-name>          # Deploy by name
coolify deploy uuid <uuid>              # Deploy by UUID
coolify deploy batch app1,app2,app3     # Deploy multiple
coolify deploy name <app-name> --force  # Force deploy
```

### Deployment status

```bash
coolify deploy list                     # Recent deployments
coolify deploy get <deployment-uuid>    # Deployment details
coolify deploy cancel <uuid>            # Cancel a deployment
```

### Application management

```bash
coolify app list                        # List all apps
coolify app get <uuid>                  # App details
coolify app start/stop/restart <uuid>   # Lifecycle
coolify app logs <uuid>                 # View logs
coolify app deployments logs <uuid> -f  # Follow deployment logs
```

### Environment variables

```bash
coolify app env list <uuid>                     # List env vars
coolify app env sync <uuid> --file .env.local   # Sync from file
coolify app env create <uuid> KEY=value         # Create single var
coolify app env update <uuid> KEY=value         # Update single var
coolify app env delete <uuid> KEY               # Delete single var
```

`env sync` updates existing vars and creates missing ones but does NOT delete extras.

### Databases

```bash
coolify database list                           # List databases
coolify database get <uuid>                     # Details
coolify database start/stop/restart <uuid>      # Lifecycle
```

### Database backups

```bash
coolify database backup list <uuid>             # List backup configs
coolify database backup create <uuid>           # Create backup config
coolify database backup trigger <backup-uuid>   # Manual backup
coolify database backup executions <backup-uuid> # List executions
```

### Servers & resources

```bash
coolify server list                             # List servers
coolify server get <uuid> --resources           # Server resources
coolify resources list                          # All resources
coolify projects list                           # All projects
```

### Services

```bash
coolify service list                            # List services
coolify service start/stop/restart <uuid>       # Lifecycle
coolify service env list/sync/create <uuid>     # Env vars (same as app)
```

## Global flags

| Flag | Purpose |
|------|---------|
| `--format json` | JSON output (default is table) |
| `--format pretty` | Pretty-printed JSON |
| `-s, --show-sensitive` | Show tokens/IPs |
| `-f, --force` | Skip confirmations |
| `--debug` | Debug mode |

## Typical workflows

**Deploy after code changes:**
```bash
coolify deploy name <app-name>
coolify app deployments logs <uuid> -f   # Watch it roll out
```

**Sync env vars and deploy:**
```bash
coolify app env sync <uuid> --file .env.local
coolify deploy name <app-name>
```

**Check what's running:**
```bash
coolify app list --format json
coolify app logs <uuid>
```
