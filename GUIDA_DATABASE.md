
# Guida Configurazione Database Vercel

Ecco come creare e collegare il database per la tua app.

## 1. Crea il Database su Vercel
1. Vai sulla dashboard del tuo progetto su **Vercel**.
2. Clicca sulla scheda **"Storage"** in alto.
3. Clicca su **"Create Database"** e seleziona **"Postgres"**.
4. Dai un nome (es. `work-tracker-db`) e seleziona la regione (es. *Frankfurt* per l'Europa).
5. Clicca **"Create"**.
6. Quando richiesto, clicca **"Connect Project"** e seleziona il tuo progetto `easy-employee-management`.

## 2. Prepara il Database (Crea le Tabelle)
Ora il database è vuoto. Dobbiamo creare le tabelle usando i comandi dal tuo computer.

1. In Vercel, nella pagina del Database, cerca la sezione **".env.local"** o **"Quickstart"**.
2. Copia i valori di `POSTGRES_PRISMA_URL` e `POSTGRES_URL_NON_POOLING`.
3. Apri il file `.env` nel tuo progetto locale (crealo se non c'è) e incollaci i valori così (sostituisci con i tuoi):

   ```env
   # Incolla qui quello che ti da Vercel
   DATABASE_URL="...il_tuo_postgres_prisma_url..."
   DIRECT_URL="...il_tuo_postgres_url_non_pooling..."
   ```

4. Esegui questo comando nel tuo terminale locale per creare le tabelle online:
   ```bash
   npx prisma db push
   ```

5. (Opzionale) Crea l'utente Admin predefinito online:
   ```bash
   npx tsx prisma/seed.ts
   ```

## 3. Riavvia Vercel
1. Torna su Vercel nella scheda **"Deployments"**.
2. Clicca sull'ultimo deploy, poi sui 3 puntini -> **"Redeploy"**.
3. Questo farà leggere al sito le nuove chiavi del database.

Fatto! Ora la tua app online scriverà sul database cloud.
