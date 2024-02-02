# Comandi Livescore

## Inizializzazione struttura e dati db
npx ts-node src/commands/initDb.ts 

## Inserimento Country da feed API

NODE_ENV=development npx ts-node src/commands/initDb.ts
NODE_ENV=development npx ts-node src/commands/importSitemapArticle.ts -s vanityfair.it -a readSitemap
NODE_ENV=development npx ts-node src/commands/generateGptArticle.ts -s vanityfair.it
NODE_ENV=development npx ts-node src/commands/sendToWpApi.ts -s vanityfair.it


NODE_ENV=production npx ts-node src/commands/initDb.ts
NODE_ENV=production npx ts-node src/commands/importSitemapArticle.ts -s vanityfair.it -a readSitemap
NODE_ENV=production npx ts-node src/commands/generateGptArticle.ts -s vanityfair.it
NODE_ENV=production npx ts-node src/commands/sendToWpApi.ts -s vanityfair.it
    