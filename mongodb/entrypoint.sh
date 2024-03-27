#!/bin/bash

# Assicurati che MongoDB sia arrestato correttamente quando il container viene terminato.
trap "echo 'Stopping MongoDB'; mongod --shutdown; exit 0" SIGTERM SIGINT

# Verifica se il DB deve essere inizializzato (es. controlli personalizzati, seeding, ecc.)
# Questo è un buon posto per eseguire script di inizializzazione o seed database, se necessario.

echo "Avvio di MongoDB..."
# Avvia MongoDB in background
mongod &

# Attendi che MongoDB sia completamente avviato (potresti voler modificare questo per usare netcat o simili)
while ! mongo --eval "print(\"waited for connection\")" > /dev/null 2>&1; do
  sleep 1
done

echo "MongoDB avviato."

# Mantieni il processo in primo piano, altrimenti Docker considererà che il container sia terminato.
# Questo è particolarmente importante in uno script entrypoint per assicurarsi che il container continui a eseguire.
tail -f /dev/null
