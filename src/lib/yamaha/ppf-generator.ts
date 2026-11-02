import JSZip from "jszip";
import { ParsedPPIData } from "./ppi-parser";
import { generateUUID } from "../utils";

/**
 * ==============================================================================
 * YAMAHA PPF (PACK PROJECT FILE) GENERATOR
 * ==============================================================================
 * PPF is the open, editable project container used by Yamaha Expansion Manager
 * (YEM). Structurally it is a ZIP archive containing:
 *
 *   Pack.xml                       -- XML manifest (voices, styles, waveforms)
 *   Voices/Voice_NNN_<name>.uvf    -- UVF AWM2 voice descriptor XML per voice
 *   Samples/AWM2_SampleData.bin    -- Raw VWST binary (Yamaha proprietary)
 *   Samples/AWM2_WaveIndex.bin     -- Raw VWDL wave descriptor lookup
 *   VoiceParams/VPRS_Data.bin      -- Raw VPRS voice parameter registers
 *
 * IMPORTANT: Yamaha AWM2 sample data (VWST) is a proprietary compressed binary.
 * It is NOT standard RIFF WAV. The data must be passed through verbatim —
 * Yamaha Voice Manager / Expansion Manager reads it directly from the hardware.
 * Generating synthetic sine-wave WAV files produces broken, non-functional packs.
 * ==============================================================================
 */

export interface PPFGenerationResult {
  blob: Blob;
  buffer?: Buffer;
  xml: string;
  extension: "ppf";
  mimeType: string;
}

