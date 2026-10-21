const DURATION = {
  '1/1': 12,
  '1/2': 6,
  '1/3': 4,
  '1/4': 3,
  '3/4': 9,
};
const PITCHES = new Set(['d', 'de', 'r', 'ma', 'm', 'f', 'fe', 's', 'se', 'l', 'ta', 't']);
const VOICES = new Set(['soprano', 'alto', 'tenor', 'bass']);
const REST = '𝄽';
const HOLD = '—';

export const VERSION = 1;
export const SCORE_VERSIONS = [VERSION];
export const CANONICAL_SCORE_FORMAT = 'choirconnect-canonical-score';
export const SCORE_FORMATS = [CANONICAL_SCORE_FORMAT];

const invalid = (message) => {
  throw new Error('Invalid canonical score: ' + message);
};
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const assert = (condition, message) => {
  if (!condition) invalid(message);
};
const nonempty = (value) => typeof value === 'string' && value.length > 0 && value.length <= 100;

const inspectBeat = (beat, ids, previous, voice) => {
  assert(object(beat) && nonempty(beat.id) && !ids.has(beat.id), 'Beat IDs must be unique.');
  ids.add(beat.id);
  assert(Object.hasOwn(DURATION, beat.duration), 'Unsupported beat duration.');
  const hold = beat.text === HOLD || beat.value === HOLD;
  const rest = beat.value === REST;

  if (hold) {
    assert(previous !== null && !rest, 'Orphan HOLD in ' + voice + '.');
    assert(beat.isAttack !== true, 'A HOLD cannot be an attack.');
  } else if (rest) {
    assert(beat.isAttack !== true, 'A REST cannot be an attack.');
  } else {
    assert(PITCHES.has(beat.value) && beat.isAttack !== false, 'Invalid note attack.');
  }
  if (beat.octaveShift !== undefined) {
    assert(Number.isInteger(beat.octaveShift) &&
      beat.octaveShift >= -2 && beat.octaveShift <= 2, 'Invalid octave shift.');
  }

  return {
    duration: DURATION[beat.duration],
    previous: rest ? null : hold ? previous : beat.value,
  };
};

export const validateCanonicalScoreDocument = (document) => {
  assert(object(document), 'Expected an object.');
  assert(document.format === CANONICAL_SCORE_FORMAT && document.version === VERSION,
    'Unsupported format or version.');
  assert(Array.isArray(document.layout), 'Layout must be an array.');
  assert(object(document.score) && object(document.score.context) &&
    Array.isArray(document.score.parts), 'Missing score parts or context.');
  const { context, parts } = document.score;
  const meter = String(context.meter || '').match(/^(\d+)\/(\d+)$/);

  assert(meter && Number(meter[1]) > 0 && Number(meter[2]) > 0,
    'Unsupported meter.');
  assert(Number.isFinite(context.tempo) && context.tempo > 0,
    'Tempo must be positive.');
  assert(typeof context.tonic === 'string' && context.tonic.length > 0,
    'Tonic is required.');
  assert(parts.length <= 4 && parts.length > 0, 'Expected one to four voice parts.');
  const ids = new Set();
  const voices = new Set();
  const counts = new Set();

  for (const part of parts) {
    assert(object(part) && VOICES.has(part.id) && !voices.has(part.id),
      'Duplicate or unknown voice.');
    voices.add(part.id);
    assert(Array.isArray(part.measures), 'Voice measures must be an array.');
    counts.add(part.measures.length);
    let previous = null;

    for (const measure of part.measures) {
      assert(object(measure) && Array.isArray(measure.slots),
        'Measure slots must be an array.');
      let measureDuration = 0;

      for (const slot of measure.slots) {
        if (slot === null) {
          measureDuration += 12;
          previous = null;
          continue;
        }

        const beats = Array.isArray(slot?.beats) ? slot.beats : [slot];

        assert(beats.length > 0 && beats.length <= 32, 'Invalid beat group.');
        let total = 0;

        for (const beat of beats) {
          const inspected = inspectBeat(beat, ids, previous, part.id);
          total += inspected.duration;
          previous = inspected.previous;
        }
        assert(total === 12, 'A score slot must total one beat.');
        measureDuration += total;
      }

      assert(measureDuration === Number(meter[1]) * 12,
        'Measure duration does not match meter.');
    }
  }
  assert(counts.size <= 1, 'All voices must have the same measure count.');

  const cursors = new Map([...voices].map((voice) => [voice, 0]));

  for (const row of document.layout) {
    assert(object(row) && Array.isArray(row.parts), 'Invalid layout row.');

    const presentVoices = new Set(row.parts
      .filter((part) => part.type === 'voice')
      .map((part) => part.voice));
    const representative = row.parts.find((part) => part.type === 'voice');
    const beatsPerMeasure = Number(meter[1]);
    const rowSpan = representative?.columns.reduce((count, column) => {
      assert(Array.isArray(column.notes) && column.notes.length > 0 &&
        column.notes.length % beatsPerMeasure === 0,
      'Layout column width must be a whole number of measures.');

      return count + column.notes.length / beatsPerMeasure;
    }, 0) || 0;

    for (const part of row.parts) {
      assert(object(part), 'Invalid layout part.');
      if (part.type !== 'voice') continue;

      assert(voices.has(part.voice) && Array.isArray(part.columns),
        'Layout references an unknown voice.');
      assert(part.columns.length === (representative?.columns.length || 0) &&
        part.columns.every((column, index) =>
          Array.isArray(column.notes) &&
          column.notes.length === representative.columns[index].notes.length),
      'Voices in the same row must have matching column widths.');
      const scorePart = parts.find((item) => item.id === part.voice);

      const beatsPerMeasure = Number(meter[1]);

      for (const column of part.columns) {
        assert(Array.isArray(column.notes) && column.notes.length > 0 &&
          column.notes.length % beatsPerMeasure === 0,
        'Layout column width must be a whole number of measures.');
        const span = column.notes.length / beatsPerMeasure;
        const start = cursors.get(part.voice);
        const measures = scorePart.measures.slice(start, start + span);

        assert(measures.length === span &&
          measures.every((measure) => measure.slots.length === beatsPerMeasure),
        'Layout and score widths disagree.');
        assert(column.notes.every((cell) => object(cell) && nonempty(cell.id) &&
          Object.keys(cell).every((key) => key === 'id')),
        'Layout cells must contain IDs only.');
        cursors.set(part.voice, start + span);
      }
    }

    for (const part of parts) {
      if (presentVoices.has(part.id)) continue;

      const start = cursors.get(part.id);
      const absent = part.measures.slice(start, start + rowSpan);

      assert(absent.length === rowSpan && absent.every((measure) =>
        measure.slots.length === beatsPerMeasure &&
        measure.slots.every((slot) => slot === null)),
      'Absent layout voices must contain empty measures.');
      cursors.set(part.id, start + rowSpan);
    }
  }

  for (const part of parts) {
    assert(cursors.get(part.id) === part.measures.length,
      'Layout does not cover every voice measure.');
  }

  return document;
};
