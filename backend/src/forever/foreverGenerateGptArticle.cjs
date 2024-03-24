const { spawn } = require('child_process');

const child = spawn('npx', ['tsx', 'src/cron/cronGenerateGptArticle.ts'], {
  env: { ...process.env },
  shell: true
});

child.stdout.on('data', (data) => {
  console.log(`${getCurrentDateTime()} stdout: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`${getCurrentDateTime()} stderr: ${data}`);
});

child.on('close', (code) => {
  console.log(`${getCurrentDateTime()} Processo terminato con codice ${code}`);
});

const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};