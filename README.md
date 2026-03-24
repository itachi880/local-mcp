# Local MCP Server

A powerful, cross-platform Model Context Protocol (MCP) server that provides local tools for file system manipulation and terminal execution, integrated with Cloudflare Tunnel for easy remote access.

## Features

- **Cross-Platform Tools**: Works seamlessly on both Windows and Linux.
- **Secure Elevation**: Custom `sudoExec` function that handles elevated commands using a base64-encoded password from your environment.
- **Cloudflare Tunnel**: Automated setup and launch of Cloudflare tunnels to expose your local MCP server to the web.
- **Rich Toolset**:
  - `list_tree`: List directory structures.
  - `make_file` / `make_dir`: Create files and directories.
  - `terminal` / `sudo_terminal`: Run shell commands with standard or elevated privileges.
  - `replace_content_in_file`: Easily modify file contents.
  - `get_session_info`: Retrieve environment/session data.

## Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended).
- A `.env` file with a `PASSWORD` variable (base64 encoded).

### 2. Setup
Install dependencies and the Cloudflare Tunnel binary:
```bash
npm run setup
```

### 3. Start
Launch the server and the tunnel:
```bash
npm start
```
*Your tunnel URL will be displayed in the terminal once it's ready.*

## Configuration

Create a `.env` file in the root directory:
```env
PASSWORD=your_base64_encoded_sudo_password
```

## Available Tools

| Tool | Action |
| --- | --- |
| `make_file` | Create a file with content |
| `make_dir` | Create a new directory |
| `terminal` | Run a shell command |
| `sudo_terminal` | Run a command with elevated privileges |
| `replace_content_in_file` | Replace text in a file |

For more details, see the generated [walkthrough](./walkthrough.md).
