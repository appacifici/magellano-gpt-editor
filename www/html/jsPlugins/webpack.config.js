const path                      = require( 'path' );
const HtmlWebpackPlugin         = require( 'html-webpack-plugin' ); //per la gestione dinamica dell'inclusioned dei bundle
const {CleanWebpackPlugin}      = require( 'clean-webpack-plugin' ); //per la gestione dinamica dell'inclusioned dei bundle

//Definisce l'export delle configurazioni
module.exports = {
    mode: 'development', //Definisce la modalità di compilazione
    entry: {
        app:     './src/index.tsx'
    },     
    devtool:'inline-source-map',
    target: ['web', 'es5'],

    //Per ricaricare il browser in automatico ad ogni salvataggio
    devServer: {
        static: {
            directory: path.join(__dirname, "dist")
        },
        port: 3000,
        allowedHosts: 'all'
    },
   

    //Se da errore nel ricaricamento automatico della pagina
    optimization: {
        runtimeChunk: 'single'
    },
    
    //Caricamento dei plugin
    //TODO: cancella il div iniziale perche sovrascrive il file RISOLVERE
    plugins: [
        new HtmlWebpackPlugin({}),
        new CleanWebpackPlugin()        
    ],
    
    //[name] serve a generare i file bundle con il prefisso degli entry
    output: {        
        filename: '[name].bundle.js', //Definizione del file che viene generato
        path: path.resolve( __dirname, 'dist' ) //Definizione della cartella di destinazione
    },
    
    //Definisce le estensioni che deve gestire
    resolve: {
        extensions: ['.tsx', '.ts','.js', '.jsx','.scss']
    },
    
    //Caricamentio dei moduli richiesti per i file specifici
    module: {
        rules: [ 
            {
                test: /\.s[ac]ss$/i, //Definiamo il tipo di file da gestire
                use: [
                    'style-loader',
                    'css-loader',                    
                    'sass-loader'
                    //Definiamo il tipi di loader 
                ]
            },
            {
                //Per lavorare con react
                test: /\.(js|jsx|tsx)$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
                options: { presets: ["@babel/env"] }
              },
            {
                test: /\.(js|jsx|tsx)$/, //Per utilizzare typescript
                use: [
                    'ts-loader'
                ]
            }
        ]
    }
}; 