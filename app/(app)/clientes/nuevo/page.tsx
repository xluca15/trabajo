import type { Metadata } from "next";
import { crearCliente } from "@/app/acciones";
import { FormCliente } from "@/components/form-cliente";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default function PaginaNuevoCliente() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Nuevo cliente</h1>
      <FormCliente accion={crearCliente} volverA="/clientes" />
    </div>
  );
}
