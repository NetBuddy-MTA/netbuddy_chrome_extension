import {Action, ActionResult, SequenceResult} from "../shared/data.ts"
import {
  additionNumbersAction, booleanAndAction, booleanNotAction, booleanOrAction,
  closeWindow,
  contentScriptAction,
  createTab,
  createWindow,
  httpRequest, multiplyNumbersAction,
  navigateToURL, parseNumberAction, parseURLAction, subtractNumbersAction, waitForMillisecondsAction, waitForTabToLoad
} from "./background_actions.ts";
import {InitSequenceAlarm} from "./utils.ts";
import {menuItems} from "./context_menu_items.ts";
import {GetConfirmation, GetFirst, Pipeline} from "../api/runQueue.ts";
import {SaveRunResult} from "../api/history.ts";
import {RegisterId} from "../api/register.ts";

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

// register id with the server
RegisterId(chrome.runtime.id).then();

// interpret the action and execute it
async function executeAction(action: Action, context: Record<string, unknown>) {
  // load initial values to context if value wasn't assigned yet
  action.inputs.forEach(input => {
    if (input.defaultValue && !(input.name in context)) context[input.name] = input.defaultValue;
  });
  
  // create the context for the result
  const actionContext: Record<string, string> = {};
  action.inputs.forEach(input => actionContext[input.name] = JSON.stringify(context[input.name]));
  
  // initialize the action logs and outputs
  const startAt = new Date();
  let result;
  // pick and run the action
  switch (action.actionString) {
    case "CreateWindow":
      result = await createWindow(action, context);
      break;
      
    case "CloseWindow":
      result = await closeWindow(action, context);
      break;
    
    case "CreateTab":
      result = await createTab(action, context);
      break;
    
    case "NavigateToURL":
      result = await navigateToURL(action, context);
      break;
      
    case "HttpRequest":
      result = await httpRequest(action, context);
      break;
      
    case "Subtract":
      result = subtractNumbersAction(action, context);
      break;
      
    case "Multiply":
      result = multiplyNumbersAction(action, context);
      break;

    case "Divide":
      result = multiplyNumbersAction(action, context);
      break;
      
    case "Addition":
      result = additionNumbersAction(action, context);
      break;
      
    case "WaitForMilliseconds":
      result = waitForMillisecondsAction(action, context);
      break;
      
    case "WaitForTab":
      result = waitForTabToLoad(action, context);
      break;
      
    case "ParseNumber":
      result = parseNumberAction(action, context);
      break;
      
    case "ParseURL":
      result = parseURLAction(action, context);
      break;
      
    case "BooleanNot":
      result = booleanNotAction(action, context);
      break;
      
    case "BooleanAnd":
      result = booleanAndAction(action, context);
      break;
      
    case "BooleanOr":
      result = booleanOrAction(action, context);
      break;
      
    // for all content script actions
    default:
      result = await contentScriptAction(action, context);
      break;
  }
  
  const endAt = new Date();
  
  return {
    action,
    actionContext,
    ...result,
    startAt,
    endAt
  } as ActionResult;
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
  if (!running) {
    // try and get confirmation for the pipeline
    response = await GetConfirmation(pipeline.id);
    if (!response.ok || await response.json() as string !== pipeline.id) return;
    // start running
    // todo: limit to one flow at a time when implementing timeout
    // running = true;
    const sequence = pipeline.sequence;
    if (sequence) {
      // create a new context for the sequence
      const context = pipeline.context;
      // preprocess
      for (const name of Object.keys(context)) {
        const value = context[name];
        context[name] = JSON.parse(value as string);
      }
      // execute each action in the sequence
      let index = 0;
      while (index < sequence.actions.length) {
        const action = sequence.actions[index];
        console.log(`Processing ${action.actionString} action:`);
        // set new index
        if (shouldRunAction(action)) {
          const result = await executeAction(action, context);
          // add action result to list of results in sequence result
          sequenceResult.results.push(result);
          console.log(result);
          index++;
        }
        else {
          index += offsetIndex(action, context, sequence.actions.length);
        }
      }
    }
    pipeline.isFinished = true;
    running = false;
    
    // send the sequence result to the server
    sequenceResult.endAt = new Date();
    response = await SaveRunResult(sequenceResult);
    if (!response.ok) {
      console.log("failed to save sequence result");
      console.log(response);
    }
  }
}

function shouldRunAction(action: Action) {
  return action.actionString !== "Goto";
}

function offsetIndex(action: Action, context: Record<string, unknown>, jumpToEnd: number): number {
  if (action.actionString === "Goto") {
    // get the inputs
    const offsetInput = action.inputs.find(value => value.originalName === "Number");
    const conditionInput = action.inputs.find(value => value.originalName === "Condition");
    
    if (!offsetInput) return jumpToEnd;
    
    const offset = context[offsetInput.name] as number;
    
    if (conditionInput) {
      const condition = context[conditionInput.name] as boolean;
      if (condition) return offset;
      return 1;
    }
    else 
      return offset;
  }
  return 1;
}

// try to run a sequence from the run queue every roughly 4 seconds
InitSequenceAlarm(runSequence);