import ImageWP from "../database/mongodb/models/ImageWP";

async function findImageByWords2(words: any) {
    // Creare un array di espressioni regolari per ogni parola
    const regexParole = words.map((word: string) => new RegExp(word, 'i')); // 'i' per rendere la ricerca case-insensitive

    // Effettuare la ricerca utilizzando $or per cercare corrispondenze in uno qualsiasi dei campi
    const risultati = await ImageWP.aggregate([
        {
            $addFields: {
                score: {
                    $sum: [
                        {
                            $sum: regexParole.map((word: string) => ({
                                $cond: { if: { $regexMatch: { input: "$imageTitle", regex: word } }, then: 1, else: 0 }                                
                            }))
                        },
                        {
                            $sum: regexParole.map((word: string) => ({
                                $cond: { if: { $regexMatch: { input: "$imageAltText", regex: word } }, then: 1, else: 0 }
                            }))
                        }
                    ]
                }
            }
        },
        {
            $match: { score: { $gt: 0 } } // Filtra i documenti con un punteggio maggiore di 0
        },
        {
            $sort: { score: -1 } // Ordina i risultati per punteggio in ordine decrescente
        }
    ]);

    return risultati[0]; // Restituisce solo il risultato con il punteggio più alto
}

async function findImageByWords(keywordWithWeights: [], sitePublicationId: any) {    

    keywordWithWeights.map(({ keyword, peso }: { keyword: string, peso: string }) => {
        console.log(keyword, peso);
    });

    const regexExpressions = keywordWithWeights.map(({ keyword }:{ keyword: string, peso: string }) => new RegExp(keyword, 'i'));
    const risultati = await ImageWP.aggregate([
        {           
            $addFields: {
                score: {
                    $sum: [
                        {
                            $sum: keywordWithWeights.map(({ keyword, peso }:{ keyword: string, peso: string }) => ({                                
                                $cond: { if: { $regexMatch: { input: "$imageTitle", regex: new RegExp(keyword, 'i') } }, then: parseInt(peso), else: 0 }
                            }))
                        },
                        {
                            $sum: keywordWithWeights.map(({ keyword, peso }:{ keyword: string, peso: string }) => ({
                                $cond: { if: { $regexMatch: { input: "$imageAltText", regex: new RegExp(keyword, 'i') } }, then: parseInt(peso), else: 0 }
                            }))
                        }
                    ]
                }
            }
        },
        {
            $match: { score: { $gt: 0 } } // Filtra i documenti con un punteggio maggiore di 0
        },
        {
            $sort: { score: -1 } // Ordina i risultati per punteggio in ordine decrescente
        }
    ]);
    return risultati[0];
}

export {findImageByWords};