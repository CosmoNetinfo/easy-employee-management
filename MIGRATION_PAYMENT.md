# Guida Migrazione Database - Aggiunta Modello Payment

## Passaggi per applicare la migrazione su Vercel

### 1. Accedi al tuo database PostgreSQL su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **Storage** → **Postgres**
4. Clicca sul tuo database
5. Vai alla tab **Query**

### 2. Esegui lo script SQL

Copia e incolla il contenuto del file `prisma/migrations/add_payment_model.sql` nella console Query di Vercel e clicca su **Run Query**.

Oppure copia direttamente questo codice:

```sql
-- Migration: Add Payment Model
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" SERIAL PRIMARY KEY,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
```

### 3. Verifica la migrazione

Dopo aver eseguito lo script, verifica che la tabella sia stata creata correttamente:

```sql
SELECT * FROM "Payment";
```

Dovresti vedere una tabella vuota (nessun errore).

### 4. Deploy dell'applicazione

Dopo aver applicato la migrazione al database, fai il deploy dell'applicazione su Vercel:

```bash
git add .
git commit -m "Add payment management feature"
git push
```

Vercel farà automaticamente il deploy della nuova versione.

## Funzionalità Aggiunte

### Per i Dipendenti

- **Nuova pagina `/dashboard/payments`**: I dipendenti possono visualizzare lo storico dei loro pagamenti ricevuti
- Visualizzazione del totale guadagnato
- Dettagli di ogni pagamento con periodo di riferimento e note

### Per gli Admin

- **Sezione Gestione Pagamenti** nel pannello admin
- Possibilità di registrare nuovi pagamenti per i dipendenti
- Visualizzazione di tutti i pagamenti effettuati
- Eliminazione di pagamenti (se necessario)

## Note Importanti

- La tabella Payment è collegata alla tabella User tramite `userId`
- Ogni pagamento include:
  - Importo (`amount`)
  - Data del pagamento (`paymentDate`)
  - Periodo di riferimento (`periodStart` e `periodEnd`)
  - Note opzionali (`notes`)
- I pagamenti sono ordinati per data in ordine decrescente (più recenti prima)
