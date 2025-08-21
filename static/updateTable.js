/**
 * When getting results from the backend, update the history table
 * @param {} result 
 */
function updateTable(result) {
  const tableBody = document.querySelector("#history-table tbody");
  const row = document.createElement("tr");

  // Model
  const modelCell = document.createElement("td");
  modelCell.textContent = result.model || "";
  row.appendChild(modelCell);

  // Prompt
    const promptCell = document.createElement("td");
    console.log(result.prompt);
    promptCell.textContent = Array.isArray(result.prompt)
        ? result.prompt.map(p => JSON.stringify(p)).join("\n")
        : (result.prompt || "");
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