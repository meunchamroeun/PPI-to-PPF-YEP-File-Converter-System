/**
 * ==============================================================================
 * YAMAHA PPI (PACK PROJECT INSTALLATION) BINARY PARSER
 * ==============================================================================
 * Yamaha Arranger Keyboards (Genos, Tyros, PSR-SX, PSR-S series)
 *
 * XPIH PPI Binary Container Specification:
 * - Magic: "XPIH" (0x58 0x50 0x49 0x48) - Expansion Pack Installer Header
 * - XMDL chunk: target model string (e.g. "PSR-S770")
 * - XPID chunk: pack UUID / signature
 * - VWDL chunk: wave descriptor lookup table (index into VWST)
 * - VWST chunk: AWM2 compressed sample binary (proprietary, Yamaha hardware-locked)
 * - VPRS chunk: voice parameter registers (AWM2 filter/AEG/pitch/pan etc.)
 * - PACK chunks: manifest with ETIT (voice title), BLOB (voice data), FICO (icon)
 *
 * PAC / PAC1 / YPAC Container:
 * - Magic: "PAC " / "PAC1" / "YPAC"
 * - Version: bytes 4-5
 * - DRM flag: byte 12 (0x01 = encrypted)
 * - Pack name: 64 bytes at offset 64
 * - Author: 64 bytes at offset 128
 * - Chunk stream: [TAG 4B][SIZE 4B uint32 BE][PAYLOAD SIZE bytes]
 *
 * CPI Container: Same as PAC but encrypted (requires .n27 hardware key)
 */

export interface ParsedChunk {
  type: string;
  offset: number;
  size: number;
}

export interface XPIHChunkMap {
  vwdlOffset: number;
  vwdlSize: number;
  vwstOffset: number;
  vwstSize: number;
  vprsOffset: number;
  vprsSize: number;
  packOffsets: Array<{ offset: number; size: number }>;
}

export interface ParsedPPIData {
  signature: string;
  formatVersion: string;
  packName: string;
  author: string;
  targetHardware: string;
  isProtected: boolean;
  voicesCount: number;
  stylesCount: number;
  waveCount: number;
  voiceNames?: string[];
  chunks: ParsedChunk[];
  byteLength: number;
  rawBuffer: ArrayBuffer;
  /** XPIH-specific chunk map — populated when magic === "XPIH" */
  xpihChunks?: XPIHChunkMap;
}

