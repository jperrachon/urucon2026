(function () {
  const form = document.getElementById("cfp-form");
  if (!form) {
    return;
  }

  const uploadBox = document.getElementById("upload-box");
  const fileInput = document.getElementById("paper-file");
  const uploadHint = document.getElementById("upload-box-hint");
  const statusEl = document.getElementById("cfp-form-status");
  const submitButton = document.getElementById("cfp-submit-btn");
  const apiBaseUrl = (window.__URUCON_CONFIG__ && window.__URUCON_CONFIG__.CFP_API_BASE_URL || "").replace(/\/$/, "");

  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  function setStatus(message, state) {
    statusEl.textContent = message;
    statusEl.classList.remove("is-success", "is-error");
    if (state) {
      statusEl.classList.add(state === "success" ? "is-success" : "is-error");
    }
  }

  function selectedFile() {
    return fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
  }

  function formatFileHint(file) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return "Selected: " + file.name + " (" + sizeMb + " MB)";
  }

  function updateFilePreview() {
    const file = selectedFile();
    uploadHint.innerHTML = file ? formatFileHint(file) : "Drag your paper here<br>or select a file";
  }

  function validateForm() {
    if (!apiBaseUrl) {
      return "Submission endpoint is not configured. Please contact support.";
    }

    const file = selectedFile();
    if (!file) {
      return "Please select a PDF file before submitting.";
    }

    const isPdfMime = file.type === "application/pdf";
    const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !hasPdfExtension) {
      return "Only PDF files are allowed.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "PDF file must be 10 MB or smaller.";
    }

    if (!form.reportValidity()) {
      return "Please complete all required fields.";
    }

    return null;
  }

  function setSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting;
    submitButton.setAttribute("aria-busy", isSubmitting ? "true" : "false");
  }

  async function requestUploadUrl(payload) {
    const response = await fetch(apiBaseUrl + "/api/cfp/submission-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.message || "Could not register your submission.");
    }

    return body;
  }

  async function uploadPaper(uploadUrl, file) {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/pdf"
      },
      body: file
    });

    if (!response.ok) {
      throw new Error("Could not upload the PDF file.");
    }
  }

  async function submitHandler(event) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setStatus(validationError, "error");
      return;
    }

    const formData = new FormData(form);
    const file = selectedFile();

    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      paperTitle: String(formData.get("paperTitle") || "").trim(),
      researchArea: String(formData.get("researchArea") || "").trim(),
      abstract: String(formData.get("abstract") || "").trim(),
      fileName: file.name,
      fileType: "application/pdf",
      fileSize: file.size
    };

    try {
      setSubmitting(true);
      setStatus("Registering submission...", null);

      const uploadInfo = await requestUploadUrl(payload);
      setStatus("Uploading PDF...", null);

      await uploadPaper(uploadInfo.uploadUrl, file);

      form.reset();
      updateFilePreview();
      setStatus("Submission received successfully. Submission ID: " + uploadInfo.submissionId, "success");
    } catch (error) {
      setStatus(error.message || "Submission failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    uploadBox.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadBox.classList.add("is-dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadBox.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadBox.classList.remove("is-dragover");
    });
  });

  uploadBox.addEventListener("drop", (event) => {
    const dt = event.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) {
      return;
    }

    fileInput.files = dt.files;
    updateFilePreview();
  });

  uploadBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener("change", updateFilePreview);
  form.addEventListener("submit", submitHandler);
})();
