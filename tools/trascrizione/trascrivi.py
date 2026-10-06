"""Trascrizione delle riunioni in locale: Whisper (mlx, Apple Silicon) + riconoscimento dei parlanti (pyannote).

L'audio non esce dal Mac. Ambiente Python separato (fuori dal repo):
    ~/.local/bin/uv venv ~/.venvs/coincidenze-trascrizione --python 3.11
    ~/.local/bin/uv pip install --python ~/.venvs/coincidenze-trascrizione/bin/python \
        mlx-whisper "pyannote.audio>=3.3,<4" "torch==2.8.*" "torchaudio==2.8.*" "huggingface_hub<0.26"

(pyannote 3 passa ancora use_auth_token, che huggingface_hub dalla 1.0 non accetta più;
torchaudio dalla 2.9 non ha più AudioMetaData.)

Per separare le voci serve un token Hugging Face (account gratuito, termini accettati su
pyannote/speaker-diarization-3.1 e pyannote/segmentation-3.0) salvato in ~/.config/coincidenze/hf_token.
Senza token si ottiene solo il testo, senza parlanti.

Uso:
    ~/.venvs/coincidenze-trascrizione/bin/python tools/trascrizione/trascrivi.py AUDIO [AUDIO ...] --out CARTELLA [--speakers 3]

Più file (es. una riunione registrata in due parti) vengono uniti nell'ordine dato: i parlanti
restano coerenti su tutta la riunione e i tempi partono dall'inizio della prima parte.

Ogni passo salva il suo risultato nella cartella e viene saltato se c'è già:
    audio.wav (16 kHz mono) → whisper.json → diarization.json → trascrizione.md
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

MODEL = 'mlx-community/whisper-large-v3-turbo'
TOKEN_FILE = Path.home() / '.config' / 'coincidenze' / 'hf_token'
PROMPT = ('Riunione organizzativa di COINCIDENZE a Marsam Locanda, Bene Vagienna. '
          'Spuntino delle 18, accrediti, programma, artisti, Ancreus, Marziani, Rocky, Starlink, Tyvek, Instagram.')


def ts(seconds: float) -> str:
    s = int(seconds)
    return f'{s // 3600:02d}:{s % 3600 // 60:02d}:{s % 60:02d}'


def to_wav(audios: list[Path], out: Path) -> Path:
    wav = out / 'audio.wav'
    if not wav.exists():
        inputs = [a for audio in audios for a in ('-i', str(audio))]
        concat = ''.join(f'[{i}:a]' for i in range(len(audios))) + f'concat=n={len(audios)}:v=0:a=1[a]'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', concat, '-map', '[a]',
                        '-ac', '1', '-ar', '16000', str(wav)], check=True)
    return wav


def transcribe(wav: Path, out: Path, prompt: str) -> list[dict]:
    path = out / 'whisper.json'
    if not path.exists():
        import mlx_whisper
        result = mlx_whisper.transcribe(str(wav), path_or_hf_repo=MODEL, language='it', word_timestamps=True,
                                        initial_prompt=prompt, condition_on_previous_text=False, verbose=False)
        path.write_text(json.dumps(result['segments'], ensure_ascii=False))
    return json.loads(path.read_text())


def diarize(wav: Path, out: Path, speakers: int | None) -> list[dict] | None:
    path = out / 'diarization.json'
    if path.exists():
        return json.loads(path.read_text())
    if not TOKEN_FILE.exists():
        print(f'Nessun token in {TOKEN_FILE}: trascrizione senza parlanti.', file=sys.stderr)
        return None
    import torch
    from pyannote.audio import Pipeline
    from pyannote.audio.core.task import Problem, Resolution, Specifications
    # torch dalla 2.6 carica i checkpoint solo con i tipi ammessi: quelli dei modelli pyannote
    torch.serialization.add_safe_globals([torch.torch_version.TorchVersion, Specifications, Problem, Resolution])
    pipeline = Pipeline.from_pretrained('pyannote/speaker-diarization-3.1', use_auth_token=TOKEN_FILE.read_text().strip())
    if torch.backends.mps.is_available():
        pipeline.to(torch.device('mps'))
    kwargs = {'num_speakers': speakers} if speakers else {}
    annotation = pipeline(str(wav), **kwargs)
    turns = [{'start': t.start, 'end': t.end, 'speaker': spk} for t, _, spk in annotation.itertracks(yield_label=True)]
    path.write_text(json.dumps(turns))
    return turns


def speaker_at(turns: list[dict], start: float, end: float) -> str:
    """Parlante con la maggiore sovrapposizione sull'intervallo (parola o frase)."""
    best, best_overlap = '?', 0.0
    for t in turns:
        overlap = min(end, t['end']) - max(start, t['start'])
        if overlap > best_overlap:
            best, best_overlap = t['speaker'], overlap
    if best == '?':  # nessuna sovrapposizione: il turno più vicino
        mid = (start + end) / 2
        best = min(turns, key=lambda t: min(abs(mid - t['start']), abs(mid - t['end'])))['speaker']
    return best


