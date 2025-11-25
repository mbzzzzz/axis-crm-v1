import { Building2, Globe, Zap, Triangle, Command } from "lucide-react";

export function SocialProof() {
  const icons = [
    { Icon: Building2, label: "Building" },
    { Icon: Globe, label: "Globe" },
    { Icon: Zap, label: "Zap" },
    { Icon: Triangle, label: "Triangle" },
    { Icon: Command, label: "Command" },
  ];

  return (
    <section className="py-10 border-y border-neutral-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold tracking-widest text-white/60 text-center mb-6 uppercase">
          TRUSTED BY INNOVATIVE TEAMS
        </p>
        <div className="flex flex-row items-center justify-center gap-8 sm:gap-12">
          {icons.map(({ Icon, label }, index) => (
            <Icon
              key={index}
              className="size-8 sm:size-10 text-neutral-700 grayscale"
              aria-label={label}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

