# Easy Employee Management

## 📋 Descrizione
**Easy Employee Management** (precedentemente *Work Tracker*) è un'applicazione web moderna (PWA) progettata per semplificare la registrazione delle ore di lavoro dei dipendenti.

L'applicazione è ottimizzata per l'uso da smartphone, permettendo ai dipendenti di timbrare (Entrata/Uscita) scattando una foto geolocalizzata o contestuale in modo semplice e immediato.

## 🚀 Funzionalità Principali

### Per i Dipendenti (App Mobile)
*   **Accesso Rapido**: Login tramite **Codice Personale** univoco (es. `mario`, `luca123`).
*   **Auto-Login**: L'app ricorda l'utente, portandolo direttamente alla schermata di timbratura all'apertura.
*   **Timbratura Fotografica**:
    *   Usa la **Fotocamera Nativa** del telefono per la massima compatibilità Android/iOS.
    *   Basta premere "SCATTA FOTO ENTRATA" o "SCATTA FOTO USCITA".
    *   La foto viene salvata come prova della presenza.
*   **Stato in Tempo Reale**: Mostra chiaramente se sei "AL LAVORO" (Verde) o "NON AL LAVORO" (Rosso).
*   **Storico Ore**: Ogni dipendente può visualizzare il proprio storico turni e il totale delle ore lavorate direttamente dall'app.

### Per l'Amministratore (Pannello Web)
*   **Dashboard Completa**: Accessibile via PC con codice amministratore.
*   **Riepilogo Ore e Costi**: Calcolo automatico delle ore lavorate e dello stipendio stimato (configurabile, default 7€/h).
*   **Gestione Timbrature**:
    *   Elenco cronologico di tutte le entrate e uscite.
    *   **Visualizzazione Foto**: Popup integrato per vedere la foto scattata durante la timbratura.
    *   **Eliminazione**: Possibilità di cancellare timbrature errate o di test.
*   **Filtri Avanzati**: Filtra per data (dal/al) o per singolo dipendente.
*   **Esportazione**: Scarica tutti i dati in formato **CSV** (Excel) per la contabilità.

## 🛠️ Specifiche Tecniche

*   **Framework**: [Next.js](https://nextjs.org/) (React)
*   **Database**: PostgreSQL (tramite Prisma ORM).
*   **Hosting**: Vercel.
*   **Immagini**: Le foto sono salvate direttamente nel Database in formato **Base64** per garantire la persistenza su Vercel (che ha un file system temporaneo).
*   **PWA (Progressive Web App)**:
    *   L'app è installabile su Android/iOS direttamente dal browser ("Aggiungi a schermata Home").
    *   Include icone personalizzate e manifest ottimizzato.
    *   Funziona anche offline (interfaccia parziale) grazie al Service Worker.

## 📱 Guida all'Installazione (PWA)

L'applicazione è una PWA, quindi si installa direttamente dal browser senza passare dagli Store.

### Su Android 🤖
1.  Aprire il link del sito su **Chrome**.
2.  Premere i **3 puntini** in alto a destra.
3.  Selezionare **"Aggiungi a schermata Home"** o **"Installa app"**.
4.  L'app apparirà nella lista delle applicazioni.

### Su iPhone (iOS) 🍎
1.  Aprire il link del sito su **Safari**.
2.  Premere il tasto **Condividi** (il quadrato con la freccia in alto) nella barra in basso.
3.  Scorrere la lista e premere **"Aggiungi alla schermata Home"**.
4.  Premere "Aggiungi" in alto a destra.

## 🔧 Configurazione Database (Vercel)

L'applicazione richiede un database PostgreSQL.
Le variabili d'ambiente necessarie su Vercel sono:
*   `postgres_PRISMA_DATABASE_URL`: URL di connessione (pooling).
*   `postgres_POSTGRES_URL`: URL di connessione diretta.

## 📷 Risoluzione Problemi Fotocamera

Se la fotocamera non si apre su Android:
1.  L'app è configurata per usare l'**input nativo** (`capture="environment"`). Questo dovrebbe aprire direttamente la fotocamera posteriore.
2.  Assicurarsi di aver concesso i permessi al browser/app.
3.  Se si apre il selettore file, scegliere "Fotocamera" tra le opzioni.

---
---
*Creata da **Daniele Spalletti** per [EasyEvent.it](https://easyevent.it/)*
