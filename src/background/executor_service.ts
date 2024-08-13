import {Action, ActionResult, SequenceResult} from "../shared/data.ts"
import {
  closeWindow,
  contentScriptAction,
  createTab,
  createWindow,
  findElementBySelector,
  findElementsBySelector,
  httpRequest,
  navigateToURL
} from "./background_actions.ts";
import {InitSequenceAlarm} from "./utils.ts";
import {menuItems} from "./context_menu_items.ts";
import {GetConfirmation, GetFirst, Pipeline} from "../api/runQueue.ts";
import {SaveRunResult} from "../api/history.ts";

// add context menu items
chrome.runtime.onInstalled.addListener(() => {
  menuItems.forEach(item => {
    const {id, title, contexts} = item;
    const itemId = chrome.contextMenus.create({id, title, contexts});
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      info.menuItemId === itemId && item.onClick(info, tab);
    });
  });
});

// interpret the action and execute it
async function executeAction(action: Action, context: Record<string, unknown>) {
  // todo: implement action execution
  // load initial values to context if value wasn't assigned yet
  action.inputs.forEach(input => {
    if (input.defaultValue && !(input.name in context)) context[input.name] = input.defaultValue;
  });
  
  switch (action.actionString) {
    case "CreateWindow":
      await createWindow(action, context);
      break;
      
    case "CloseWindow":
      await closeWindow(action, context);
      break;
    
    case "CreateTab":
      await createTab(action, context);
      break;
    
    case "NavigateToURL":
      await navigateToURL(action, context);
      break;
      
    case "HttpRequest":
      await httpRequest(action, context);
      break;
      
    case "FindElementBySelector":
      await findElementBySelector(action, context);
      break;
        
    case "FindElementsBySelector":
      await findElementsBySelector(action, context);
      break;
      
    // for all content script actions
    default:
      await contentScriptAction(action, context);
      break;
      
  }
  return {} as ActionResult;
}

// gets the first to run from the run queue and tries to run it
let running = false;
const runSequence = async () => {
  // update run queue
  let response = await GetFirst();
  if (!response.ok) return;
  const pipeline: Pipeline = await response.json();
  console.log("got pipeline from runQueue successfully!");
  console.log(pipeline);
  // initialize the sequence result object
  const sequenceResult: SequenceResult = {
    id: pipeline.id,
    results: [],
    startAt: new Date(),
    endAt: new Date()
  }
  // try to run a sequence
  console.log(`running: ${running}`);
  if (!running) {
    // try and get confirmation for the pipeline
    response = await GetConfirmation(pipeline.id);
    console.log("confirmation response: ", response);
    if (!response.ok || await response.json() as string !== pipeline.id) return;
    // start running
    // todo: limit to one flow at a time when implementing timeout
    // running = true;
    const sequence = pipeline.sequence;
    console.log("sequence:", pipeline.sequence);
    if (sequence) {
      // create a new context for the sequence
      const context = pipeline.context;
      console.log("context: ", context);
      
      // execute each action in the sequence
      for (const action of sequence.actions) {
        console.log("action: ", action);
        const result = await executeAction(action, context);
        // add action result to list of results in sequence result
        sequenceResult.results.push(result);
      }
    }
    pipeline.isFinished = true;
    running = false;
    
    // send the sequence result to the server
    sequenceResult.endAt = new Date();
    response = await SaveRunResult(sequenceResult);
    if (!response.ok) console.log("failed to save sequence result"); 
  }
}

// try to run a sequence from the run queue every roughly 4 seconds
InitSequenceAlarm(runSequence);