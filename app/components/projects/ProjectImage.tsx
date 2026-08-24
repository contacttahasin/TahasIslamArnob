import Image from "next/image";
import type { PublicProject } from "./types";

export default function ProjectImage({ project }: { project: PublicProject }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-noir-surface">
      <Image
        src={project.image}
        alt={project.title}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-noir-bg/0 transition-colors duration-500 group-hover:bg-noir-bg/10" />
    </div>
  );
}
