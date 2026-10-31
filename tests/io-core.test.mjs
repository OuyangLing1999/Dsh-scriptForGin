import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { buildDocxBytes, readDocxText, documentXmlToText } from '../io-core.js';

test('DOCX export round trips Chinese paragraphs and XML special characters', async () => {
  const text = '【李姐】\n一家人 <坐下来> & 好好聊聊。\n\n第一场：院门外';
  const bytes = buildDocxBytes(text);
  assert.equal(new DataView(bytes.buffer).getUint32(0, true), 0x04034b50);
  assert.equal(await readDocxText(bytes), text);
});
test('Word extraction preserves tabs and breaks, excludes style XML', () => {
  const xml = '<w:p><w:r><w:t>叔叔</w:t><w:tab/><w:t>阿姨&amp;家人</w:t><w:br/><w:t>&#x4F60;&#22909;</w:t></w:r></w:p>';
  assert.equal(documentXmlToText(xml), '叔叔\t阿姨&家人\n你好');
});
test('DOCX import rejects invalid archive and damaged body', async () => {
  await assert.rejects(readDocxText(new Uint8Array([1,2,3])), /DOCX/);
  const bytes = buildDocxBytes('可验证的正文');
  const marker = new TextEncoder().encode('可验证的正文');
  const index = Buffer.from(bytes).indexOf(Buffer.from(marker));
  bytes[index] ^= 1;
  await assert.rejects(readDocxText(bytes), /完整性/);
});
test('oversized input is rejected before parsing', async () => {
  await assert.rejects(readDocxText(new Uint8Array(20 * 1024 * 1024 + 1)), /20MB/);
});
