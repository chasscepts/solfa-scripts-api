import assert from 'node:assert/strict';

import { validateCanonicalScoreDocument } from '../src/utils/canonicalScore.js';

const beat = (id, value, text = value) => ({
  duration: '1/1',
  id,
  isAttack: text !== '—',
  text,
  value,
});
const document = () => ({
  composer: 'Composer',
  format: 'choirconnect-canonical-score',
  layout: [{
    id: 'row',
    parts: [{
      columns: [{ id: 'column', notes: [{ id: 'cell-1' }, { id: 'cell-2' }] }],
      type: 'voice',
      voice: 'soprano',
    }],
  }],
  score: {
    context: { meter: '2/4', tempo: 120, tonic: 'C' },
    parts: [{
      id: 'soprano',
      measures: [{
        id: 'column',
        slots: [
          beat('first', 'd'),
          { ...beat('second', 'd', '—'), isAttack: false },
        ],
      }],
    }],
    version: 1,
  },
  title: 'Song',
  version: 1,
});

describe('canonical score document validation', () => {
  it('accepts canonical documents with dependent HOLDs', () => {
    const input = document();

    assert.equal(validateCanonicalScoreDocument(input), input);
  });

  it('rejects an orphan HOLD', () => {
    const input = document();

    input.score.parts[0].measures[0].slots[0] = {
      ...beat('first', 'd', '—'),
      isAttack: false,
    };
    assert.throws(() => validateCanonicalScoreDocument(input), /Orphan HOLD/);
  });

  it('rejects duplicated beat IDs', () => {
    const input = document();

    input.score.parts[0].measures[0].slots[1].id = 'first';
    assert.throws(() => validateCanonicalScoreDocument(input), /unique/);
  });

  it('rejects musical content in layout cells', () => {
    const input = document();

    input.layout[0].parts[0].columns[0].notes[0].value = 'r';
    assert.throws(() => validateCanonicalScoreDocument(input), /IDs only/);
  });

  it('accepts one display column spanning two musical measures', () => {
    const input = document();

    input.score.parts[0].measures.push({
      id: 'second-measure',
      slots: [
        beat('third', 'f'),
        beat('fourth', 's'),
      ],
    });
    input.layout[0].parts[0].columns[0].notes.push(
      { id: 'cell-3' },
      { id: 'cell-4' },
    );

    assert.equal(validateCanonicalScoreDocument(input), input);
  });

  it('rejects unequal column widths for voices sharing a row', () => {
    const input = document();

    input.layout[0].parts.push({
      columns: [{ id: 'alto-column', notes: [
        { id: 'alto-cell-1' }, { id: 'alto-cell-2' },
        { id: 'alto-cell-3' }, { id: 'alto-cell-4' },
      ] }],
      type: 'voice',
      voice: 'alto',
    });
    input.score.parts.push({
      id: 'alto',
      measures: [
        { id: 'alto-first', slots: [null, null] },
        { id: 'alto-second', slots: [null, null] },
      ],
    });

    assert.throws(() => validateCanonicalScoreDocument(input), /matching column widths/);
  });

  it('rejects a layout column containing a partial measure', () => {
    const input = document();

    input.layout[0].parts[0].columns[0].notes.pop();
    assert.throws(() => validateCanonicalScoreDocument(input), /whole number of measures/);
  });

  it('accepts voices absent from a row when their measures are empty', () => {
    const input = document();

    input.layout.push({
      id: 'second-row',
      parts: [{
        columns: [{ id: 'alto-column', notes: [{ id: 'alto-cell-1' }, { id: 'alto-cell-2' }] }],
        type: 'voice',
        voice: 'alto',
      }],
    });
    input.score.parts[0].measures.push({ id: 'soprano-empty', slots: [null, null] });
    input.score.parts.push({
      id: 'alto',
      measures: [
        { id: 'alto-empty', slots: [null, null] },
        { id: 'alto-measure', slots: [beat('alto-one', 'd'), beat('alto-two', 'r')] },
      ],
    });

    assert.equal(validateCanonicalScoreDocument(input), input);
  });

  it('rejects a whole-measure layout that exceeds the score', () => {
    const input = document();

    input.layout[0].parts[0].columns[0].notes.push(
      { id: 'cell-3' },
      { id: 'cell-4' },
    );
    assert.throws(() => validateCanonicalScoreDocument(input), /widths disagree/);
  });
});
