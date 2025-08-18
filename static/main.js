console.log("JS loaded correctly");
window.addEventListener("beforeunload", () => {
  console.log("Page is reloading!");
});


let model = "gpt-4o-mini"; // Default model
let message = "";

window.addEventListener("DOMContentLoaded", function () {
  // Model selector
  document.getElementById("model-select").addEventListener("change", function (event) {
    model = event.target.value;
  });

  // Prompt input
  document.getElementById("prompt-input").addEventListener("input", function (event) {
    message = event.target.value;
  });

  // Button click
  document.getElementById("send-btn").addEventListener("click", sendRequest);
});

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

function updateTable(result) {
  const tableBody = document.querySelector("#history-table tbody");
  const row = document.createElement("tr");

  // Model
  const modelCell = document.createElement("td");
  modelCell.textContent = result.model || "";
  row.appendChild(modelCell);

  // Prompt
  const promptCell = document.createElement("td");
  promptCell.textContent = result.prompt || "";
  row.appendChild(promptCell);

  // Response
  const responseCell = document.createElement("td");
  responseCell.textContent = result.response || "";
  row.appendChild(responseCell);

  // Time Elapsed
  const timeCell = document.createElement("td");
  timeCell.textContent = (result.time_elapsed !== undefined)
    ? result.time_elapsed.toFixed(3) + "s"
    : "";
  row.appendChild(timeCell);

  tableBody.appendChild(row);
}