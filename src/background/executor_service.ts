import {Action, ActionResult, Sequence} from "./data.ts"
import {createTab, navigateToURL} from "./background_actions.ts";
import {InitSequenceAlarm} from "./utils.ts";

// try to run a sequence from the run queue every roughly 4 seconds
InitSequenceAlarm(runSequence);

// run queue for sequences
const runQueue: Sequence[] = [];
let running = false;

// request sequence from server by id
async function getSequence(id: string) {
  const res = await fetch(`https://localhost:7298/sequences?id=${id}`);
  return await res.json() as Sequence;
}

// add listener for https responses from the netbuddy website
chrome.webRequest.onCompleted.addListener(async details => {
  // if no headers, return
  if (!details.responseHeaders) return;
  // check if the request contains the header 'X-Netbuddy-Sequence'
  const sequenceHeader = details.responseHeaders.find(header => header.name === 'X-Netbuddy-Sequence');
  // if no sequence header, return
  if (!sequenceHeader || !sequenceHeader.value) return;
  // parse the sequence header
  const sequenceId = sequenceHeader.value;
  // request the sequence from the server
  const sequence = await getSequence(sequenceId);
  // add the sequence to the run queue
  runQueue.push(sequence);
}, {urls: ["https://localhost:7298/*"]});

// interpret the action and execute it
async function executeAction(action: Action, context: Map<string, unknown>) {
  // todo: implement action execution
  // load initial values to context if value wasn't assigned yet
  action.inputs.forEach(input => 
    input.defaultValue && !context.has(input.name) && context.set(input.name, input.defaultValue));
  
  switch (action.ActionString) {
    case "CreateTab":
      await createTab({inputs: action.inputs, outputs: action.outputs}, context);
      break;
    
    case "NavigateToURL":
      await navigateToURL({inputs: action.inputs, outputs: action.outputs}, context);
      break;
      
  }
  return {} as ActionResult;
}

// runs a sequence from the run queue
async function runSequence() {
  if (!running && runQueue.length > 0) {
    running = true;
    const sequence = runQueue.shift();
    if (sequence) {
      // create a new context for the sequence
      const context = new Map<string, unknown>();
      
      // execute each action in the sequence
      for (const action of sequence.actions) {
        const result = await executeAction(action, context);
        // todo: send result to server
        console.log(result);
      }
    }
    running = false;
  }
}