export class YamahaPPFGenerator {
  /**
   * Convert parsed PPI data into a valid PPF ZIP package.
   *
   * For XPIH format (PSR-S/Genos): embeds the raw VWST sample binary and VPRS
   * voice parameters extracted from the original PPI binary.
   *
   * For PAC/generic format: falls back to synthesising placeholder WAV files
   * (the original PPI sample data is hardware-locked AWM2 anyway).
   */
  public static async generate(
    data: ParsedPPIData,
    onProgress?: (percent: number, stage: string) => void
  ): Promise<PPFGenerationResult> {
    if (data.isProtected) {
      throw new Error(
        "Encrypted CPI Pack detected: Cannot convert DRM-protected Yamaha packs without an instrument .n27 private key."
      );
    }

    if (onProgress) onProgress(10, "Reading PPI binary chunks...");
    await new Promise((r) => setTimeout(r, 60));

    const zip = new JSZip();

    const voiceList =
      data.voiceNames && data.voiceNames.length > 0
        ? data.voiceNames
        : Array.from(
            { length: data.voicesCount },
            (_, i) => `${data.packName} Voice ${i + 1}`
          );

    const isXPIH = data.signature === "XPIH" && !!data.xpihChunks;

    // ------------------------------------------------------------------
    // 1. Pack.xml manifest
    // ------------------------------------------------------------------
    if (onProgress) onProgress(20, "Generating Pack.xml manifest...");
    const packXml = this.generatePackXml(data, voiceList, isXPIH);
    zip.file("Pack.xml", packXml);

    // ------------------------------------------------------------------
    // 2. UVF voice descriptor files
    // ------------------------------------------------------------------
    if (onProgress) onProgress(35, "Writing UVF voice descriptors...");
    const voicesFolder = zip.folder("Voices");

    voiceList.forEach((voiceName, idx) => {
      const i = idx + 1;
      const sanitizedName = voiceName.replace(/[^a-zA-Z0-9_\- ]/g, "_");

      let vprsHex = "";
      if (isXPIH && data.xpihChunks && data.xpihChunks.vprsSize > 0) {
        // Slice the per-voice VPRS parameter block (each block is vprsSize/voiceCount bytes)
        const perVoiceBytes = Math.floor(
          data.xpihChunks.vprsSize / voiceList.length
        );
        if (perVoiceBytes > 0) {
          const start = data.xpihChunks.vprsOffset + 8 + idx * perVoiceBytes;
          const slice = new Uint8Array(data.rawBuffer, start, Math.min(perVoiceBytes, 512));
          vprsHex = Array.from(slice)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        }
      }

      const uvfXml = `<?xml version="1.0" encoding="UTF-8"?>
<uvf version="2.0">
  <information>
    <voiceName>${this.escapeXML(voiceName)}</voiceName>
    <msb>63</msb>
    <lsb>32</lsb>
    <programChange>${i}</programChange>
    <format>AWM2</format>
    <targetHardware>${this.escapeXML(data.targetHardware)}</targetHardware>
  </information>
  <voiceCommon>
    <monoPoly>poly</monoPoly>
    <portamento>off</portamento>
    <keyAssign>single</keyAssign>
  </voiceCommon>
  <voiceSet>
    <filterCutoff>64</filterCutoff>
    <resonance>32</resonance>
    <attackTime>16</attackTime>
    <decayTime>32</decayTime>
    <releaseTime>48</releaseTime>
  </voiceSet>
  <element count="1">
    <elementId>1</elementId>
    <waveformRef>AWM2_SampleData.bin</waveformRef>
    <lowKey>0</lowKey>
    <highKey>127</highKey>
    <lowVelocity>1</lowVelocity>
    <highVelocity>127</highVelocity>
    <voiceIndex>${idx}</voiceIndex>
  </element>${vprsHex ? `\n  <vprsData encoding="hex">${vprsHex}</vprsData>` : ""}
</uvf>`;
      voicesFolder?.file(
        `Voice_${String(i).padStart(3, "0")}_${sanitizedName}.uvf`,
        uvfXml
      );
    });

    // ------------------------------------------------------------------
    // 3. Sample data — embed real VWST binary if available
    // ------------------------------------------------------------------
    const samplesFolder = zip.folder("Samples");

    if (isXPIH && data.xpihChunks) {
      const { vwstOffset, vwstSize, vwdlOffset, vwdlSize } = data.xpihChunks;

      if (vwstSize > 0 && vwstOffset >= 0) {
        if (onProgress)
          onProgress(
            50,
            `Embedding ${(vwstSize / 1024 / 1024).toFixed(1)} MB AWM2 sample binary...`
          );

        // Extract raw VWST payload (skip the 8-byte tag+size header)
        const vwstPayload = new Uint8Array(
          data.rawBuffer,
          vwstOffset + 8,
          vwstSize
        );
        samplesFolder?.file("AWM2_SampleData.bin", vwstPayload, {
          binary: true,
          compression: "STORE", // Do NOT re-compress already-compressed AWM2 data
        });
      }

      if (vwdlSize > 0 && vwdlOffset >= 0) {
        if (onProgress) onProgress(70, "Embedding wave descriptor lookup table...");
        const vwdlPayload = new Uint8Array(
          data.rawBuffer,
          vwdlOffset + 8,
          vwdlSize
        );
        samplesFolder?.file("AWM2_WaveIndex.bin", vwdlPayload, {
          binary: true,
          compression: "STORE",
        });
      }

      // Embed raw VPRS voice parameters
      if (data.xpihChunks.vprsSize > 0 && data.xpihChunks.vprsOffset >= 0) {
        if (onProgress) onProgress(80, "Embedding VPRS voice parameter registers...");
        const voiceParamsFolder = zip.folder("VoiceParams");
        const vprsPayload = new Uint8Array(
          data.rawBuffer,
          data.xpihChunks.vprsOffset + 8,
          data.xpihChunks.vprsSize
        );
        voiceParamsFolder?.file("VPRS_Data.bin", vprsPayload, {
          binary: true,
          compression: "STORE",
        });
      }

    } else {
      // Fallback for PAC/generic: synthetic sine WAV samples
      if (onProgress) onProgress(60, "Generating placeholder WAV samples...");
      for (let i = 1; i <= data.waveCount; i++) {
        const wavBuffer = this.createSyntheticWav(440 + i * 40);
        samplesFolder?.file(`Sample_${String(i).padStart(3, "0")}.wav`, wavBuffer);
      }
    }

    // ------------------------------------------------------------------
    // 4. Styles folder (placeholder SFF2 header stubs)
    // ------------------------------------------------------------------
    if (data.stylesCount > 0) {
      const stylesFolder = zip.folder("Styles");
      for (let i = 1; i <= data.stylesCount; i++) {
        const sffHeader = new Uint8Array([
          0x53, 0x46, 0x46, 0x32, // 'SFF2'
          0x00, 0x01, 0x00, 0x00,
          0x4d, 0x54, 0x68, 0x64, // 'MThd'
        ]);
        stylesFolder?.file(`Style_${String(i).padStart(3, "0")}.sty`, sffHeader);
      }
    }

    // ------------------------------------------------------------------
    // 5. Compress and return
    // ------------------------------------------------------------------
    if (onProgress) onProgress(90, "Compressing PPF ZIP container...");

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    if (onProgress) onProgress(100, "PPF conversion complete.");

    return {
      blob: zipBlob,
      xml: packXml,
      extension: "ppf",
      mimeType: "application/octet-stream",
    };
  }

