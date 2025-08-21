/**
 * Custom Prompt page frontend logic 
 */
let model = "gpt-4o-mini"; // Default model
let misconception = "";

/**
 * Initialize interface events codewise logic
 */
window.addEventListener("DOMContentLoaded", function () {
  // Model selector
  document.getElementById("model-select").addEventListener("change", function (event) {
    model = event.target.value;
  });

  // Prompt input
  document.getElementById("prompt-input").addEventListener("change", function (event) {
    message = event.target.value;
  });

  // Button click
  document.getElementById("send-btn").addEventListener("click", sendRequest);
});

/**
 * Send request to backend with the current model and prompt
 */
async function sendRequest() {
  // Always grab latest value in case user typed but event didn’t fire
  const promptValue = document.getElementById("prompt-input").value;

  let data = {
    model: model,
    message: promptValue
  };

  try {
    const response = await fetch("/api/testPrompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Response:", result);
    document.getElementById("response").innerText = JSON.stringify(result, null, 2);
    updateTable(result); // Call updateTable with the result
  } catch (error) {
    console.error("Fetch error:", error);
    document.getElementById("response").innerText = "Error: " + error.message;
  }
}

