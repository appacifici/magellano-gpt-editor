import express                          from 'express';
import cors                             from 'cors';
import connectMongoDB                   from '../database/mongodb/connect';
import Alert                            from '../database/mongodb/models/Alert';

connectMongoDB(); 

const app   = express();
const PORT  = 3001;

app.use(cors());

/**
 * Metodo che viene invocato dal frontend per ricevere i dati di giornata
 */
app.get('/api/alerts/:id', async (req, res) => {
    
    try {
        const alert = await Alert.findById(req.params.id);
        res.json(alert);
      } catch (error) {
        console.error('Errore durante il recupero dei dati dell\'alert:', error);
        res.status(500).json({ error: 'Errore durante il recupero dei dati dell\'alert' });
      }
});
    
app.listen(PORT, () => {
    console.log(`Server Express in esecuzione sulla porta ${PORT}`);
});