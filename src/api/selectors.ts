import {Selector} from "../shared/data.ts";

export async function saveSelector(selector: Selector) {
  return await fetch(new URL('https://localhost:7298/selectors'), {
    method: "PUT",
    body: JSON.stringify({...selector, id: selector.id === "" ? "00000000-0000-0000-0000-000000000000" : selector.id}),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .catch(err => console.log(err));
}