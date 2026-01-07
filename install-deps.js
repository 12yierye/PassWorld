import { spawn, exec } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Installing dependencies for PassWorld...');

// Change to the project directory and install dependencies
const npmInstall = spawn('npm', ['install'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true  // Use shell to ensure PATH is inherited
});

npmInstall.on('close', (code) => {
  if (code === 0) {
    console.log('Installation completed successfully.');
  } else {
    console.log(`Installation failed with code ${code}`);
  }
});