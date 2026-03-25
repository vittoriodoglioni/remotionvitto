const express = require("express");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");

const app = express();
app.use(express.json({ limit: "50mb" }));

// ── Carpeta de salida ──────────────────────────────────────────────────────────
const OUTPUT_DIR = path.join(__dirname, "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Job store en memoria ───────────────────────────────────────────────────────
const jobs = {};

// ── Ruta de entrada para el bundler ───────────────────────────────────────────
const COMPOSITION_PATH = path.join(__dirname, "src", "index.js");

// ── Cachear el bundle (se construye una sola vez al iniciar) ───────────────────
let bundleLocation = null;
async function getBundle() {
  if (!bundleLocation) {
    console.log("Bundling Remotion composition...");
    bundleLocation = await bundle({
      entryPoint: COMPOSITION_PATH,
      onProgress: (p) => process.stdout.write(`  bundle: ${p}%\r`),
    });
    console.log("\nBundle ready:", bundleLocation);
  }
  return bundleLocation;
}

// ── POST /render ───────────────────────────────────────────────────────────────
// Body esperado:
// {
//   videoUrl: string,
//   duration: number,          // segundos
//   fps?: number,              // default 30
//   classifiedWords: [{ word, start, end, keyword? }],
//   musicUrl?: string,
//   brollClips?: [{ src, start, duration }],
//   includeBrolls?: boolean
// }
app.post("/render", async (req, res) => {
  const jobId = uuidv4();
  const {
    videoUrl,
    duration = 60,
    fps = 30,
    classifiedWords = [],
    musicUrl = null,
    brollClips = [],
    includeBrolls = true,
  } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "videoUrl es requerido" });
  }

  jobs[jobId] = { status: "queued", progress: 0, url: null, error: null };
  res.json({ id: jobId, status: "queued" });

  // Render en background
  setImmediate(async () => {
    try {
      jobs[jobId].status = "rendering";
      const bundlePath = await getBundle();

      const composition = await selectComposition({
        serveUrl: bundlePath,
        id: "VittorioVideo",
        inputProps: {
          videoUrl,
          classifiedWords,
          musicUrl,
          brollClips: includeBrolls ? brollClips : [],
          durationInFrames: Math.ceil(duration * fps),
        },
      });

      const outputFile = path.join(OUTPUT_DIR, `${jobId}.mp4`);

      await renderMedia({
        composition: {
          ...composition,
          durationInFrames: Math.ceil(duration * fps),
          fps,
          width: 1080,
          height: 1920,
        },
        serveUrl: bundlePath,
        codec: "h264",
        outputLocation: outputFile,
        inputProps: {
          videoUrl,
          classifiedWords,
          musicUrl,
          brollClips: includeBrolls ? brollClips : [],
          durationInFrames: Math.ceil(duration * fps),
        },
        onProgress: ({ progress }) => {
          jobs[jobId].progress = Math.round(progress * 100);
        },
        chromiumOptions: { disableWebSecurity: true },
      });

      const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
      jobs[jobId].status = "done";
      jobs[jobId].url = `${baseUrl}/output/${jobId}.mp4`;
      console.log(`Job ${jobId} completado`);
    } catch (err) {
      console.error(`Job ${jobId} falló:`, err.message);
      jobs[jobId].status = "failed";
      jobs[jobId].error = err.message;
    }
  });
});

// ── GET /render/:jobId ─────────────────────────────────────────────────────────
app.get("/render/:jobId", (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: "Job no encontrado" });
  res.json({ id: req.params.jobId, ...job });
});

// ── Servir los videos generados ────────────────────────────────────────────────
app.use("/output", express.static(OUTPUT_DIR));

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => console.log(`Remotion server corriendo en :${PORT}`));
