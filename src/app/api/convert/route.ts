import { NextRequest, NextResponse } from "next/server";
import { YamahaPPIParser } from "@/lib/yamaha/ppi-parser";
import { YamahaPPFGenerator } from "@/lib/yamaha/ppf-generator";
import { YamahaYEPGenerator } from "@/lib/yamaha/yep-generator";
import { saveJobRecord } from "@/lib/db/pg";
import { generateUUID } from "@/lib/utils";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/convert
 * ==============================================================================
 * Handles binary conversion of uploaded Yamaha PPI files
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetFormat = ((formData.get("targetFormat") as string) || "PPF").toUpperCase() as "PPF" | "YEP";

    if (!file) {
      return NextResponse.json({ error: "No file provided in form data." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const parsedData = YamahaPPIParser.parse(arrayBuffer, file.name);

    // Guard against encrypted packs
    if (parsedData.isProtected) {
      return NextResponse.json(
        {
          error: "CPI_PROTECTED",
          message: "Protected Yamaha package detected. Encrypted files require an Instrument Info (.n27) hardware key.",
          parsedData: {
            signature: parsedData.signature,
            packName: parsedData.packName,
            isProtected: true,
          },
        },
        { status: 422 }
      );
    }

    const jobId = "job_" + generateUUID();

    // Perform conversion
    let convertedBlob: Blob;
    let outputFilename: string;
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    if (targetFormat === "PPF") {
      const res = await YamahaPPFGenerator.generate(parsedData);
      convertedBlob = res.blob;
      outputFilename = `${baseName}.ppf`;
    } else {
      const res = await YamahaYEPGenerator.generate(parsedData);
      convertedBlob = res.blob;
      outputFilename = `${baseName}.yep`;
    }

    // Save job audit in database
    await saveJobRecord({
      id: jobId,
      original_filename: file.name,
      original_size_bytes: file.size,
      original_format: "PPI",
      target_format: targetFormat,
      output_filename: outputFilename,
      status: "COMPLETED",
      progress_percent: 100,
      detected_signature: parsedData.signature,
      pack_name: parsedData.packName,
      target_hardware: parsedData.targetHardware,
      voices_count: parsedData.voicesCount,
      styles_count: parsedData.stylesCount,
      waves_count: parsedData.waveCount,
    });

    const outputBuffer = await convertedBlob.arrayBuffer();

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${outputFilename}"`,
        "X-Job-Id": jobId,
        "X-Pack-Name": encodeURIComponent(parsedData.packName),
        "X-Target-Format": targetFormat,
      },
    });
  } catch (error: any) {
    console.error("Conversion error:", error);
    return NextResponse.json({ error: "CONVERSION_FAILED", message: error.message }, { status: 500 });
  }
}
