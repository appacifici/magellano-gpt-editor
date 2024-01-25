import axios                                from "axios";
import { Command }                          from 'commander';
import moment                               from "moment";
import fs                                   from 'fs';

import BaseApi                              from "../src/siteScrapers/api/BaseApi";
import { GenericApiResponse }               from "../src/siteScrapers/interface/API/GlobalInterface";
import * as MatchApiResponse                from "../src/siteScrapers/interface/API/MatchInterface";
import { FeedType as FeedTypeMongo }        from "../src/database/mongodb/models/Feed";
import * as MatchMongo                      from "../src/database/mongodb/models/Match";
import * as CompetitionMongo                from "../src/database/mongodb/models/Site";
import * as TeamMongo                       from "../src/database/mongodb/models/Team";
import FrontendCreateResponse               from "../src/models/FrontendCreateResponse";
import SocketToClient                       from "../src/services/SocketToClient";

class TestImportLiveMacth extends BaseApi {    
    private frontendCreateResponse: FrontendCreateResponse; 
    private socketToClient: SocketToClient;
    private currentIteration: number; // New instance variable

    constructor() {
        super();          
        this.frontendCreateResponse = new FrontendCreateResponse();
        
        this.socketToClient = new SocketToClient(3001);
        this.socketToClient.connectClientSocket();        
        this.currentIteration = 1; // Initialize the iteration
        
        const that = this;
        that.fetchData();
        setInterval(() => {
            that.fetchData();
            that.currentIteration++; // Increment the iteration
            if (that.currentIteration > 10) { // Reset if it exceeds 10
                that.currentIteration = 1;
            }
        }, 10000);                
    }

    private async fetchData(): Promise<void> {
        try {
            
            const filePath = `./test/data/matchDataJson_${this.currentIteration}.json`; // Use currentIteration       
            console.log(filePath); 
            const fileData = await this.readJsonFile(filePath);
            if (fileData) {
                const apiResponse: GenericApiResponse<MatchApiResponse.Match> = fileData;
                await this.eachFixture(apiResponse).then((result) => {
                    this.socketToClient.sendDataLive(JSON.stringify(this.frontendCreateResponse.objResponse));
                });
            }
        } catch (error) {
            console.error('Errore durante la lettura del file:', error);
        }
    }

