const form = document.querySelector("#uploadForm");
const input = document.querySelector("#reportInput");
const dropzone = document.querySelector("#dropzone");
const fileSelected = document.querySelector("#fileSelected");
const fileName = document.querySelector("#fileName");
const fileTitle = document.querySelector("#fileTitle");
const fileSubtitle = document.querySelector("#fileSubtitle");
const errorMessage = document.querySelector("#errorMessage");
const submitBtn = document.querySelector("#submitBtn");
const resultSection = document.querySelector("#resultSection");
const resultContent = document.querySelector("#resultContent");
const privacyCheck = document.querySelector("#privacyCheck");
let selectedFile = null;
const maxBytes = 12 * 1024 * 1024;
const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = !message;
}
function setFile(file) {
  showError("");
  if (!file) return clearFile();
  if (!allowed.includes(file.type)) {
    clearFile();
    showError("Please choose a PDF, JPG, PNG, or WEBP file.");
    return;
  }
  if (file.size > maxBytes) {
    clearFile();
    showError("That file is too large. Please choose a file under 12 MB.");
    return;
  }
  selectedFile = file;
  fileName.textContent = file.name;
  fileSelected.hidden = false;
  fileTitle.textContent = "Report ready to explain";
  fileSubtitle.textContent = "Your file is selected";
  dropzone.classList.add("has-file");
}
function clearFile() {
  selectedFile = null;
  input.value = "";
  fileSelected.hidden = true;
  fileTitle.textContent = "Drop your report here";
  fileSubtitle.innerHTML = 'or <span class="browse">browse files</span>';
  dropzone.classList.remove("has-file");
}
input.addEventListener("change", () => setFile(input.files[0]));
document.querySelector("#removeFile").addEventListener("click", clearFile);
for (const eventName of ["dragenter", "dragover"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
  });
}
dropzone.addEventListener("drop", (event) => setFile(event.dataTransfer.files[0]));

function renderMarkdownSafe(markdown) {
  // Escape HTML first; only then apply a small, safe Markdown subset.
  let s = markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  s = s.replace(/^### (.+)$/gm, "<h3>$1</h3>")
       .replace(/^## (.+)$/gm, "<h3>$1</h3>")
       .replace(/^# (.+)$/gm, "<h3>$1</h3>")
       .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
       .replace(/(^|\n)- (.+)/g, "$1<li>$2</li>")
       .replace(/(?:<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
       .replace(/\n{2,}/g, "</p><p>")
       .replace(/\n/g, "<br>");
  return `<p>${s}</p>`;
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");
  if (!selectedFile) return showError("Choose your report before continuing.");
  if (!privacyCheck.checked) return showError("Please confirm that you understand the educational-use and privacy note.");
  submitBtn.disabled = true;
  submitBtn.querySelector("span").textContent = "Reading your report…";
  resultSection.hidden = true;
  try {
    const data = new FormData();
    data.append("report", selectedFile);
    const response = await fetch("/api/explain", { method: "POST", body: data });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not explain this report. Please try again.");
    resultContent.innerHTML = renderMarkdownSafe(payload.explanation);
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showError(error.message || "Unable to connect. Check that the server is running and try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector("span").textContent = "Explain my report";
  }
});
document.querySelector("#copyBtn").addEventListener("click", async () => {
  const text = resultContent.innerText;
  const btn = document.querySelector("#copyBtn");
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied!";
    setTimeout(() => btn.textContent = "Copy summary", 1500);
  } catch {
    showError("Copy is unavailable in this browser. You can select the explanation text and copy it manually.");
  }
});
