import * as React from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StepWizardProps {
  totalSteps: number;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  canNext: boolean;
  submitting?: boolean;
  backLabel?: string;
  nextLabel?: string;
  className?: string;
  children: React.ReactNode;
}

export function StepWizard({
  totalSteps,
  currentStep,
  onNext,
  onBack,
  canNext,
  submitting = false,
  backLabel = "Indietro",
  nextLabel = "Avanti",
  className,
  children,
}: StepWizardProps) {
  return (
    <div className={cn("max-w-xl mx-auto py-6 space-y-6", className)}>
      {/* Stepper dots */}
      <div className="flex items-center justify-center">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={i} className="flex items-center">
              <div
                className={cn(
                  "h-3 w-3 rounded-full transition-all duration-300",
                  isCompleted
                    ? "bg-primary"
                    : isCurrent
                    ? "bg-primary ring-4 ring-primary/20"
                    : "bg-muted-foreground/20"
                )}
              />
              {i < totalSteps - 1 && (
                <div
                  className={cn(
                    "h-px w-10 mx-1 transition-colors duration-300",
                    stepNum < currentStep ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-background">{children}</div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {backLabel}
        </Button>
        <Button size="sm" onClick={onNext} disabled={!canNext || submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          {nextLabel}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
