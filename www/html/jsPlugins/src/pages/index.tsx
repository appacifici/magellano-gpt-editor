import React                            from 'react';
import dotenv                           from 'dotenv';
import Head                             from 'next/head';
import { GetServerSideProps }           from 'next';


import Header                           from '../container/Header';
import Footer                           from '../container/Footer';

import { connectMongoDB }               from '../services/globalNext';
import Main from '../container/Main';
import AlertComponent from '../components/Alert';
import Alert,{ AlertArrayWithIdType } from '../dbService/models/Alert';

// const matchesUpdate:MatchesInterface = {"654bcb0850ad1ee8c57aa3da":{"competition":{"id":"654bcb0850ad1ee8c57aa3da","matches":{"6560e1416d929032388a4c61":{"current_time":"83"}}}},"654bcaf550ad1ee8c57aa2b9":{"competition":{"id":"654bcaf550ad1ee8c57aa2b9","matches":{"6560e1416d929032388a4c9d":{"current_time":"90"},"6560e1416d929032388a4c9b":{"current_time":"88"}}}},"654bcaf950ad1ee8c57aa2ed":{"competition":{"id":"654bcaf950ad1ee8c57aa2ed","matches":{"6560e84dd7a15903991f8d67":{"current_time":"57"},"6560e84dd7a15903991f8d65":{"current_time":"53"},"6560e84dd7a15903991f8d6c":{"current_time":"59"},"6560e84dd7a15903991f8d6e":{"current_time":"60"},"6560e84dd7a15903991f8d81":{"current_time":"58"},"6560e84dd7a15903991f8d83":{"current_time":"59"}}}},"654bcb0c50ad1ee8c57aa40c":{"competition":{"id":"654bcb0c50ad1ee8c57aa40c","matches":{"6560e87fd7a15903991f9ced":{"current_time":"60"}}}},"654bcb0350ad1ee8c57aa37f":{"competition":{"id":"654bcb0350ad1ee8c57aa37f","matches":{"6560ef5b519abfa26c025188":{"status":"ADDED TIME","current_time":"45+"},"6560ef5b519abfa26c025192":{"status":"ADDED TIME","current_time":"45+"},"6560ef5b519abfa26c0251ce":{"status":"HALF TIME BREAK","current_time":"HT","first_half_away_score":"1","first_half_home_score":"0"}}}},"654bd88be5a4549faacdaf62":{"competition":{"id":"654bd88be5a4549faacdaf62","matches":{"6560ef83519abfa26c02563b":{"status":"ADDED TIME","current_time":"45+"}}}},"654bd87be5a4549faacdaf35":{"competition":{"id":"654bd87be5a4549faacdaf35","matches":{"6560ef97519abfa26c025875":{"status":"HALF TIME BREAK","current_time":"HT","first_half_away_score":"3","first_half_home_score":"0"}}}},"654bcb0650ad1ee8c57aa3b2":{"competition":{"id":"654bcb0650ad1ee8c57aa3b2","matches":{"6560f663519abfa26c030cf2":{"current_time":"16"}}}},"654bcb0650ad1ee8c57aa3bb":{"competition":{"id":"654bcb0650ad1ee8c57aa3bb","matches":{"6560f663519abfa26c030cf6":{"current_time":"15"}}}},"654bcaf950ad1ee8c57aa2f6":{"competition":{"id":"654bcaf950ad1ee8c57aa2f6","matches":{"6560f663519abfa26c030d41":{"current_time":"18"}}}},"654bcafd50ad1ee8c57aa334":{"competition":{"id":"654bcafd50ad1ee8c57aa334","matches":{"6560fa10519abfa26c037634":{"status":"IN PLAY","current_time":"1","home_score":"0","away_score":"0"}}}}};

const formatDate = (dateString:string) => {
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC' // Assicurati di specificare il fuso orario se necessario
    });
    return formatter.format(date);
  };

export const getServerSideProps: GetServerSideProps = async (context) => {
    // Caricamento delle variabili d'ambiente
    const result = dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
    if (result.error) {
        console.error(result.error);
    }

    // Connettiti al database (assicurati che connectMongoDB sia implementata correttamente)
    await connectMongoDB();

    let alerts: AlertArrayWithIdType = await Alert.find({}).lean();
    
    // Converti _id da ObjectId a stringa
    alerts = alerts.map(alert => ({
        ...alert,
        _id: alert._id.toString(),
        createdAt: alert.createdAt ? formatDate(alert.createdAt.toString()) : null,
        updatedAt: alert.updatedAt ? formatDate(alert.updatedAt.toString()) : null
    }));

    console.log(alerts);
    return {
        props: {
            'alerts':  alerts
        }            
    };
};



function MatchesBoardPage(data:any) {        

    return(  
        <>           
            <Head>
                <title>Direttagol.it | Risultati in tempo reale serie A | Gol in diretta live</title>                
            </Head>                                             
            <Header/>            
            <Main MainPage={<AlertComponent alerts={data.alerts} />} />


            <Footer/>            
        </>
    );
}

export default MatchesBoardPage;