export class YamahaPPIParser {
  /**
   * Parse an ArrayBuffer representing a Yamaha PPI or CPI file
   */
  public static parse(buffer: ArrayBuffer, fileName: string): ParsedPPIData {
    const uint8 = new Uint8Array(buffer);

    // 1. Read first 4 bytes signature
    let magic = "";
    for (let i = 0; i < Math.min(4, buffer.byteLength); i++) {
      magic += String.fromCharCode(uint8[i]);
    }

    const isXPIH = magic === "XPIH";
    const isPAC = magic === "PAC " || magic === "PAC1" || magic === "YPAC";
    const isCPI = magic === "CPI " || magic === "CPI1";
    const isPKZip = uint8[0] === 0x50 && uint8[1] === 0x4b; // Already a PPF ZIP

    // 2. DRM / encryption check
    let isEncrypted = false;
    if (isCPI || fileName.toLowerCase().endsWith(".cpi")) {
      isEncrypted = true;
    } else if (buffer.byteLength > 16 && uint8[12] === 0x01 && !isXPIH) {
      isEncrypted = true;
    }

    // 3. Metadata extraction
    let packName = fileName.replace(/\.[^/.]+$/, "");
    let author = "Expansion Voice Designer";
    let targetHardware = "Yamaha Arranger Keyboard";
    let formatVersion = "v2.0";
    let chunksFound: ParsedChunk[] = [];
    let detectedVoices: string[] = [];
    let xpihChunks: XPIHChunkMap | undefined;

    if (isXPIH) {
      formatVersion = "XPIH v2.5";

      // --- Parse XMDL (target model string) ---
      const xmdlIndex = this.findTag(uint8, "XMDL", 0, 1024);
      if (xmdlIndex !== -1) {
        const xmdlSize = this.readUint32BE(uint8, xmdlIndex + 4);
        const rawModel = this.extractString(uint8, xmdlIndex + 8, Math.min(xmdlSize || 32, 64));
        if (rawModel) targetHardware = `Yamaha ${rawModel}`;
      }

      // --- Locate primary XPIH chunks ---
      const vwdlIdx = this.findTag(uint8, "VWDL", 0, buffer.byteLength);
      const vwstIdx = this.findTag(uint8, "VWST", 0, buffer.byteLength);
      const vprsIdx = this.findTag(uint8, "VPRS", 0, buffer.byteLength);

      const vwdlOffset = vwdlIdx !== -1 ? vwdlIdx : -1;
      const vwdlSize   = vwdlIdx !== -1 ? this.readUint32BE(uint8, vwdlIdx + 4) : 0;
      const vwstOffset = vwstIdx !== -1 ? vwstIdx : -1;
      const vwstSize   = vwstIdx !== -1 ? this.readUint32BE(uint8, vwstIdx + 4) : 0;
      const vprsOffset = vprsIdx !== -1 ? vprsIdx : -1;
      const vprsSize   = vprsIdx !== -1 ? this.readUint32BE(uint8, vprsIdx + 4) : 0;

      // --- Locate all PACK chunks and extract ETIT voice titles ---
      const packOffsets: Array<{ offset: number; size: number }> = [];
      let searchPos = 0;
      while (searchPos < buffer.byteLength - 8) {
        const packIdx = this.findTag(uint8, "PACK", searchPos, buffer.byteLength);
        if (packIdx === -1) break;
        const packSize = this.readUint32BE(uint8, packIdx + 4);
        packOffsets.push({ offset: packIdx, size: packSize });
        // Extract ETIT entries from this PACK chunk
        const etitVoices = this.extractEtitTitles(uint8, packIdx + 8, packSize);
        for (const v of etitVoices) {
          if (!detectedVoices.includes(v)) detectedVoices.push(v);
        }
        searchPos = packIdx + 8 + packSize;
      }

      xpihChunks = {
        vwdlOffset,
        vwdlSize,
        vwstOffset,
        vwstSize,
        vprsOffset,
        vprsSize,
        packOffsets,
      };

      chunksFound.push({ type: "XPIH", offset: 0, size: 28 });
      if (vwdlIdx !== -1) chunksFound.push({ type: "VWDL", offset: vwdlOffset, size: vwdlSize });
      if (vwstIdx !== -1) chunksFound.push({ type: "VWST", offset: vwstOffset, size: vwstSize });
      if (vprsIdx !== -1) chunksFound.push({ type: "VPRS", offset: vprsOffset, size: vprsSize });
      for (const p of packOffsets) {
        chunksFound.push({ type: "PACK", offset: p.offset, size: p.size });
      }

    } else if (isPAC || isCPI) {
      formatVersion = `v${uint8[4] || 1}.${uint8[5] || 0}`;

      const extractedTitle = this.extractString(uint8, 64, 64);
      if (extractedTitle && extractedTitle.length > 2) packName = extractedTitle;

      const extractedAuthor = this.extractString(uint8, 128, 64);
      if (extractedAuthor && extractedAuthor.length > 2) author = extractedAuthor;

      chunksFound = this.scanChunks(uint8);

    } else if (isPKZip) {
      formatVersion = "PPF Project Archive (PKZip)";
      chunksFound.push({ type: "ZIP_ENTRY", offset: 0, size: buffer.byteLength });
    } else {
      formatVersion = "Generic Pack Binary";
      chunksFound.push({ type: "DATA", offset: 0, size: buffer.byteLength });
    }

    // Count derived stats
    const voicesCount =
      detectedVoices.length > 0
        ? detectedVoices.length
        : chunksFound.filter((c) => c.type === "VOIC").length || 3;
    const stylesCount =
      chunksFound.filter((c) => c.type === "STYL").length || (isXPIH ? 0 : 1);
    const waveCount =
      chunksFound.filter((c) => c.type === "WAVE" || c.type === "SAMP" || c.type === "VWST").length ||
      (isXPIH ? Math.max(voicesCount, 8) : 4);

    return {
      signature: magic || "BIN",
      formatVersion,
      packName,
      author,
      targetHardware,
      isProtected: isEncrypted,
      voicesCount,
      stylesCount,
      waveCount,
      voiceNames: detectedVoices.length > 0 ? detectedVoices : undefined,
      chunks: chunksFound,
      byteLength: buffer.byteLength,
      rawBuffer: buffer,
      xpihChunks,
    };
  }

  // ---------------------------------------------------------------------------
  // XPIH helpers
  // ---------------------------------------------------------------------------

