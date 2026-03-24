const { spawn } = require('child_process');
const readline = require('readline');
const os = require('os');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { execSync } = require('child_process');

const encodedPassword = process.env.PASSWORD;
const password = encodedPassword ? Buffer.from(encodedPassword, 'base64').toString('utf8') : '';

const sudoExec = (command) => {
    if (process.platform === 'win32') {
        const fullCommand = `powershell -Command "Start-Process cmd -ArgumentList '/c ${command}' -Verb RunAs -Wait"`;
        return execSync(fullCommand, { stdio: 'inherit' });
    } else {
        const fullCommand = `echo "${password}" | sudo -S -p "" ${command}`;
        return execSync(fullCommand, { stdio: 'inherit' });
    }
}

const verbose = process.argv.includes('--verbose');

async function main() {
    if (verbose) {
        console.log('Starting server...');
    }
    const server = spawn('node', ['index.js'], { 
        stdio: verbose ? 'inherit' : 'pipe',
        env: { ...process.env, NODE_ENV: 'production' }
    });

    if (!verbose) {
        server.stdout.on('data', (data) => {
            // Silently consume
        });
    }

    if (verbose) {
        console.log('Launching Cloudflare Tunnel...');
    }
    
    let cloudflaredCmd = 'cloudflared';
    if (os.platform() === 'win32') {
        const localPath = path.join(__dirname, 'cloudflared.exe');
        if (fs.existsSync(localPath)) {
            cloudflaredCmd = localPath;
        }
    }

    const tunnel = spawn(cloudflaredCmd, ['tunnel', '--url', 'http://localhost:3000'], { stdio: 'pipe' });

    const rl = readline.createInterface({
        input: tunnel.stderr, // cloudflared logs to stderr
        terminal: false
    });

    let urlFound = false;

    rl.on('line', (line) => {
        if (verbose) {
            console.log(line);
        }
        
        const match = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (match && !urlFound) {
            urlFound = true;
            console.log('\n\x1b[1m\x1b[32mTunnel URL:\x1b[0m \x1b[4m\x1b[36m' + match[0] + '\x1b[0m\n');
            if (!verbose) {
                console.log('(Use Ctrl+C to stop the server and tunnel)\n');
            }
        }
    });

    tunnel.on('close', (code) => {
        if (code !== 0 && !urlFound) {
            console.error(`Tunnel exited with code ${code}. Run with --verbose for details.`);
        }
        server.kill();
        process.exit(code);
    });

    process.on('SIGINT', () => {
        console.log('\nShutting down...');
        server.kill();
        tunnel.kill();
        process.exit();
    });
}

main().catch(console.error);
