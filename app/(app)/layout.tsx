import Image from "next/image";
import Link from "next/link";
import { requerirSesion } from "@/lib/sesion";
import { BotonSalir } from "@/components/boton-salir";
import { Navegacion } from "@/components/navegacion";
import icono from "@/app/icon.png";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const { user } = await requerirSesion();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-borde bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Link href="/" className="mr-2 flex items-center gap-2 font-semibold text-tinta">
            <Image src={icono} alt="" className="size-8 rounded-md" priority />
            <span className="hidden sm:inline">Leo Calderas</span>
          </Link>
          <Navegacion />
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden text-sm text-apagado md:inline">{user.name}</span>
            <BotonSalir />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