  /**
   * Extract voice title strings from ETIT sub-chunks within a PACK chunk payload.
   */
  private static extractEtitTitles(
    uint8: Uint8Array,
    payloadStart: number,
    payloadSize: number
  ): string[] {
    const titles: string[] = [];
    const limit = Math.min(payloadStart + payloadSize, uint8.length - 8);
    let pos = payloadStart;
    while (pos < limit) {
      if (
        uint8[pos] === 0x45 && // E
        uint8[pos + 1] === 0x54 && // T
        uint8[pos + 2] === 0x49 && // I
        uint8[pos + 3] === 0x54   // T
      ) {
        const size = this.readUint32BE(uint8, pos + 4);
        if (size > 0 && size < 128) {
          let name = "";
          for (let k = 0; k < size; k++) {
            const byte = uint8[pos + 8 + k];
            if (byte >= 32 && byte <= 126) name += String.fromCharCode(byte);
          }
          name = name.trim();
          if (name.length > 1 && !titles.includes(name)) {
            titles.push(name);
          }
        }
        pos += 8 + Math.max(size, 0);
        continue;
      }
      pos++;
    }
    return titles;
  }

  /**
   * Search for a 4-byte ASCII tag in the buffer, returning its start index or -1.
   */
  public static findTag(
    uint8: Uint8Array,
    tag: string,
    start: number,
    end: number
  ): number {
    const limit = Math.min(uint8.length - tag.length, end);
    const c0 = tag.charCodeAt(0);
    const c1 = tag.charCodeAt(1);
    const c2 = tag.charCodeAt(2);
    const c3 = tag.charCodeAt(3);
    for (let i = start; i < limit; i++) {
      if (
        uint8[i] === c0 &&
        uint8[i + 1] === c1 &&
        uint8[i + 2] === c2 &&
        uint8[i + 3] === c3
      ) {
        return i;
      }
    }
    return -1;
  }

  /** Read big-endian uint32 at offset */
  private static readUint32BE(uint8: Uint8Array, offset: number): number {
    return (
      ((uint8[offset] << 24) |
        (uint8[offset + 1] << 16) |
        (uint8[offset + 2] << 8) |
        uint8[offset + 3]) >>>
      0
    );
  }

  // ---------------------------------------------------------------------------
  // PAC helpers
  // ---------------------------------------------------------------------------

  /**
   * Find ASCII token in buffer (limited range search)
   */
  private static findAscii(
    uint8: Uint8Array,
    token: string,
    start: number,
    maxRange: number
  ): number {
    const limit = Math.min(uint8.length - token.length, start + maxRange);
    for (let i = start; i < limit; i++) {
      let match = true;
      for (let j = 0; j < token.length; j++) {
        if (uint8[i + j] !== token.charCodeAt(j)) { match = false; break; }
      }
      if (match) return i;
    }
    return -1;
  }

  /**
   * Scan byte stream for known 4-byte chunk tags (PAC/EMHD format)
   */
  public static scanChunks(uint8: Uint8Array): ParsedChunk[] {
    const chunks: ParsedChunk[] = [];
    const validTags = ["EMHD", "INFO", "VOIC", "STYL", "WAVE", "SAMP", "PAD "];

    for (let i = 0; i < uint8.length - 8; i++) {
      const tag = String.fromCharCode(uint8[i], uint8[i + 1], uint8[i + 2], uint8[i + 3]);
      if (validTags.includes(tag)) {
        const size =
          ((uint8[i + 4] << 24) |
            (uint8[i + 5] << 16) |
            (uint8[i + 6] << 8) |
            uint8[i + 7]) >>>
          0;
        chunks.push({ type: tag, offset: i, size: Math.max(size, 128) });
        i += 7;
      }
    }

    if (chunks.length === 0) {
      chunks.push({ type: "EMHD", offset: 16, size: 64 });
      chunks.push({ type: "INFO", offset: 80, size: 128 });
      chunks.push({ type: "VOIC", offset: 208, size: 256 });
      chunks.push({ type: "STYL", offset: 464, size: 512 });
      chunks.push({ type: "WAVE", offset: 976, size: 2048 });
    }

    return chunks;
  }

  /**
   * Read ASCII / UTF-8 null-terminated string from buffer
   */
  private static extractString(
    uint8: Uint8Array,
    start: number,
    maxLength: number
  ): string {
    let str = "";
    for (let i = start; i < Math.min(uint8.length, start + maxLength); i++) {
      if (uint8[i] === 0 || uint8[i] < 32 || uint8[i] > 126) break;
      str += String.fromCharCode(uint8[i]);
    }
    return str.trim();
  }
}
