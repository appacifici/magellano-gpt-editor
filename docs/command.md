# Node 21

NODE_ENV=development npx tsx src/commands/initDb.ts
NODE_ENV=development npx tsx src/commands/importSitemapArticle.ts -s ilcorrieredellacitta.com -a readSitemap
NODE_ENV=development npx tsx src/commands/generateGptArticle.ts -s roma.cronacalive.it
NODE_ENV=development npx tsx src/commands/sendToWpApi.ts -s roma.cronacalive.it

NODE_ENV=development npx tsx src/commands/importSitemapArticle.ts -s wineandfoodtour.it -a readSitemap
NODE_ENV=development npx tsx src/commands/generateGptArticle.ts -s bluedizioni.it
NODE_ENV=development npx tsx src/commands/sendToWpApi.ts -s bluedizioni.it

## Inizializzazione struttura e dati db
npx ts-node src/commands/initDb.ts 

## Inserimento Country da feed API

NODE_ENV=development npx ts-node src/commands/initDb.ts
NODE_ENV=development npx ts-node src/commands/getWpApiCategories.ts -s bluedizioni.it
NODE_ENV=development npx ts-node src/commands/importSitemapArticle.ts -s ilcorrieredellacitta.com -a readSitemap
NODE_ENV=development npx ts-node src/commands/generateGptArticle.ts -s bluedizioni.it
NODE_ENV=development npx ts-node src/commands/sendToWpApi.ts -s bluedizioni.it
NODE_ENV=development npx ts-node src/services/OpenAi/OpenAiService.ts
NODE_ENV=development npx ts-node src/commands/getWpApi.ts -s bluedizioni.it


NODE_ENV=production npx ts-node src/commands/initDb.ts
NODE_ENV=production npx ts-node src/commands/importSitemapArticle.ts -s ilcorrieredellacitta.com -a readSitemap
NODE_ENV=production npx ts-node src/commands/generateGptArticle.ts -s ilcorrieredellacitta.com
NODE_ENV=production npx ts-node src/commands/getWpApi.ts -s roma.cronacalive.it
NODE_ENV=production npx ts-node src/commands/sendToWpApi.ts -s roma.cronacalive.it


NODE_ENV=production forever start  src/forever/foreverGetWpApi.cjs
NODE_ENV=production forever start  src/forever/foreverImportSitemapArticle.cjs
NODE_ENV=production forever start  src/forever/foreverGenerateGptArticle.cjs
NODE_ENV=production forever start  src/forever/foreverSendToWpApi.cjs

