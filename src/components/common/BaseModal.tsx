import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  showCloseButton?: boolean;
  className?: string;
}

export function BaseModal({
  open,
  onClose,
  children,
  showBackButton = false,
  onBack,
  title,
  showCloseButton = true,
  className,
}: BaseModalProps) {
  // Lock body scroll when modal is open (prevents scroll-through on iOS)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const hasHeader = showBackButton || title;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={cn(
            "bg-background w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-hidden rounded-3xl",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Optional header with back/title/close */}
          {hasHeader && (
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
              {showBackButton ? (
                <button
                  onClick={onBack || onClose}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <div className="w-8" />
              )}
              
              {title && (
                <h3 className="text-lg font-semibold">{title}</h3>
              )}
              
              {showCloseButton ? (
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <div className="w-8" />
              )}
            </div>
          )}

          {/* Content slot */}
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Close button component for overlay use (when no header)
export function ModalCloseButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow-sm",
        className
      )}
    >
      <X className="h-4 w-4" />
    </button>
  );
}
