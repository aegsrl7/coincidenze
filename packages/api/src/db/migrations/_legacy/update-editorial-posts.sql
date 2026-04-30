-- CORREZIONI PIANO EDITORIALE - da comunicato stampa 2026-04-01

-- 1. p04: Aggiungere Marco Salzotto ai fotografi + Alfonso Zorzo (collezione privata)
UPDATE editorial_posts SET
  descrizione = '6 fotografi, una mostra collettiva. Carosello con una slide per fotografo. Include opere dalla collezione privata di Alfonso Zorzo.',
  caption_suggerita = 'Sei sguardi sul mondo. Una mostra. Luca Fumero · Marco Salzotto · Mauro Curti · Owen Zaccagnino · Paolo Sicca · Tazio Secchiaroli. Con opere dalla collezione Alfonso Zorzo. Mostra fotografica 10:00-20:00 · Galleria. #COINCIDENZE2026 #Fotografia',
  artisti_coinvolti = '["Luca Fumero","Marco Salzotto","Mauro Curti","Owen Zaccagnino","Paolo Sicca","Tazio Secchiaroli","Alfonso Zorzo"]',
  note = 'Una slide per fotografo con foto e nome. Collab post con @iamluchino e @maurocurti_. Marco Salzotto e'' anche lo chef di Marsam Locanda.'
WHERE id = 'p04';

-- 2. p05: Togliere Cristina Saimandi, aggiornare CRUX (volto umano), confermare Franco S. Alessandria
UPDATE editorial_posts SET
  descrizione = '3 artisti tra giardino e sala. CRUX esplora il volto umano, Franco Sebastiano Alessandria con una suggestiva scultura, Marco Fiaschi stupisce con le sue opere pittoriche.',
  caption_suggerita = 'La materia prende forma. Sculture nel giardino, pittura in sala. CRUX · Franco Sebastiano Alessandria · Marco Fiaschi. 10:00-20:00. #COINCIDENZE2026 #Scultura #Pittura #Arte',
  artisti_coinvolti = '["CRUX","Franco Sebastiano Alessandria","Marco Fiaschi"]',
  note = 'Collab con @crux2019. CRUX: tema del volto umano. F.S. Alessandria: scultura suggestiva. Fiaschi: pittura.'
WHERE id = 'p05';

-- 3. p07: Marco Salzotto come chef (doppio ruolo), togliere Serena Colombo
UPDATE editorial_posts SET
  descrizione = 'La cucina di Marco Salzotto (anche fotografo in mostra!) e la degustazione vini curata da Silvio Altare. Il food content performa bene.',
  caption_suggerita = 'Un tavolo apparecchiato tutto il giorno. La cucina di Marco Salzotto. I vini selezionati da Silvio Altare. Ristorante, Giardino e Portico · 10:00-20:00. #COINCIDENZE2026 #VinoECucina #MarsamLocanda',
  artisti_coinvolti = '["Marco Salzotto","Silvio Altare"]',
  note = 'Il food content ha il miglior engagement storico. Collab @marsamlocanda. Reel food consigliato. Marco e'' sia chef che fotografo — doppio ruolo interessante per lo storytelling.'
WHERE id = 'p07';

-- 4. p08: Aggiornare titolo secondo libro Marziani
UPDATE editorial_posts SET
  descrizione = 'Due presentazioni libri: Lo Sciamano delle Alpi e La cura dello stupore. Conduce la giornalista Samantha Viva.',
  caption_suggerita = 'Parole che aprono mondi. Michele Marziani presenta due libri a COINCIDENZE. 11:30 Lo Sciamano delle Alpi · 15:00 La cura dello stupore. Orto Romano. Conduce @sammiworld. #COINCIDENZE2026 #Libri #MicheleMarziani',
  note = 'Collab @micmarziani e @sammiworld. Post di Samantha amplifica enormemente (295 like storico).'
WHERE id = 'p08';

-- 5. p09: Da "Teatro e Esperienze" a "Sciamanesimo e Tarocchi" — solo Delfina + Petra
UPDATE editorial_posts SET
  emoji = '🔮',
  titolo = 'Spotlight — Sciamanesimo e Tarocchi',
  descrizione = 'Momenti dedicati allo sciamanesimo e ai tarocchi. Petra Lindblom, sciamana dalla Svezia, e Delfina Testa con letture dei tarocchi nel giardino.',
  caption_suggerita = 'Viaggi sciamanici e letture dei tarocchi nel giardino. Due esperienze da vivere. Petra Lindblom · Delfina Testa. #COINCIDENZE2026 #Sciamanesimo #Tarocchi',
  artisti_coinvolti = '["Petra Lindblom","Delfina Testa"]',
  note = 'Tono misterioso e intrigante. Due novita'' dell''Ed.1. Suggestioni fisiche e metafisiche.'
WHERE id = 'p09';

-- 6. p10: Da solo Saimandi a "Cinema e Video" con Pietro Fantone
UPDATE editorial_posts SET
  emoji = '🎬',
  titolo = 'Spotlight — Cinema e Video',
  descrizione = 'Pietro Fantone, esperto di AI e recente ospite alla Berlinale, pluripremiato per i suoi lavori video. Cristina Saimandi con il cortometraggio A Passo Lento, un viaggio dal cuore delle campagne saviglianesi alla cima del Monviso.',
  caption_suggerita = 'Due visioni. Pietro Fantone, ospite alla Berlinale, porta la sua arte video AI. Cristina Saimandi racconta il viaggio dal Saviglianese al Monviso in A Passo Lento. Proiezioni · Sala Superiore. #COINCIDENZE2026 #Cinema #VideoAI #APassoLento',
  artisti_coinvolti = '["Pietro Fantone","Cristina Saimandi"]',
  note = 'Collab @cristinasaimandiartist. Pietro Fantone: ospite Berlinale, pluripremiato. Se c''e'' un trailer, usare come Reel.'
WHERE id = 'p10';

-- 7. NUOVO POST: Serena Colombo — Piante e Ricami (15 aprile, tra Marziani e Sciamanesimo)
INSERT INTO editorial_posts (id, data, fase, tag, emoji, titolo, descrizione, caption_suggerita, formato, stato, artisti_coinvolti, note) VALUES
('p08b', '2026-04-15', 2, 'artisti', '🌿', 'Spotlight — Piante e Ricami', 'Serena Colombo arricchisce la location con opere realizzate con piante e ricami. Arte che nasce dalla natura e dal gesto artigianale.', 'Quando la natura diventa arte. Piante e ricami di Serena Colombo a COINCIDENZE. #COINCIDENZE2026 #ArteBotanica #Ricamo #SerenaColumbo', 'Post Instagram quadrato', 'da_fare', '["Serena Colombo"]', 'Contenuto visivo forte. Foto delle opere nella location. Arte tessile e botanica.');
