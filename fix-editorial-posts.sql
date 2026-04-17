-- FIX: accenti, emdash, punti medi, orario 10:30

-- p01
UPDATE editorial_posts SET
  titolo = 'Reveal - Edizione 1',
  caption_suggerita = 'Si torna. Sabato 25 aprile. Marsam Locanda, Bene Vagienna. COINCIDENZE - raffinate casualità, occhi attenti. Edizione 1. #COINCIDENZE2026'
WHERE id = 'p01';

-- p02
UPDATE editorial_posts SET
  caption_suggerita = 'raffinate casualità, occhi attenti. #COINCIDENZE2026 #RaffinateCasualita'
WHERE id = 'p02';

-- p03
UPDATE editorial_posts SET
  titolo = 'Il luogo - Marsam Locanda'
WHERE id = 'p03';

-- p04
UPDATE editorial_posts SET
  titolo = 'Spotlight - Fotografia',
  caption_suggerita = 'Sei sguardi sul mondo. Una mostra. Luca Fumero, Marco Salzotto, Mauro Curti, Owen Zaccagnino, Paolo Sicca, Tazio Secchiaroli. Con opere dalla collezione Alfonso Zorzo. Mostra fotografica 10:30-20:00, Galleria. #COINCIDENZE2026 #Fotografia',
  note = 'Una slide per fotografo con foto e nome. Collab post con @iamluchino e @maurocurti_. Marco Salzotto è anche lo chef di Marsam Locanda.'
WHERE id = 'p04';

-- p05
UPDATE editorial_posts SET
  titolo = 'Spotlight - Scultura e Pittura',
  caption_suggerita = 'La materia prende forma. Sculture nel giardino, pittura in sala. CRUX, Franco Sebastiano Alessandria, Marco Fiaschi. 10:30-20:00. #COINCIDENZE2026 #Scultura #Pittura #Arte'
WHERE id = 'p05';

-- p06
UPDATE editorial_posts SET
  titolo = 'Spotlight - Ancreus Live',
  caption_suggerita = 'Tre voci. Due chitarre. Un''unica emozione. Ancreus live a COINCIDENZE. Ore 11:00 e 16:00, Sala Superiore. Alberto Calandri, Diego Cavallero, Giorgia Bruno. #COINCIDENZE2026 #LiveMusic'
WHERE id = 'p06';

-- p07
UPDATE editorial_posts SET
  titolo = 'Spotlight - Cucina e Vino',
  descrizione = 'La cucina di Marco Salzotto (anche fotografo in mostra!) e la degustazione vini curata da Silvio Altare. Il food content performa bene.',
  caption_suggerita = 'Un tavolo apparecchiato tutto il giorno. La cucina di Marco Salzotto. I vini selezionati da Silvio Altare. Ristorante, Giardino e Portico, 10:30-20:00. #COINCIDENZE2026 #VinoECucina #MarsamLocanda',
  note = 'Il food content ha il miglior engagement storico. Collab @marsamlocanda. Reel food consigliato. Marco è sia chef che fotografo.'
WHERE id = 'p07';

-- p08
UPDATE editorial_posts SET
  titolo = 'Spotlight - Michele Marziani',
  caption_suggerita = 'Parole che aprono mondi. Michele Marziani presenta due libri a COINCIDENZE. 11:30 Lo Sciamano delle Alpi, 15:00 La cura dello stupore. Orto Romano. Conduce @sammiworld. #COINCIDENZE2026 #Libri #MicheleMarziani'
WHERE id = 'p08';

-- p08b
UPDATE editorial_posts SET
  titolo = 'Spotlight - Piante e Ricami',
  caption_suggerita = 'Quando la natura diventa arte. Piante e ricami di Serena Colombo a COINCIDENZE. #COINCIDENZE2026 #ArteBotanica #Ricamo #SerenaColombo'
WHERE id = 'p08b';

-- p09
UPDATE editorial_posts SET
  titolo = 'Spotlight - Sciamanesimo e Tarocchi',
  caption_suggerita = 'Viaggi sciamanici e letture dei tarocchi nel giardino. Due esperienze da vivere. Petra Lindblom, Delfina Testa. #COINCIDENZE2026 #Sciamanesimo #Tarocchi',
  note = 'Tono misterioso e intrigante. Due novità Ed.1. Suggestioni fisiche e metafisiche.'
WHERE id = 'p09';

-- p10
UPDATE editorial_posts SET
  titolo = 'Spotlight - Cinema e Video',
  caption_suggerita = 'Due visioni. Pietro Fantone, ospite alla Berlinale, porta la sua arte video AI. Cristina Saimandi racconta il viaggio dal Saviglianese al Monviso in A Passo Lento. Proiezioni, Sala Superiore. #COINCIDENZE2026 #Cinema #VideoAI #APassoLento',
  note = 'Collab @cristinasaimandiartist. Pietro Fantone: ospite Berlinale, pluripremiato. Se c''è un trailer, usare come Reel.'
WHERE id = 'p10';

-- p11
UPDATE editorial_posts SET
  caption_suggerita = 'Una giornata intera da vivere. 10:30 Mostre aperte, 11:00 Ancreus Live, 11:30 Michele Marziani, 12:00 Tarocchi, 13:00 AI e Video, 14:00 Petra Lindblom, 15:00 La cura dello stupore, 16:00 Ancreus Live 2, 17:00 A Passo Lento. 25 aprile, Marsam Locanda. #COINCIDENZE2026'
WHERE id = 'p11';

-- p13
UPDATE editorial_posts SET
  caption_suggerita = 'Un anno fa. Tanta bellezza. Sabato si torna. COINCIDENZE, Edizione 1. #COINCIDENZE2026'
WHERE id = 'p13';

-- p14
UPDATE editorial_posts SET
  titolo = 'Behind the scenes - Preparativi'
WHERE id = 'p14';

-- p15
UPDATE editorial_posts SET
  note = 'CRITICO: i post di Samantha hanno 10-20x più reach. Concordare caption con lei.'
WHERE id = 'p15';

-- p16
UPDATE editorial_posts SET
  caption_suggerita = 'Domani ci vediamo a Bene Vagienna. Marsam Locanda, dalle 10:30. Porta qualcuno con te. COINCIDENZE, raffinate casualità, occhi attenti. #COINCIDENZE2026',
  note = 'Tono personale. Come scrivere a un amico, non fare pubblicità.'
WHERE id = 'p16';

-- p17
UPDATE editorial_posts SET
  caption_suggerita = 'È oggi. COINCIDENZE, Edizione 1. Marsam Locanda, Bene Vagienna, dalle 10:30. Ci vediamo lì. #COINCIDENZE2026'
WHERE id = 'p17';

-- p18
UPDATE editorial_posts SET
  caption_suggerita = 'Grazie. COINCIDENZE, Edizione 1. #COINCIDENZE2026',
  note = 'Tag tutti: artisti, partner, venue. Come il reel dell''Ed.0 ma più curato.'
WHERE id = 'p18';

-- p19
UPDATE editorial_posts SET
  titolo = 'Gallery - I momenti migliori',
  caption_suggerita = 'Momenti. COINCIDENZE, Edizione 1. #COINCIDENZE2026'
WHERE id = 'p19';

-- p20
UPDATE editorial_posts SET
  caption_suggerita = 'COINCIDENZE, Edizione 1, Il film. #COINCIDENZE2026'
WHERE id = 'p20';
