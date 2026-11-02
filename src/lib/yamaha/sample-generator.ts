/**
 * ==============================================================================
 * SYNTHETIC SAMPLE PPI & CPI GENERATOR
 * ==============================================================================
 * Builds real binary Yamaha PPI and CPI packages in memory for instant testing
 */

export function createDemoPPIBuffer(isEncrypted = false): ArrayBuffer {
  const buffer = new ArrayBuffer(4096);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // Magic Signature
  if (isEncrypted) {
    uint8[0] = 0x43; uint8[1] = 0x50; uint8[2] = 0x49; uint8[3] = 0x20; // 'CPI '
    uint8[12] = 0x01; // Protected DRM flag
  } else {
    uint8[0] = 0x50; uint8[1] = 0x41; uint8[2] = 0x43; uint8[3] = 0x20; // 'PAC '
    uint8[12] = 0x00; // Open / Unprotected
  }

  view.setUint16(4, 2, false); // Major version 2
  view.setUint16(6, 0, false); // Minor version 0
  view.setUint32(8, 256, false); // Header length

  // Target Keyboard Model (offset 16)
  const target = "PSR-SX900 / Genos";
  const targetBytes = new TextEncoder().encode(target);
  for (let i = 0; i < targetBytes.length; i++) {
    uint8[16 + i] = targetBytes[i];
  }

  // Pack Name (offset 64)
  const title = isEncrypted ? "Yamaha_Premium_Ballad_CPI" : "Yamaha_Celtic_Expansion_Pack";
  const titleBytes = new TextEncoder().encode(title);
  for (let i = 0; i < titleBytes.length; i++) {
    uint8[64 + i] = titleBytes[i];
  }

  // Author (offset 128)
  const author = "Expansion Voice Team";
  const authorBytes = new TextEncoder().encode(author);
  for (let i = 0; i < authorBytes.length; i++) {
    uint8[128 + i] = authorBytes[i];
  }

  // Append Yamaha chunks (EMHD, INFO, VOIC, STYL, WAVE)
  let offset = 256;
  const chunks = [
    { tag: "EMHD", size: 64 },
    { tag: "INFO", size: 128 },
    { tag: "VOIC", size: 256 },
    { tag: "VOIC", size: 256 },
    { tag: "STYL", size: 512 },
    { tag: "WAVE", size: 1024 },
  ];

  for (const ch of chunks) {
    for (let c = 0; c < 4; c++) {
      uint8[offset + c] = ch.tag.charCodeAt(c);
    }
    view.setUint32(offset + 4, ch.size, false);
    offset += 8 + ch.size;
  }

  return buffer;
}
