import React                            from 'react';
import { useDispatch }                  from 'react-redux';
import { Socket, io as socketIOClient } from 'socket.io-client';
import dotenv                           from 'dotenv';
import Head                             from 'next/head';

import * as CountryMongo                from '../../../dbService/models/Country';
import * as StandingMongo               from '../../../dbService/models/Standing';
import Header                           from '../../../container/Header';
import Footer                           from '../../../container/Footer';
import MainStanding                     from '../../../container/MainStanding';
import MatchesBoard                     from '../../../match/components/MatchesBoard';
import { updateMatches }                from '../../../match/slice/MatchSlice';
import { wrapperMatch }                 from '../../../match/store/MatchStore';


import Competition, {CompetitionType}                     from '../../../dbService/models/Competition';

import { connectMongoDB, initData, InitDataReturnType, currentDate }          from '../../../services/globalNext';

export const getServerSideProps = wrapperMatch.getServerSideProps(
    (store) => async (context) => {     	        
        const result = dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
        if (result.error) {
            console.log( result.error );
        }

        const { date, country, league }     = context.query;
        await connectMongoDB();        
        
        const scountry                               = Array.isArray(country) ? country[0] : country;        
        const sleague                                = Array.isArray(league) ? league[0] : league;       
        
        const countryMongo                           = await CountryMongo.Country.findOne({ permalink:scountry }).lean().exec();        
        const competition:CompetitionType            = await Competition.findOne({ permalink:sleague, countryId:countryMongo }).exec();
        const dateMatches                            = date !== undefined ? date : currentDate();
                
        let dataStandings:StandingMongo.StandingArrayWithIdType;
        let standings:StandingMongo.StandingArrayWithIdType

        try {
            dataStandings = await StandingMongo.Standing.find({ competitionId: competition.externalId }).sort({ rank: 1 }).lean().exec();    
            standings = dataStandings.map(doc => ({
                ...doc,
                _id: doc._id.toString(), // Converti ObjectId in stringa
            }));        
        } catch (error) {
            console.error("Errore durante la query:", error);
        }                
		        
		const data:InitDataReturnType = await initData(store, dateMatches, competition );
        
		return {
			props: {
                'nationsCompetitions':  data.nationsCompetitions,
                'competitionsTop':      data.competitionsTop,
                'standings':            standings,
                'sleague':              sleague
            },
		};
	}
);


function MatchesBoardPage(data:any) {        
    let lastHidden          = false;    
    const dispatch          = useDispatch();
    const host              = process.env.NEXT_PUBLIC_WS_HOST;
    const socket: Socket    = socketIOClient(host, { secure: true, rejectUnauthorized: false });
    // console.info('Tentativo connessione: '+process.env.NEXT_PUBLIC_WS_HOST);
    socket.on('connect', () => {
        console.info('Client connesso: '+process.env.NEXT_PUBLIC_WS_HOST);
        
    });

    socket.on('error', (error) => {
        console.error('Errore di connessione', error); // Modifica per riflettere l'errore
        
    });
    socket.on('dataLive', (data) => {        
        dispatch(updateMatches(JSON.parse(data)));
    });    

    socket.on('ping', function() {    
        //let isMobile  = 1;
        // let nowHidden = isMobile == 1 ? document.hidden : false;
        let nowHidden = false;
        socket.emit('pongSocket', {'hidden': nowHidden, 'lastHidden' : lastHidden });            
//                console.log('ping socketLCS:' +document.hidden);  
        //lastHidden = window.document.hidden;
    });

    const rLeague = data.sleague.replace(/-/g, " ");
    console.log(rLeague);
    return(  
        <>              
            <Head>
                <title>{`Direttagol.it | Risultati in tempo reale ${rLeague} | Gol in diretta live`}</title>
                <meta name="description" content={`${rLeague} - I risultati in tempo reale delle partite live e la classifica : segui con noi in diretta tutti gli aggiornamenti sulla ${rLeague}`} />
            </Head>                                          
            <Header/>                                        
            <MainStanding standings={data.standings} nationsCompetitions={data.nationsCompetitions} competitionsTop={data.competitionsTop} MatchBoard={<MatchesBoard/>}/>
            <Footer/>            
        </>
    );
}

export default MatchesBoardPage;