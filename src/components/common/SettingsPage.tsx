import { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

interface SettingsPageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
}

export default function SettingsPage({
  title,
  description,
  icon,
  iconColor,
  children,
  className,
}: SettingsPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        iconColor={iconColor}
        className="mb-6"
      />
      {children}
    </motion.div>
  );
}
