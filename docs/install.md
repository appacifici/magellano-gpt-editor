# Installazione Prod


## Installazione node e npm ( parte comune )
```bash
sudo apt update
cd ~
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc

#Lista di tutte le versioni installabili disponibili
nvm list-remote

#Installazione della versione
nvm install v19.9.0

#Lista versioni installate
nvm list

#Installazione npm
sudo apt install npm

```

## Creazione Key SSH ( parte comune )
```bash
ssh-keygen -t rsa -b 4096
cat /home/ubuntu/.ssh/id_rsa.pub
```
Copiare la chiave stampata andare su GitHub:
https://github.com/appacifici/magellano-direttagol/settings/keys

Cliccare su **Add deploy key** e incollare la chiave appena generata, poi salvare

## Installazione codice ( parte comune )
```bash 
mkdir /home/ubuntu/site
cd /home/ubuntu/site
git clone git@github.com:appacifici/magellano-gpt-editor.git
cd magellano-direttagol
```

## Installazione Backend
```bash 
cd magellano-gpt-editor
cd backend/
#Per disabilitare il traggiamento di next in maniera anonima 
npx next telemetry disable
npx next telemetry status
#Risposta: Status: Disabled

npm install
npm install forever -g
cd /home/ubuntu/site/magellano-gpt-editor/backend
forever start socketLiveMacth.js

sudo apt-get install ufw
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 3001
sudo ufw enable
sudo ufw status numbered

```

## Installazione Mongo
```bash 
#Aggiorna i Pacchetti del Sistema
sudo apt update
sudo apt upgrade

sudo apt install software-properties-common gnupg apt-transport-https ca-certificates -y

#Importa la Chiave Pubblica di MongoDB
curl -fsSL https://pgp.mongodb.com/server-7.0.asc |  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

#Aggiungi il Repository di MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

#Aggiorna i Pacchetti e Installa MongoDB
sudo apt-get update
sudo apt install mongodb-org -y
mongod --version

sudo nano /usr/lib/systemd/system/mongod.service
Environment="MONGODB_CONFIG_OVERRIDE_NOFORK=0"
sudo systemctl daemon-reload
sudo systemctl restart mongod

#Avvia e Abilita MongoDB: Una volta installato, devi avviare il servizio MongoDB e abilitarlo a partire automaticamente all'avvio del sistema
sudo systemctl start mongod
sudo systemctl enable mongod

#Firewall

sudo ufw status numbered
sudo ufw allow from 212.171.14.254 to any port 27017
sudo ufw allow 22
sudo ufw enable
sudo ufw status numbered


#Per verificare se blocca correttamente
tail -f /var/log/ufw.log #Sul server con ufw
telnet 149.202.70.56 27017 #Da server non autorizzato

```

## Configurazione Mongo
```bash
#Configura MongoDB (Opzionale)
nano /etc/mongod.conf

#Imposta bindIp per autorizzare connessioni esterne da specifici IP
net:
  port: 27017
  bindIp: 127.0.0.1,149.202.70.74,149.202.70.56

#Riavvia mongo
sudo systemctl restart mongod

mongodump --db livescore --out /home/ubuntu/livescoreDump
mongorestore --db livescore /home/ubuntu/livescoreDump/livescore

```

## Installazione cron
NODE_ENV=production forever start  src/forever/foreverImportSitemapArticle.cjs
NODE_ENV=production forever start  src/forever/foreverGenerateGptArticle.cjs
NODE_ENV=production forever start  src/forever/foreverSendToWpApi.cjs