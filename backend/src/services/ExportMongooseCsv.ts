import { createObjectCsvWriter } 	from 'csv-writer';
import * as CountryMongo 			from "../database/mongodb/models/Country";
import * as CompetitionMongo 		from "../database/mongodb/models/Site";
import * as TeamMongo 				from "../database/mongodb/models/Team";
import BaseApi 						from '../siteScrapers/api/BaseApi';

class ExportMongooseCsv extends BaseApi {
	constructor() {
		super();
	}

	public async exportCountry() {
		const csvWriter = createObjectCsvWriter({
			path: 'output.csv', // Percorso dove verrà salvato il file CSV
			header: [
				{ id: 'id', title: 'ID' },
				{ id: 'name', title: 'Name' },
				{ id: 'img', title: 'img' },
				// Aggiungi altre intestazioni se necessario
			]
		});

		const records: CountryMongo.CountryArrayWithIdType = await CountryMongo.Country.find().exec();

		csvWriter.writeRecords(records)
			.then(() => console.log('Il file CSV è stato scritto con successo.'))
			.catch(err => console.error('Si è verificato un errore durante la scrittura del file CSV:', err));
	}

	public async exportTopChampionship() {
		const csvWriter = createObjectCsvWriter({
			path: 'topChampionship.csv', // Percorso dove verrà salvato il file CSV
			header: [
				{ id: 'id', title: 'ID' },
				{ id: 'name', title: 'Name' },
				{ id: 'img', title: 'img' },
				// Aggiungi altre intestazioni se necessario
			]
		});

		const records: CompetitionMongo.CompetitionArrayWithIdType = await CompetitionMongo.Competition.find({ isTop: 1 }).exec();

		csvWriter.writeRecords(records)
			.then(() => console.log('Il file CSV è stato scritto con successo.'))
			.catch(err => console.error('Si è verificato un errore durante la scrittura del file CSV:', err));
	}
	
	public async exportTeamTopCountry() {
		const csvWriter = createObjectCsvWriter({
			path: 'topTeam.csv', // Percorso dove verrà salvato il file CSV
			header: [
				{ id: 'id', title: 'ID' },
				{ id: 'name', title: 'Name' },
				{ id: 'img', title: 'img' },
				// Aggiungi altre intestazioni se necessario
			]
		});

		const teams: TeamMongo.TeamArrayWithIdType = await TeamMongo.Team.find().populate({
			path: 'countryId',
			match: { isTop: 1 }
		}).exec();

		// Filtra i team per includere solo quelli con countryId popolato
		const filteredTeams = teams.filter(team => team.countryId);

		// Crea un nuovo array di oggetti per il CSV
		const records = filteredTeams.map(team => ({
			id: team._id,
			name: team.name,
			img: team.img
			// Aggiungi altri campi se necessario
		}));
	
		csvWriter.writeRecords(records)
			 .then(() => console.log('Il file CSV è stato scritto con successo.'))
			 .catch(err => console.error('Si è verificato un errore durante la scrittura del file CSV:', err));
	 }

}
const exportMongooseCsv = new ExportMongooseCsv();
//exportMongooseCsv.exportCountry();
// exportMongooseCsv.exportTopChampionship();
exportMongooseCsv.exportTeamTopCountry();