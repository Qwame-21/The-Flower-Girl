import test from 'node:test';
import assert from 'node:assert/strict';
import { readRequestNoteField } from '../src/shared/requestNoteFields.js';

test('empty request fields do not absorb the following field key', () => {
  const notes = [
    'Recipient name: Ama Mensah',
    'recipientPhone:',
    'landmark:',
    'locationLink:',
    'budget:',
    'Delivery instructions: Call on arrival.'
  ].join('\n');

  assert.equal(readRequestNoteField(notes, 'recipient name'), 'Ama Mensah');
  assert.equal(readRequestNoteField(notes, 'recipientPhone'), '');
  assert.equal(readRequestNoteField(notes, 'landmark'), '');
  assert.equal(readRequestNoteField(notes, 'locationLink'), '');
  assert.equal(readRequestNoteField(notes, 'budget'), '');
  assert.equal(readRequestNoteField(notes, 'Delivery instructions'), 'Call on arrival.');
  assert.equal(readRequestNoteField(notes, 'missingField'), undefined);
});

test('request note field values are trimmed without changing multiline boundaries', () => {
  const notes = 'recipientPhone:  +233 20 000 0000  \nlandmark: Near the junction';
  assert.equal(readRequestNoteField(notes, 'recipient_phone'), '+233 20 000 0000');
  assert.equal(readRequestNoteField(notes, 'landmark'), 'Near the junction');
});
