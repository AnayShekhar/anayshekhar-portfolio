import { PROJECTS } from "@/lib/content";

export function ProjectsSection() {
  return (
    <div className="space-y-12">
      {PROJECTS.map((project) => (
        <article key={project.name} className="space-y-3">
          <h3 className="font-mono text-lg tracking-tight" style={{ color: "var(--color-header)" }}>
            {project.name}
          </h3>
          <p className="text-sm leading-relaxed text-body">{project.description}</p>
        </article>
      ))}
    </div>
  );
}
