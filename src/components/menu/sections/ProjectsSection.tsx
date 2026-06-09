import { PROJECTS } from "@/lib/content";

export function ProjectsSection() {
  return (
    <div className="space-y-8">
      {PROJECTS.map((project) => (
        <article key={project.name} className="group space-y-2">
          <h3 className="font-mono text-sm font-medium tracking-wide text-header">
            {project.name}
          </h3>
          <p className="text-xs leading-relaxed text-body transition-colors group-hover:text-header/80">
            {project.description}
          </p>
        </article>
      ))}
    </div>
  );
}