def merge(segments: list[dict], turns: list[dict] | None) -> list[dict]:
    """Blocchi consecutivi dello stesso parlante; con le parole, si spezza anche dentro una frase."""
    blocks: list[dict] = []
    for seg in segments:
        words = seg.get('words') or [{'word': seg['text'], 'start': seg['start'], 'end': seg['end']}]
        for w in words:
            spk = speaker_at(turns, w['start'], w['end']) if turns else ''
            if blocks and blocks[-1]['speaker'] == spk and w['start'] - blocks[-1]['end'] < 2.5:
                blocks[-1]['text'] += w['word']
                blocks[-1]['end'] = w['end']
            else:
                blocks.append({'speaker': spk, 'start': w['start'], 'end': w['end'], 'text': w['word']})
    return blocks


def smooth(blocks: list[dict], max_words: int = 3) -> list[dict]:
    """Un frammento di poche parole in mezzo a due blocchi dello stesso parlante è quasi sempre
    un errore di attribuzione a metà frase: lo riunisce ai vicini."""
    out: list[dict] = []
    i = 0
    while i < len(blocks):
        b = dict(blocks[i])
        nxt = blocks[i + 1] if i + 1 < len(blocks) else None
        if (out and nxt and len(b['text'].split()) <= max_words and b['speaker'] != out[-1]['speaker']
                and nxt['speaker'] == out[-1]['speaker'] and nxt['start'] - out[-1]['end'] < 5):
            out[-1]['text'] += b['text'] + nxt['text']
            out[-1]['end'] = nxt['end']
            i += 2
            continue
        if out and b['speaker'] == out[-1]['speaker'] and b['start'] - out[-1]['end'] < 10:
            out[-1]['text'] += b['text']
            out[-1]['end'] = b['end']
        else:
            out.append(b)
        i += 1
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description='Trascrizione locale di una riunione')
    ap.add_argument('audio', type=Path, nargs='+', help='uno o più file, nell\'ordine della riunione')
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--speakers', type=int, default=None, help='numero di persone, se noto')
    ap.add_argument('--prompt', default=PROMPT, help='nomi e termini da suggerire a Whisper')
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    wav = to_wav(args.audio, args.out)
    segments = transcribe(wav, args.out, args.prompt)
    turns = diarize(wav, args.out, args.speakers)
    blocks = merge(segments, turns)
    if turns:
        blocks = smooth(smooth(blocks))

    lines = []
    for b in blocks:
        text = b['text'].strip()
        if not text:
            continue
        who = f"**{b['speaker']}** " if b['speaker'] else ''
        lines.append(f"{who}[{ts(b['start'])}] {text}")
    (args.out / 'trascrizione.md').write_text('\n\n'.join(lines) + '\n')
    speakers = sorted({b['speaker'] for b in blocks if b['speaker']})
    print(f"Fatto: {len(lines)} blocchi, parlanti: {', '.join(speakers) or 'non separati'} → {args.out / 'trascrizione.md'}")


if __name__ == '__main__':
    main()
