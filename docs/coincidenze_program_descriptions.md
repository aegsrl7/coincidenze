# Istruzioni per Claude Code — Aggiornamento descrizioni programma coincidenze.org

## Obiettivo

Aggiorna le descrizioni degli eventi nel programma del sito **coincidenze.org**.
Il sito è costruito su Cloudflare Pages. I dati del programma sono probabilmente in un file JSON (es. `data/evento.json`, `public/data.json` o simile — cerca nel progetto).

Aggiorna il campo `descrizione` di ogni evento nella lista `programma` con i testi qui sotto.
Se il campo non esiste, aggiungilo.
Se l'evento non è presente nel JSON, non crearlo — segnalalo soltanto.

---

## Testi per ogni evento

### 1. Ancreus Live — Part 1
**Orario:** 11:00 – 11:30
**Luogo:** Sala Superiore
**Descrizione:**
> Tre voci, due chitarre, un'unica emozione. Ancreus apre la giornata con la prima parte del loro live acustico. Alberto Calandri, Diego Cavallero e Giorgia Bruno attraversano brani italiani e internazionali in un viaggio sonoro intimo e avvolgente.

---

### 2. Michele Marziani — Lo Sciamano delle Alpi
**Orario:** 11:30 – 12:30
**Luogo:** Orto Romano
**Descrizione:**
> Michele Marziani presenta il suo libro in un contesto che sembra fatto apposta per accoglierlo. Lo Sciamano delle Alpi è un racconto che mescola montagna, spirito e identità. Conduce la presentazione Samantha Viva.

---

### 3. Pietro Fantone — Video AI
**Orario:** 13:00 – 13:30
**Luogo:** Sala Superiore
**Descrizione:**
> Pietro Fantone, videomaker pluripremiato e ospite alla Berlinale, accompagna il pubblico in un viaggio nel nuovo mondo dell'intelligenza artificiale applicata al video. Strumenti, possibilità e domande aperte su come l'AI sta cambiando il modo di raccontare per immagini.

---

### 4. Petra Lindblom — Viaggio Sciamanico
**Orario:** 14:00 – 14:30
**Luogo:** Giardino
**Descrizione:**
> Petra Lindblom, attrice, terapista gestalt e sciamana svedese, conduce nel giardino di Marsam un momento di riconnessione con la terra. Un'esperienza guidata per ritrovare radici, respiro e presenza — in controtendenza con i ritmi di tutti i giorni.

---

### 5. Delfina Testa — Tarocchi
**Orario:** 12:00 – 16:00
**Luogo:** Tenda nel giardino
**Descrizione:**
> Nella tenda nel giardino, Delfina Testa aspetta chi è titubante, curioso o semplicemente in cerca di un altro tipo di risposta. I suoi tarocchi sono chiacchieroni e sapienti. Una lettura non è una previsione — è una conversazione.

---

### 6. Michele Marziani — La Cura dello Stupore
**Orario:** 15:00 – 15:30
**Luogo:** Orto Romano
**Descrizione:**
> Il secondo appuntamento con Michele Marziani. La cura dello stupore è un invito a rallentare lo sguardo e a ritrovare la meraviglia nelle cose ordinarie. Conduce Samantha Viva.

---

### 7. Ancreus Live — Part 2
**Orario:** 16:00 – 16:30
**Luogo:** Sala Superiore
**Descrizione:**
> Il ritorno di Ancreus per la seconda parte del loro live acustico. Alberto Calandri, Diego Cavallero e Giorgia Bruno chiudono il pomeriggio con lo stesso spirito con cui l'hanno aperto — tre voci, due chitarre, una sola emozione.

---

### 8. Cristina Saimandi — A Passo Lento
**Orario:** 17:00 – 17:45
**Luogo:** Sala Superiore
**Descrizione:**
> Cristina Saimandi, artista e scalatrice, porta a Coincidenze il suo cortometraggio: un viaggio dal cuore delle campagne saviglianesi fino alla cima del Monviso. Ogni passo diventa un dialogo con la natura, l'arte e il senso profondo dell'esistenza. La lentezza come esperienza spirituale.

---

### 9. Atto del Fuoco — Marco Marsam
**Orario:** 18:00
**Luogo:** Giardino
**Descrizione:**
> Per chiudere la giornata, Marco cucina per tutti. Un momento conviviale attorno al fuoco, dove il calore diventa linguaggio. Un piatto preparato con le mani, servito all'aperto, da condividere senza fretta.

---

### 10. Mostra Fotografica
**Orario:** Tutto il giorno, 10:00 – 20:00
**Luogo:** Galleria
**Descrizione:**
> Sei fotografi, sei modi di vedere lo stesso mondo. Mauro Curti, Luca Fumero, Paolo Emanuele Sicca, Marco Salzotto, Owen Zaccagnino e Tazio Secchiaroli espongono in una mostra collettiva aperta per tutta la giornata. Ogni sguardo è una storia a sé.

---

### 11. Mostra Pittura
**Orario:** Tutto il giorno, 10:00 – 20:00
**Luogo:** Sala Arte
**Descrizione:**
> Marco Fiaschi espone in Sala Arte il suo lavoro pittorico. Gesso, cemento, sabbia, ferro, ossidi e juta lavorati per sovrapposizioni — come ere geologiche che emergono da un lontano passato. Una tridimensionalità quasi scultorea che racconta di natura e contesto sociale.

---

### 12. Mostra Scultura
**Orario:** Tutto il giorno, 10:00 – 20:00
**Luogo:** Giardino
**Descrizione:**
> Nel giardino di Marsam, la scultura occupa lo spazio all'aperto. Crux e Franco Sebastiano Alessandria espongono le loro opere tra le piante e la luce del 25 aprile. La materia ha sempre qualcosa da dire — basta fermarsi ad ascoltarla.

---

### 13. Degustazione Vino
**Orario:** Tutto il giorno, 10:00 – 20:00
**Luogo:** Portico
**Descrizione:**
> Una selezione pensata apposta per questa giornata, a cura di Silvio Altare. Vini classici, contemporanei ed emozionali — da regioni e paesi diversi, ognuno con una storia da raccontare. Perché una buona tavola non è mai una coincidenza.

---

### 14. La Cucina di Marsam
**Orario:** Tutto il giorno, 10:00 – 20:00
**Luogo:** Ristorante e Giardino
**Descrizione:**
> La cucina di Marsam è un posto dove le cose buone succedono per ragioni precise, anche quando sembrano casuali. Forno, brace, fritto, farcito, comfort food e dolce. Marco e Alice accolgono per tutta la giornata con la loro proposta culinaria — aperta, generosa, sorprendente.

---

## Note per Claude Code

- Il campo da aggiornare è `descrizione` all'interno di ogni oggetto nella lista `programma` del JSON dell'evento.
- Abbina ogni testo all'evento corretto tramite il campo `titolo` o `orario_inizio`.
- Non modificare altri campi (orari, luogo, artisti, ecc.) a meno che non siano palesemente errati.
- Se il JSON ha una struttura diversa da quella attesa, adatta il testo al campo equivalente più vicino.
- Dopo l'aggiornamento, verifica che il sito in locale mostri le descrizioni correttamente prima di fare il deploy.
