const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Determine the appropriate logs directory
const logsDir = path.resolve(process.cwd(), 'logs');

// Ensure the logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const platform = os.platform();
const isWindows = platform === 'win32';

const scriptPath = path.join(
    __dirname,
    '..',
    'scripts',
    isWindows ? 'start.bat' : 'start.sh'
);

console.log(`Starting servers on ${platform}...`);
console.log(`Using script: ${scriptPath}`);

const child = spawn(
    isWindows ? scriptPath : `./${scriptPath}`,
    [],
    {
        stdio: 'inherit',
        shell: isWindows ? true : '/bin/bash',
        cwd: path.dirname(scriptPath)
    }
);

child.on('error', (error) => {
    console.error(`Error: ${error.message}`);
    fs.appendFileSync(
        path.join(logsDir, 'error.log'),
        `${new Date().toISOString()} - Error: ${error.message}\n`
    );
});

process.on('SIGINT', () => {
    child.kill('SIGINT');
});