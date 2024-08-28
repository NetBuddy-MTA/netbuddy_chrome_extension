export async function RegisterId(id: string) {
  return await fetch(new URL(`https://localhost:7298/extension/register/${id}`), {method: "PUT"});
}