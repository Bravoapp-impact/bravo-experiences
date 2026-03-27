import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsTheme() {
  const [selected, setSelected] = useState<"light" | "dark" | "system">("system");
  const options = [
    { id: "light" as const, label: "Chiaro", icon: Sun },
    { id: "dark" as const, label: "Scuro", icon: Moon },
    { id: "system" as const, label: "Sistema", icon: Monitor },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <h2 className="text-lg font-semibold text-foreground">Aspetto</h2>
      <p className="text-sm text-muted-foreground mb-6">Scegli come visualizzare Bravo!</p>

      <div className="flex flex-wrap gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border px-6 py-4 transition-colors",
                active ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-sm", active ? "font-medium text-foreground" : "text-muted-foreground")}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
