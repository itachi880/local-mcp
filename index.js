const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const express = require("express");
const { z } = require("zod");
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const crypto = require('crypto');
const sudo = require('sudo-prompt');
const execPromise = util.promisify(exec);


const server = new McpServer({
    name: "local-mcp",
    version: "1.0.0",
});

// Register a tool
server.tool(
    "list_tree",
    "List files in a directory",
    { path: z.string().describe("The directory path") },
    async ({ path }) => {
        // Replace with your actual DB call
        try {
            return {
                content: [{ type: "text", text: JSON.stringify(directoryTreeToJSON(path)) }],
            };
        } catch (err) {
            return {
                content: [{ type: "text", text: JSON.stringify(err), isError: true }],
            };
        }
    }
);
server.tool(
    "get_session_info",
    "get session info  in json format ",
    async ({ }) => {
        try {
            return {
                content: [{
                    type: "text", text: JSON.stringify({
                        "os": "ubuntu",
                        "home_dir": "/home/badr",
                        "user": "badr",
                    })
                }],
            };
        } catch (err) {
            return {
                content: [{ type: "text", text: JSON.stringify(err), isError: true }],
            };
        }
    }
);

server.tool(
    "make_file",
    "Create a new file with content",
    {
        path: z.string().describe("The file path"),
        content: z.string().describe("The file content")
    },
    async ({ path: filePath, content }) => {
        try {
            fs.writeFileSync(filePath, content);
            return {
                content: [{ type: "text", text: `File created at ${filePath}` }],
            };
        } catch (err) {
            return {
                content: [{ type: "text", text: JSON.stringify(err), isError: true }],
            };
        }
    }
);

server.tool(
    "make_dir",
    "Create a new directory",
    { path: z.string().describe("The directory path") },
    async ({ path: dirPath }) => {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            return {
                content: [{ type: "text", text: `Directory created at ${dirPath}` }],
            };
        } catch (err) {
            return {
                content: [{ type: "text", text: JSON.stringify(err), isError: true }],
            };
        }
    }
);

server.tool(
    "terminal",
    "Run a command in the terminal",
    { command: z.string().describe("The command to run") },
    async ({ command }) => {
        try {
            const { stdout, stderr } = await execPromise(command);
            return {
                content: [{ type: "text", text: stdout || stderr }],
            };
        } catch (err) {
            return {
                content: [{ type: "text", text: JSON.stringify(err), isError: true }],
            };
        }
    }
);

server.tool(
    "sudo_terminal",
    "Run a command in the terminal with sudo",
    { command: z.string().describe("The command to run") },
    async ({ command }) => {
        return new Promise((resolve) => {
            sudo.exec(command, { name: 'Local MCP' }, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        content: [{ type: "text", text: JSON.stringify(error), isError: true }],
                    });
                } else {
                    resolve({
                        content: [{ type: "text", text: stdout || stderr }],
                    });
                }
            });
        });
    }
);

server.tool(
    "replace_content_in_file",
    "Replace content in a file",
    {
        path: z.string().describe("The file path"),
        oldContent: z.string().describe("The content to replace"),
        newContent: z.string().describe("The new content")
    },
    async ({ path: filePath, oldContent, newContent }) => {
        try {
            const content = fs.readFileSync(filePath, "utf8");
            const updatedContent = content.replace(oldContent, newContent);
            fs.writeFileSync(filePath, updatedContent);
            return {
                content: [{ type: "text", text: `Content replaced in ${filePath}` }],
            };
        } catch (err) {
            return {
                content: [{ type: "text", text: JSON.stringify(err), isError: true }],
            };
        }
    }
);

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    await transport.close();
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

/**
 * Recursively reads a directory and builds a tree structure.
 * @param {string} dirPath The absolute or relative path to the directory.
 * @returns {object} The directory structure as an object (JSON compatible).
 */
function directoryTreeToJSON(dirPath) {
    const name = path.basename(dirPath);
    const stats = fs.statSync(dirPath);

    if (stats.isFile()) {
        return {
            type: 'file',
            name: name,
            size: stats.size,
        };
    } else if (stats.isDirectory()) {
        const contents = fs.readdirSync(dirPath).map(childName => {
            const childPath = path.join(dirPath, childName);
            return directoryTreeToJSON(childPath); // Recursive call
        });

        return {
            type: 'directory',
            name: name,
            contents: contents,
        };
    }
}

