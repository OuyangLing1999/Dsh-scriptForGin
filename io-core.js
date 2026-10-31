const utf8 = new TextEncoder();
const decode = new TextDecoder();
function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}
function joinBytes(parts) {
  const output = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}
function zipStore(entries) {
  const locals = [], central = [];
  let offset = 0;
  for (const [path, text] of entries) {
    const name = utf8.encode(path), body = utf8.encode(text), crc = crc32(body);
    const header = new Uint8Array(30), h = new DataView(header.buffer);
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true);
    h.setUint16(6, 0x800, true); h.setUint32(14, crc, true);
    h.setUint32(18, body.length, true); h.setUint32(22, body.length, true); h.setUint16(26, name.length, true);
    locals.push(header, name, body);
    const entry = new Uint8Array(46), c = new DataView(entry.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
    c.setUint16(8, 0x800, true); c.setUint32(16, crc, true);
    c.setUint32(20, body.length, true); c.setUint32(24, body.length, true);
    c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
    central.push(entry, name); offset += header.length + name.length + body.length;
  }
  const directory = joinBytes(central), end = new Uint8Array(22), e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, entries.length, true); e.setUint16(10, entries.length, true);
  e.setUint32(12, directory.length, true); e.setUint32(16, offset, true);
  return joinBytes([...locals, directory, end]);
}
function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function buildDocxBytes(text) {
  const paragraphs = String(text).split(/\r?\n/).map((line) => '<w:p><w:r><w:t xml:space="preserve">' + escapeXml(line) + '</w:t></w:r></w:p>').join('');
  return zipStore([
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/document.xml', '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + paragraphs + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>'],
  ]);
}
export function documentXmlToText(xml) {
  const decodeEntities = (text) => text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    if (entity.startsWith('#')) return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
    return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"})[entity];
  });
  return [...xml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>|<\/w:p>/g)]
    .map((m) => m[1] !== undefined ? decodeEntities(m[1]) : m[0].startsWith('<w:tab') ? '\t' : '\n').join('').replace(/\n$/, '');
}
export async function readDocxText(input, inflate) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length > 20 * 1024 * 1024) throw new Error('Word 文件超过 20MB，请缩小后导入。');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65557); at--) {
    if (view.getUint32(at, true) === 0x06054b50) { end = at; break; }
  }
  if (end < 0) throw new Error('这不是有效的 DOCX 文件。');
  const count = view.getUint16(end + 10, true);
  let pos = view.getUint32(end + 16, true);
  for (let i = 0; i < count; i++) {
    if (pos + 46 > bytes.length || view.getUint32(pos, true) !== 0x02014b50) throw new Error('Word 文件目录损坏。');
    const flags = view.getUint16(pos + 8, true), method = view.getUint16(pos + 10, true);
    const packed = view.getUint32(pos + 20, true), size = view.getUint32(pos + 24, true);
    const nameLength = view.getUint16(pos + 28, true), extra = view.getUint16(pos + 30, true), comment = view.getUint16(pos + 32, true);
    const name = decode.decode(bytes.subarray(pos + 46, pos + 46 + nameLength));
    if (name === 'word/document.xml') {
      if (flags & 1) throw new Error('请先解除 Word 文件密码保护。');
      if (size > 20 * 1024 * 1024) throw new Error('Word 正文过大。');
      const local = view.getUint32(pos + 42, true);
      if (local + 30 > bytes.length || view.getUint32(local, true) !== 0x04034b50) throw new Error('Word 文件正文损坏。');
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      if (start + packed > bytes.length) throw new Error('Word 文件正文不完整。');
      let body = bytes.subarray(start, start + packed);
      if (method === 8) {
        if (!inflate) throw new Error('浏览器暂不支持此 Word 压缩格式，请另存为 TXT。');
        body = await inflate(body);
      } else if (method !== 0) throw new Error('Word 压缩格式不受支持。');
      if (body.length !== size || crc32(body) !== view.getUint32(pos + 16, true)) throw new Error('Word 正文完整性校验失败。');
      return documentXmlToText(decode.decode(body));
    }
    pos += 46 + nameLength + extra + comment;
  }
  throw new Error('Word 文件缺少正文。');
}
