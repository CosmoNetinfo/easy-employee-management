# 💰 Sistema di Gestione Pagamenti

## Nuove Funzionalità Aggiunte

### Per i Dipendenti

#### Pagina Pagamenti (`/dashboard/payments`)

- Visualizzazione dello storico completo dei pagamenti ricevuti
- Totale guadagnato visualizzato in evidenza
- Dettagli di ogni pagamento:
  - Importo
  - Data del pagamento
  - Periodo di riferimento (dal/al)
  - Note aggiuntive (se presenti)
- Design moderno con animazioni e gradiente
- Accessibile dalla dashboard principale e dalla bottom navigation

### Per gli Amministratori

#### Sezione Gestione Pagamenti nel Pannello Admin

- **Nuovo pulsante "💰 Gestione Pagamenti"** nel header
- **Form per registrare nuovi pagamenti**:
  - Selezione dipendente
  - Importo in euro
  - Data del pagamento
  - Periodo di riferimento (inizio e fine)
  - Note opzionali
- **Tabella pagamenti** con:
  - Visualizzazione di tutti i pagamenti effettuati
  - Filtro per dipendente
  - Totale pagato in evidenza
  - Possibilità di eliminare pagamenti

## Struttura Database

### Nuova Tabella: Payment

```sql
CREATE TABLE "Payment" (
    "id" SERIAL PRIMARY KEY,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);
```

## API Endpoints

### GET `/api/payments?userId={id}`

Recupera tutti i pagamenti per un utente specifico.

**Response:**

```json
{
  "payments": [
    {
      "id": 1,
      "amount": 450.0,
      "paymentDate": "2026-01-02T00:00:00.000Z",
      "periodStart": "2025-12-01T00:00:00.000Z",
      "periodEnd": "2025-12-31T00:00:00.000Z",
      "notes": "Pagamento dicembre 2025",
      "userId": 2
    }
  ]
}
```

### POST `/api/payments`

Crea un nuovo pagamento (solo admin).

**Request Body:**

```json
{
  "userId": 2,
  "amount": 450.0,
  "periodStart": "2025-12-01",
  "periodEnd": "2025-12-31",
  "paymentDate": "2026-01-02",
  "notes": "Pagamento dicembre 2025"
}
```

### DELETE `/api/payments?paymentId={id}`

Elimina un pagamento (solo admin).

## Come Usare

### Come Dipendente:

1. Accedi alla dashboard
2. Clicca sul pulsante "💰 Pagamenti" nella griglia delle azioni
3. Oppure usa la bottom navigation e clicca su "💰 Pagamenti"
4. Visualizza lo storico dei tuoi pagamenti

### Come Amministratore:

1. Accedi al pannello admin
2. Clicca su "💰 Gestione Pagamenti"
3. Clicca su "+ Nuovo Pagamento"
4. Compila il form:
   - Seleziona il dipendente
   - Inserisci l'importo
   - Seleziona la data del pagamento
   - Seleziona il periodo di riferimento
   - Aggiungi note (opzionale)
5. Clicca su "💾 Salva Pagamento"

## Note Importanti

✅ **I dati esistenti sono al sicuro**: La migrazione aggiunge solo una nuova tabella senza toccare i dati esistenti

✅ **Relazione con User**: Ogni pagamento è collegato a un utente specifico tramite `userId`

✅ **Ordinamento**: I pagamenti sono mostrati dal più recente al più vecchio

✅ **Validazione**: Tutti i campi obbligatori sono validati sia lato client che lato server

## Prossimi Passi

Per deployare su Vercel:

```bash
git add .
git commit -m "Add payment management system"
git push
```

Vercel farà automaticamente il deploy della nuova versione con tutte le funzionalità dei pagamenti! 🚀
