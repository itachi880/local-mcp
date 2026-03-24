const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const platform = os.platform();
const arch = os.arch();

async function setup() {
    console.log(`Setting up for ${platform} (${arch})...`);

    // 1. Install npm dependencies first so we have sudo-prompt, dotenv etc.
    console.log('Installing npm dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Now we can require needed packages
    require('dotenv').config();
    const encodedPassword = process.env.PASSWORD;
    const password = encodedPassword ? Buffer.from(encodedPassword, 'base64').toString('utf8') : '';
    const sudoExec = (command) => {
        const fullCommand = `echo "${password}" | sudo -S -p "" ${command}`;
        return execSync(fullCommand, { stdio: 'inherit' });
    }

    if (platform === 'linux') {
        try {
            execSync('cloudflared --version');
            console.log('cloudflared is already installed.');
        } catch (e) {
            console.log('Installing cloudflared...');
            const url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb';
            const dest = path.join(os.tmpdir(), 'cloudflared.deb');
            console.log(`Downloading from ${url}...`);
            await downloadFile(url, dest);
            console.log('Download complete. Installing...');

            try {
                sudoExec(`dpkg -i ${dest}`);
                console.log('cloudflared installed successfully.');
            } catch (err) {
                console.error('Failed to install cloudflared:', err);
            }
        }
    } else if (platform === 'win32') {
        const dest = path.join(__dirname, 'cloudflared.exe');
        if (!fs.existsSync(dest)) {
            console.log('Downloading cloudflared.exe...');
            // Note: In a real scenario, you might want to check arch (x64 vs arm64)
            const url = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
            await downloadFile(url, dest);
            console.log('cloudflared.exe downloaded to project root.');
        } else {
            console.log('cloudflared.exe already exists.');
        }
    } else {
        console.log(`Platform ${platform} is not specially handled for cloudflared installation.`);
    }

    console.log('Setup finished.');
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            const file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

setup().catch(console.error);
