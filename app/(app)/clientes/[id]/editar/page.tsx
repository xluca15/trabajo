import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { actualizarCliente, eliminarCliente } from "@/app/acciones";
import { BotonConfirmar } from "@/components/boton-confirmar";
import { FormCliente } from "@/components/form-cliente";
import { documentosDeCliente, obtenerCliente } from "@/lib/consultas";

export const metadata: Metadata = { title: "Editar cliente" };

export default async function PaginaEditarCliente({ params }: PageProps<"/clientes/[id]/editar">) {
  const { id } = await params;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();
  const cantidad = (await documentosDeCliente(id)).length;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Editar: {cliente.nombre}</h1>
      <FormCliente accion={actualizarCliente.bind(null, id)} cliente={cliente} volverA={`/clientes/${id}`} />
      <div className="tarjeta flex flex-wrap items-center justify-between gap-3 border-red-100 p-5">
        <div>
          <p className="font-medium">Eliminar cliente</p>
          <p className="text-sm text-apagado">
            Se borran también sus {cantidad} documentos y todos sus archivos. No se puede deshacer.
          </p>
        </div>
        <BotonConfirmar accion={eliminarCliente.bind(null, id)} pregunta="¿Eliminar todo?">
          Eliminar cliente
        </BotonConfirmar>
      </div>
    </div>
  );
}
