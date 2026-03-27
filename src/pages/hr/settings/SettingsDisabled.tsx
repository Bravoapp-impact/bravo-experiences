import { motion } from "framer-motion";

export default function SettingsDisabled() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center py-20"
    >
      <p className="text-sm text-muted-foreground">Questa funzionalità sarà disponibile a breve</p>
    </motion.div>
  );
}
