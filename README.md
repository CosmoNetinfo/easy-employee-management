# Easy Employee Management

## 📋 Descrizione
**Easy Employee Management** è una Progressive Web App (PWA) avanzata per la gestione delle presenze e della contabilità del personale. Ideata per essere snella e altamente performante, permette di tracciare orari, scattare prove fotografiche delle timbrature e gestire pagamenti in tempo reale, tutto dal palmo di una mano.

## 🚀 Funzionalità Complete

### 📱 Portale Dipendenti
*   **Accesso Semplificato**: Login rapido tramite codice personale univoco.
*   **Auto-Login Persistente**: L'app ricorda l'utente per un accesso istantaneo alle funzioni di timbratura.
*   **Timbratura con Verifica Fotografica**:
    *   Integrazione nativa con la fotocamera dello smartphone.
    *   Obbligo di scatto fotografico all'entrata e all'uscita per garantire la trasparenza.
    *   Salvaggio automatico della data e dell'ora di sistema.
*   **Dashboard Personale**:
    *   Visualizzazione in tempo reale delle ore lavorate (giornaliere, settimanali, totali).
    *   Calcolo automatico del guadagno stimato basato sulla tariffa oraria personale.
*   **Storico Pagamenti**: Sezione dedicata per consultare tutti i compensi ricevuti, con dettagli sui periodi di riferimento e note dell'amministratore.

### 💻 Pannello Amministratore (Admin)
*   **Dashboard Statistica**: Grafici interattivi (Bar Charts) per monitorare il carico di lavoro del team.
*   **Controllo Costi**: Riepilogo immediato delle ore totali e della spesa salariale prevista per il periodo selezionato.
*   **Gestione Presenze**:
    *   Visualizzazione di tutte le timbrature con anteprima delle foto originali.
    *   Editing manuale delle timbrature (per correzioni di errori umani).
    *   Eliminazione di record singoli o multipli.
*   **Gestione Pagamenti Avanzata**:
    *   Registrazione di nuovi versamenti collegati ai dipendenti.
    *   Tracciamento dei periodi salariali (Inizio/Fine periodo).
    *   Visualizzazione dello storico pagamenti globale e filtrato.
*   **Filtri Intelligenti**: Selezione rapida per dipendente o range di date personalizzato.
*   **Esportazione Dati**:
    *   **CSV**: Download immediato dei dati per analisi esterne in Excel.
    *   **PDF Professionali**: Generazione automatica di report in formato "Busta Paga" pronti per la condivisione.

## 🛠️ Stack Tecnologico
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19)
*   **Linguaggio**: TypeScript
*   **Database**: PostgreSQL
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **Analisi Dati**: [Recharts](https://recharts.org/) per la visualizzazione dinamica.
*   **Generazione PDF**: JSPDF & JSPDF-Autotable.
*   **PWA**: Service Worker personalizzato per caching e installazione su Homescreen.
*   **Hosting**: Vercel (ottimizzato per serverless e database edge).

## 📱 Guida all'Installazione (PWA)
L'app non richiede download dagli store tradizionali:
1.  **Android (Chrome)**: Apri il link -> 3 puntini -> "Aggiungi a schermata Home".
2.  **iOS (Safari)**: Apri il link -> Tasto Condividi -> "Aggiungi alla schermata Home".

---
*Sviluppato con cura per ottimizzare il workflow dei team dinamici.*
