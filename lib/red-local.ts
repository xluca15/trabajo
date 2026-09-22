import { networkInterfaces } from "node:os";

/** IPs IPv4 de esta PC en la red local (para abrir el servidor de desarrollo desde el celular por wifi). */
export function ipsLocales(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i?.family === "IPv4" && !i.internal)
    .map((i) => i!.address);
}
