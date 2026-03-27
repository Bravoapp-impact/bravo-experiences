import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SettingsPageProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export default function SettingsPage({ title, description, children, className }: SettingsPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      {children}
    </motion.div>
  );
}
