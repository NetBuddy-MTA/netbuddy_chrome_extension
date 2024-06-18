import {Sequence} from "../shared/data.ts";

export type Pipeline = {
  id: string;
  sequence: Sequence;
  context: Record<string, unknown>;
  isRunning: boolean;
  isFinished: boolean;
};

export async function GetQueue() {
  return await fetch(new URL('https://localhost:7298/execution/queue/all'), {method: "GET"});
}

export async function GetConfirmation(id: string) {
  return await fetch(new URL('https://localhost:7298/execution/queue/confirmation/' + id), {method: "GET"});
}