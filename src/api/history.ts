import {SequenceResult} from "../shared/data.ts";

export async function SaveRunResult(result: SequenceResult) {
  return await fetch(new URL('https://localhost:7298/history/'), {
    method: "PUT",
    body: JSON.stringify(result),
    headers: {
      'Content-Type': 'application/json'
    }
  });
}