    private async readJsonFile(filePath: string): Promise<GenericApiResponse<MatchApiResponse.Match> | null> {
        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Errore durante la lettura del file ${filePath}:`, error);
            return null;
        }
    }

    private async eachFixture(apiResponse: GenericApiResponse<MatchApiResponse.Match>) {        
        const promises = apiResponse.data['match'].map(async (item) => {
          return this.setLiveMatch(item);
        });      
        await Promise.all(promises);
    }

    private async setLiveMatch(match: MatchApiResponse.Match) {
        const homeTeam:     TeamMongo.TeamWithIdType | null | undefined                = await this.getTeamByFilter({externalId:match.home_id});
        const awayTeam:     TeamMongo.TeamWithIdType | null | undefined                = await this.getTeamByFilter({externalId:match.away_id});
        const competition:  CompetitionMongo.CompetitionWithIdType | null | undefined  = await this.getOneCompetitionByFilter({externalId:match.competition_id});

        if( !this.isValidDataType(homeTeam) ) {
            console.log('Skip match not valid homeTeam:', match);   
            return null;
        }
        if(!this.isValidDataType(awayTeam)) {
            console.log('Skip match not valid awayTeam:', match);   
            return null;
        }
        if(!this.isValidDataType(competition) ) {
            console.log('Skip match not valid competition:', match);   
            return null;
        }

        const dateMatch = moment().format('YYYY-MM-DD')+' '+match.scheduled;
        const dataMatch:MatchMongo.MatchType = {
            competitionId:      competition._id,
            teamHome:           homeTeam._id,
            teamAway:           awayTeam._id,
            fixtureId:          Number(match.fixture_id),
            timeMatch:          match.time,
            dateMatch:          dateMatch,
            extMatchId:         match.id,
            score:              match.score,
            lastGoal:           '',
            status:             match.status,
            halfTimeScore:      match.ht_score,
            fullTimeScore:      match.ft_score,
            extraTimeScore:     match.et_score,
            penaltyTimeScore:   match.ps_score,
            lastChanged:        new Date(match.last_changed)
        }  

        const resultMatch:MatchMongo.MatchWithIdType|boolean = await this.getMatch(Number(match.fixture_id));
        if (typeof resultMatch === 'object') {                         
            const differences = findDiff(dataMatch, resultMatch);
            console.log(differences);
            
            if( JSON.stringify(differences) !== '{}' ) {                
                if( differences.lastGoal != '' ) {
                    dataMatch.lastGoal = differences.lastGoal;
                }
                this.frontendCreateResponse.addLiveMatch(differences, resultMatch);
            }

            MatchMongo.Match.updateOne({ extMatchId: match.id }, dataMatch )
            .then(result => {
                
            })
            .catch(err => {
                console.error(err);
            });
            //console.log('update: '+match.id);
        } else {
            console.log('insert');
            const newMatch = new MatchMongo.Match(dataMatch);
            newMatch.save().then(doc => {
                //console.log('Document inserted:');    
            }).catch(err => {
                console.error('Error inserting document:', err);            
            });
        }        
    }

    private async getMatch(fixtureId:number): Promise<MatchMongo.MatchWithIdType|boolean> {
        try {
            const filter:object = {fixtureId:fixtureId};
            const match:MatchMongo.MatchWithIdType|null = await MatchMongo.Match.findOne(filter).populate('competitionId').populate('teamHome').populate('teamAway').exec()
            if( this.isValidDataType(match)) {
                return match;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Errore durante la ricerca del match:', error);
        }
        return false;
    }
}

function findDiff(apiDataMatch: Record<string, any>, mongoMatch: Record<string, any>): Record<string, any> {
    const diff: Record<string, any> = {};
    let key: string;
    let competitionId: string = '';  // Initialize competitionId with a default value
  
    for (key in apiDataMatch) {      
        if (key == 'competitionId') {
            competitionId = apiDataMatch[key];
        }  
        if (JSON.stringify(apiDataMatch[key]) !== JSON.stringify(mongoMatch[key])) {
            if (key != 'teamHome' && key != 'teamAway' && key != 'dateMatch' && key != 'competitionId' && key != 'lastChanged' && key != 'lastGoal') {
                diff[key] = apiDataMatch[key];            
            }    
        }
    }  
    
    if (JSON.stringify(diff) !== '{}' && competitionId != '') {
        diff['competitionId'] = competitionId;
    }

    const scoreMondoSplit   = mongoMatch.score.replace(/\s/g, '');
    const scoreApiSplit     = apiDataMatch.score.replace(/\s/g, '');    
    const [homeTeamScoreMongo, awayTeamScoreMongo]  = scoreMondoSplit.split('-');
    const [homeTeamScoreApi, awayTeamScoreApi]      = scoreApiSplit.split('-');

    diff['newGoal'] = false;
    if( scoreMondoSplit != scoreApiSplit && homeTeamScoreApi !== '?' && awayTeamScoreApi != '?'  ) {    

        if (homeTeamScoreMongo !== homeTeamScoreApi) {
            diff['lastGoal'] = 'home';
        }

        console.log(awayTeamScoreMongo+'!=='+awayTeamScoreApi);
        if (awayTeamScoreMongo !== awayTeamScoreApi) {
            diff['lastGoal'] = 'away';
        }

        diff['newGoal'] = true;
    }
    return diff;
}

const program = new Command();
program.version('1.0.0').description('CLI team commander')     
    .action((options) => {    
        new TestImportLiveMacth(); 
    });
program.parse(process.argv);