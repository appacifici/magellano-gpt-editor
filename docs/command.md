# Comandi Livescore

## Inizializzazione struttura e dati db
npx ts-node src/commands/initDb.ts 

## Inserimento Country da feed API

NODE_ENV=development npx ts-node src/commands/initDb.ts
NODE_ENV=development npx ts-node src/liveScoreApi/api/Federation.ts
NODE_ENV=development npx ts-node src/liveScoreApi/api/Country.ts -a importAllCountries
NODE_ENV=development npx ts-node src/liveScoreApi/api/Country.ts -a setTopCountries
NODE_ENV=development npx ts-node src/liveScoreApi/api/Competition.ts -a importAllCompetitionByFederation
NODE_ENV=development npx ts-node src/liveScoreApi/api/Competition.ts -a importAllCompetitionByCountry
NODE_ENV=development npx ts-node src/liveScoreApi/api/Competition.ts -a setTopCompetition
NODE_ENV=development npx ts-node src/liveScoreApi/api/Team.ts -a importAllTeam
NODE_ENV=development npx ts-node src/liveScoreApi/api/Standing.ts -a importAllStandings
NODE_ENV=development npx ts-node src/liveScoreApi/api/matches/ImportFixtureMatch.ts ** 1 Volta al giorno alle 2 di notte **
NODE_ENV=development npx ts-node src/liveScoreApi/api/matches/ImportLiveMacth.ts ** Ogni 1 secondo**


NODE_ENV=production npx ts-node src/commands/initDb.ts
NODE_ENV=production npx ts-node src/liveScoreApi/api/Federation.ts
NODE_ENV=production npx ts-node src/liveScoreApi/api/Country.ts -a importAllCountries
NODE_ENV=production npx ts-node src/liveScoreApi/api/Country.ts -a setTopCountries
NODE_ENV=production npx ts-node src/liveScoreApi/api/Competition.ts -a importAllCompetitionByFederation
NODE_ENV=production npx ts-node src/liveScoreApi/api/Competition.ts -a importAllCompetitionByCountry
NODE_ENV=production npx ts-node src/liveScoreApi/api/Competition.ts -a setTopCompetition
NODE_ENV=production npx ts-node src/liveScoreApi/api/Team.ts -a importAllTeam
NODE_ENV=production npx ts-node src/liveScoreApi/api/Standing.ts -a importAllStandings
NODE_ENV=production npx ts-node src/liveScoreApi/api/matches/ImportFixtureMatch.ts --day=30 ** 1 Volta al giorno alle 2 di notte **
NODE_ENV=production npx ts-node src/liveScoreApi/api/matches/ImportLiveMacth.ts ** Ogni 1 secondo**
    