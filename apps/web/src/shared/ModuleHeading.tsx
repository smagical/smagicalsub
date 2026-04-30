type ModuleHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ModuleHeading({ eyebrow, title, description }: ModuleHeadingProps) {
  return (
    <div className="module-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <span>{description}</span>
    </div>
  );
}

