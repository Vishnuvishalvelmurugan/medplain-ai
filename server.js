require("dotenv").config();
const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

app.use(express.static(path.join(__dirname, "public")));
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) return cb(new Error("Please upload a PDF, PNG, JPG, or WEBP file."));
    cb(null, true);
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, configured: Boolean(process.env.OPENAI_API_KEY) }));

app.post("/api/explain", upload.single("report"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI is not configured yet. Add your OpenAI API key to the .env file, then restart the server." });
    }
    if (!req.file) return res.status(400).json({ error: "Choose a medical report file first." });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const file = req.file;
    const isPdf = file.mimetype === "application/pdf";
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    const content = [
      {
        type: "input_text",
        text: `Explain this medical/laboratory report in plain, calm, easy-to-understand English.
Important safety rules:
- This is educational explanation, not diagnosis or a substitute for a licensed clinician.
- Only report values and details that are legible and actually present. Never guess unreadable values.
- When discussing a result, preserve the exact value, unit, and the lab's own reference range when visible.
- Do not call a result normal/abnormal if the reference range or context is missing; say it cannot be determined from the file.
- Reference ranges vary by lab, age, sex, pregnancy status, and other context. Explain this limitation.
- Do not prescribe medicines, recommend changing doses, or tell the user to stop treatment.
- Do not infer a disease from one test. Explain possible meanings cautiously and mention that a clinician interprets results with symptoms and history.
- If the report itself visibly contains a critical alert or a result explicitly flagged critical, clearly advise contacting the ordering clinician or urgent medical service promptly. For severe symptoms, advise emergency care.
- Protect privacy: do not repeat patient name, address, phone number, ID, or other direct identifiers.
Return the answer with these headings:
1. In simple words
2. Results to understand (bullet list: test, reported value/unit, reference range if shown, what it generally measures, and the report's flag if shown)
3. What this report cannot tell us
4. Questions you could ask your doctor
5. When to seek help
Keep it supportive, concise, and non-alarming.`
      },
      isPdf
        ? { type: "input_file", filename: "medical-report.pdf", file_data: dataUrl }
        : { type: "input_image", image_url: dataUrl, detail: "high" }
    ];

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content }],
      max_output_tokens: 1800
    });
    const explanation = (response.output_text || "").trim();
    if (!explanation) return res.status(502).json({ error: "The report could not be explained. Try a clearer file or a text-based PDF." });
    res.json({ explanation });
  } catch (err) {
    console.error("Report explanation failed:", err.message);
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "That file is too large. Please use a file under 12 MB." });
    if (err.message && err.message.includes("Please upload")) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: "Something went wrong while reading the report. Try again with a clear PDF or image. Your clinician remains the right person to interpret results." });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "That file is too large. Please use a file under 12 MB." });
  }
  if (err.message && err.message.includes("Please upload")) return res.status(400).json({ error: err.message });
  res.status(500).json({ error: "Unable to process this upload." });
});

app.listen(PORT, () => {
  console.log(`MedPlain is running at http://localhost:${PORT}`);
});
