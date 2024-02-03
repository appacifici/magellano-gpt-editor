const { spawn } = require('child_process');

const child = spawn('npx', ['ts-node', 'src/cron/cronGenerateGptArticle.ts'], {
  env: { ...process.env },
  shell: true
});

child.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

child.on('close', (code) => {
  console.log(`Processo terminato con codice ${code}`);
});