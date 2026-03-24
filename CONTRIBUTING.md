# Contributing to Local MCP

We welcome contributions! Whether you're fixing bugs, adding new tools, or improving documentation, here's how you can help.

## How to Contribute

1. **Fork the Repository**: Create your own copy of the project.
2. **Create a Branch**: `git checkout -b feature/your-feature-name`.
3. **Make Changes**: Implement your tool or fix.
4. **Test Your Changes**: Ensure your code works on both Linux and Windows.
5. **Submit a PR**: Detailed descriptions in Pull Requests are appreciated.

## Adding New Tools

To add a new tool to the MCP server:

1. Open `index.js`.
2. Use the `server.tool()` method to register your tool.
3. Define the arguments using `zod` (e.g., `z.string()`).
4. Implement the logic using standard Node.js modules or existing utilities like `sudoExec`.

Example:
```javascript
server.tool(
    "my_new_tool",
    "Description of what it does",
    { arg: z.string().describe("Arg description") },
    async ({ arg }) => {
        // Your logic here
        return {
            content: [{ type: "text", text: "Success!" }],
        };
    }
);
```

## Code Style

- Use `camelCase` for variables and functions.
- Ensure cross-platform compatibility by checking `process.platform` if necessary.
- Use `sudoExec` for any commands that require elevated privileges.

Thank you for contributing!
