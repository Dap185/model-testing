/**
 * Number line prompt frontend logic 
 */

/**
 *Dropdown menu logic for custom misconception
 */
document.addEventListener('DOMContentLoaded', function() {
    const misconceptionsDropdown = document.getElementById('misconceptions');
    const customSample = document.getElementById('custom-sample');

    if (misconceptionsDropdown && customSample) {
        misconceptionsDropdown.addEventListener('change', function() {
            if (misconceptionsDropdown.value === 'Custom') {
                customSample.style.display = 'block';
                misconception = customSample.textContent; // Update misconception variable with custom input
            } else {
                customSample.style.display = 'none';
                misconception = misconceptionsDropdown.options[misconceptionsDropdown.selectedIndex].textContent; // Update misconception variable with selected item's text
            }
        });
    }
});

//make sure the misconception variable is updated when the custom sample input changes
document.getElementById('custom-sample').addEventListener('input', function(event) {
    misconception = event.target.value;
});

/**
 * make it so that the entire prompt is passed to backend as prompt
 */
let model = "gpt-4o-mini"; // Default model
let misconception = "No Misconception"; // Default misconception

window.addEventListener("DOMContentLoaded", function () {
  // Model selector
  document.getElementById("model-select").addEventListener("change", function (event) {
    model = event.target.value;
  });

  // Prompt input
  document.getElementById("misconceptions").addEventListener("input", function (event) {
    misconception = event.target.value;
  });

  // Button click
  document.getElementById("send-btn").addEventListener("click", sendRequest);
});

async function sendRequest() {

  let data = {
    model: model,
    messages: constructPrompt()
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
    updateTable(result); // Call updateTable with the result
  } catch (error) {
    console.error("Fetch error:", error);
    document.getElementById("response").innerText = "Error: " + error.message;
  }
}


/**
 * put together adding prompt based on the current state of the page
 * @returns 
 */
function constructPrompt() {
    const splitSystemPrompt = document.getElementsByClassName("mainPrompt");
    const hasMisconception = misconception != "No Misconception";
    const systemPrompt = [{
      role: "system",
      content: (splitSystemPrompt[0].innerHTML +
        (hasMisconception ? ("3) Addresses their misconception that " + misconception): "") +
        // If there is no misconception, reflect the number of requests in the list
        (hasMisconception ? splitSystemPrompt[1].innerHTML : splitSystemPrompt[1].innerHTML.replace("4)", "3)").replace("5)", "4)")))
    }];
    const examplesPrompt =  [       
        {
            role: "user",
            content: `Here is some JSON data: {number1: 2.54, number2: 5.49, carry: [0, 1, 1, 0], ans: [0, 8, 0, 3], reflection_question: "How did you add the hundredths columns when their sum was more than 10?", student_response: "I carried the 1 from the 13 to the next column and put the 3 in that column."}`,
        },
        {
            role: "assistant",
            content: "1Great job! Looks like you got how to add decimals really well!.",
        },
        {
            role: "user",
            content: `Here is some JSON data: {number1: 2.54, number2: 5.49, carry: [0, 1, 1, 0], ans: [0, 8, 0, 3], reflection_question: "How did you add the hundredths columns when their sum was more than 10?", student_response: "They add to 13 so the 13 just becomes 3 for that column."}`,
        },
        {
            role: "assistant",
            content: "0You're right that the 3 is then put in the hundredths column, but what about the 10? Try again with this in mind.",
        }
    ];
    const problemStatePromptInputs = Array.from(document.querySelectorAll("#problemStatePrompt input"))
      .map(el => el.value.trim());
    console.log(problemStatePromptInputs);
    const problemStatePrompt = [{
      role: "user",
      content: `Here is some JSON data: {number1: ${problemStatePromptInputs[0]}, number2: ${problemStatePromptInputs[1]}, carry: [${problemStatePromptInputs[2]}], ans: [${problemStatePromptInputs[3]}], reflection_questions: ${problemStatePromptInputs[4]}, student_answers: ${problemStatePromptInputs[5]}}`
    }];
    
    console.log([].concat(systemPrompt, examplesPrompt, problemStatePrompt));
    return [].concat(systemPrompt, examplesPrompt, problemStatePrompt);

}
