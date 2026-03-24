// server.js
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const express = require("express");
const { z } = require("zod");

const sessions = {
    "session_id": {
        "os": "ubuntu",
        "home_dir": "/home/badr",
        "user": "badr",

    }
}
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
    "get session info by session id in json format ",
    { session_id: z.string().describe("The session id") },
    async ({ session_id }) => {
        try {
            return {
                content: [{ type: "text", text: JSON.stringify(sessions[session_id]) }],
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


const fs = require('fs');
const path = require('path');

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

