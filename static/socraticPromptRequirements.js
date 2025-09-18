/**
 * Prompt construction and POST request for updated socratic prompting requirements
 */
let model = "gpt-4o-mini"; //default model
//attach event listener so clicking button sends request, and for picking model
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("send-btn").addEventListener("click", sendRequest);

  // Model selector
  document.getElementById("model-select").addEventListener("change", function (event) {
    model = event.target.value;
  });
});


/**
 * Sends request to backend with model and prompt
 * On receiving a good response, update the table on the interface 
 */
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
    const elements = document.querySelectorAll(".response"); // replace with your selector
    const firstEmpty = Array.from(elements).find(el => el.textContent.trim() === "");

    if (firstEmpty) {
      firstEmpty.textContent = result.response;
    } else {
      console.log("No empty element found");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    document.getElementById("response").innerText = "Error: " + error.message;
  }
}

function buildConversation(userprompts, responses) {
  const conversation = [];
  const maxLen = Math.max(userprompts.length, responses.length);

  for (let i = 0; i < maxLen; i++) {
    const userEl = userprompts[i];
    const resEl = responses[i];

    if (resEl && resEl.textContent.trim() !== "") {
      conversation.push({
        role: "assistant",
        content: resEl.textContent.trim()
      });
    }

    if (userEl && userEl.value.trim() !== "") {
      conversation.push({
        role: "user",
        content: userEl.value.trim()
      });
    }
  }

  return conversation;
}


/**
 * Constructs prompt for this interface and puts it into a JSON array for API.
 * @returns 
 */
function constructPrompt() {
  //grab all configuration from the interface 
  const staticPromptComponents = document.querySelectorAll(".staticPromptComponents");
  const mathProblem = document.getElementById("mathProblem").value;
  const mathProblemAnswer = document.getElementById("mathProblemAnswer").value;
  const correctFirstTime = document.getElementById("recentGuess").value === "correct";
  const recentIncorrectGuess = document.getElementById("recentIncorrectGuess").value;
  const skills = document.getElementById("skills").value;
  const misconceptions = document.getElementById("misconceptions").value;

  //put together into prompt string
  const systemPrompt =
  `${staticPromptComponents[0].textContent}`/*can you engage me in a socratic dialogue, assuming the following:*/
   + `${staticPromptComponents[1].textContent}` /*I just finished the*/
   + `${mathProblem}` /*sequence problem 0.0, 0.4, 0.8*/
   + `${staticPromptComponents[2].textContent}` /*By correctly answering*/
   + `${mathProblemAnswer}.`
   + `${correctFirstTime ? "I got it right the first time" : "Before getting it correct, I made the erroneous " + recentIncorrectGuess}.`
   + `${recentIncorrectGuess}.`/*sequence 0.0, 0.4, 0.8, 0.12*/
   + `${staticPromptComponents[3].textContent}`/*My level of skills is as follows:*/
   + `${skills}.`/*poor in sorting decimals, average in adding decimals, good in finishing a decimal sequence*/
   + `${staticPromptComponents[4].textContent}` /*The misconceptions I have shown while learning are, */
   + `${misconceptions}` /*5 times ‘longer decimals are larger', 4 times 'shorter decimals are larger.*/
   + `${staticPromptComponents[5].textContent}` /*Taking my level of skills and prior misconceptions into account, ask a conceptual or procedural question -- wait for my answer...*/
   + `${staticPromptComponents[6].textContent}` /* If the student answers with an incorret number or something even vaguely related to decimal numbers...*/
   + `${staticPromptComponents[7].textContent}` /*This is a middle school student so keep the language simple.*/
  
   const userPrompts = document.querySelectorAll(".userPrompt");
   const responses = document.querySelectorAll(".response");
   
   const dialogue = buildConversation(userPrompts, responses);

  //make it json
   return [{
    role: "system",
    content: systemPrompt
   }].concat(dialogue);
}