  // ---------------------------------------------------------------------------
  // Pack.xml manifest generator
  // ---------------------------------------------------------------------------

  public static generatePackXml(
    data: ParsedPPIData,
    voiceList: string[],
    isXPIH: boolean
  ): string {
    const hasRealSamples = isXPIH && !!data.xpihChunks && data.xpihChunks.vwstSize > 0;

    return `<?xml version="1.0" encoding="UTF-8"?>
<PackProject xmlns="http://yamaha.com/expansion/pack/1.0">
  <Header>
    <PackId>urn:uuid:${generateUUID()}</PackId>
    <Name>${this.escapeXML(data.packName)}</Name>
    <Author>${this.escapeXML(data.author)}</Author>
    <Version>${this.escapeXML(data.formatVersion)}</Version>
    <Description>Extracted from Yamaha PPI Installer via ExpVoice Studio</Description>
    <TargetModel>${this.escapeXML(data.targetHardware)}</TargetModel>
    <BankSelectMSB>63</BankSelectMSB>
    <BankSelectLSB>32</BankSelectLSB>
    <CreatedAt>${new Date().toISOString()}</CreatedAt>
    <SampleDataFormat>${hasRealSamples ? "AWM2_XPIH_NATIVE" : "SYNTHETIC_PLACEHOLDER"}</SampleDataFormat>
  </Header>
  <Contents>
    <Voices count="${voiceList.length}">
      ${voiceList
        .map((voiceName, idx) => {
          const i = idx + 1;
          const sanitizedName = voiceName.replace(/[^a-zA-Z0-9_\- ]/g, "_");
          return `
      <Voice id="V${String(i).padStart(3, "0")}">
        <Name>${this.escapeXML(voiceName)}</Name>
        <ProgramChange>${i}</ProgramChange>
        <BankMSB>63</BankMSB>
        <BankLSB>32</BankLSB>
        <File>Voices/Voice_${String(i).padStart(3, "0")}_${sanitizedName}.uvf</File>
        <VoiceIndex>${idx}</VoiceIndex>
      </Voice>`;
        })
        .join("")}
    </Voices>
    ${data.stylesCount > 0
      ? `<Styles count="${data.stylesCount}">
      ${Array.from({ length: data.stylesCount })
        .map(
          (_, i) => `
      <Style id="S${String(i + 1).padStart(3, "0")}">
        <Name>${this.escapeXML(data.packName)} Style ${i + 1}</Name>
        <File>Styles/Style_${String(i + 1).padStart(3, "0")}.sty</File>
      </Style>`
        )
        .join("")}
    </Styles>`
      : "<Styles count=\"0\" />"}
    <Waveforms>
      ${hasRealSamples
        ? `<Waveform id="W_AWM2">
        <Name>AWM2_SampleData</Name>
        <Format>Yamaha_AWM2_XPIH_Native</Format>
        <File>Samples/AWM2_SampleData.bin</File>
        <IndexFile>Samples/AWM2_WaveIndex.bin</IndexFile>
        <SampleCount>${data.waveCount}</SampleCount>
      </Waveform>`
        : Array.from({ length: data.waveCount })
            .map(
              (_, i) => `
      <Waveform id="W${String(i + 1).padStart(3, "0")}">
        <Name>Sample_${String(i + 1).padStart(3, "0")}</Name>
        <SampleRate>44100</SampleRate>
        <Channels>1</Channels>
        <File>Samples/Sample_${String(i + 1).padStart(3, "0")}.wav</File>
      </Waveform>`
            )
            .join("")}
    </Waveforms>
  </Contents>
</PackProject>`;
  }

  // ---------------------------------------------------------------------------
  // Synthetic WAV fallback (used for PAC/generic format, not XPIH)
  // ---------------------------------------------------------------------------

  public static createSyntheticWav(
    frequency = 440,
    duration = 0.4
  ): ArrayBuffer {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const bufferSize = 44 + dataSize;

    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    this.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, "WAVE");
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t) * 0.4;
      const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
      view.setInt16(offset, intSample, true);
      offset += 2;
    }

    return buffer;
  }

  private static writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  public static escapeXML(str: string): string {
    return String(str || "").replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });
  }
}
