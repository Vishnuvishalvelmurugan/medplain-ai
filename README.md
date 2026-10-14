# MedPlain — AI Medical Report Explainer

A premium, responsive starter website that lets a user upload a PDF or image of a medical/lab report and receive an AI-generated plain-language explanation.

## Features
- Responsive premium UI
- Upload PDF, JPG, PNG, WEBP (maximum 12 MB)
- AI-generated summary, test explanations, questions for a clinician, and safety caveats
- Server-side API key (never put your API key in browser JavaScript)
- Does not write uploaded files to disk or store them in a database
- Output is explicitly framed as educational, not diagnosis or treatment

## Requirements
- Node.js 18+
- An OpenAI API key with API access/billing configured

## Run locally
1. Extract the ZIP.
2. Open a terminal in this folder.
3. Install packages:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env`.
5. Open `.env` and replace `put_your_api_key_here` with your API key.
6. Start:
   ```bash
   npm start
   ```
7. Open http://localhost:3000

Never share your `.env` file or commit it to GitHub.

## How it works
The browser sends the selected file to the Express backend. The backend forwards it to the OpenAI Responses API using a server-side key and returns the explanation. PDFs are sent as PDF input; image uploads are sent as image input.

## Important privacy and safety notes
- The app does not save uploads to its own disk or database. The file is temporarily held in server memory during processing. The AI provider receives the file for processing; review the provider's current data-use and retention policies before handling real patient information.
- This starter does not include authentication, rate limiting, audit logging, a privacy policy, regional compliance controls, or a production deployment setup. Do not launch it for real patient data until these are designed and reviewed.
- Avoid uploading identifiable reports in demos. Use synthetic or de-identified sample reports.
- AI may misread values, units, and reference ranges. Verify the result against the original report and ask a qualified healthcare professional to interpret it.
- This tool does not diagnose, prescribe, or replace medical care. It is not for emergencies.
- The prompt aims to avoid repeating direct identifiers, but do not treat that as a guarantee of de-identification.

## Deployment
Deploy the Node.js app on a host that supports a server process and environment variables. Set `OPENAI_API_KEY` in the hosting provider's secret/environment settings. Do not expose it in client-side code. Use HTTPS, add authentication and abuse protection, and complete privacy/security and clinical-safety reviews before public use.
