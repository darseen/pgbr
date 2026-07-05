import { MigrationJobStatus } from "@repo/db/schema";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  migration: {
    currentStep: string;
    status: MigrationJobStatus;
  };
}

export default function StepsHeader({ migration }: Props) {
  const steps = [
    { id: "configure", label: "Configure", status: "completed" },
    { id: "migrating", label: "Migrating", status: migration.status },
    {
      id: "complete",
      label: "Complete",
      status: migration.currentStep === "complete" ? "completed" : "idle",
    },
  ];

  return (
    <header className="mb-12">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
        {steps.map((step, index, array) => {
          const isCurrent = migration.currentStep === step.id;
          const isPast =
            array.findIndex((s) => s.id === migration.currentStep) > index;

          const stepState =
            isPast && step.status === "idle"
              ? "completed"
              : (step.status as MigrationJobStatus);

          const visuals = getStepVisuals(step.id, stepState, isCurrent);

          return (
            <div
              key={step.id}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="relative flex w-24 flex-col items-center gap-3">
                <div
                  className={`bg-background flex size-10 items-center justify-center rounded-full border-2 transition-all duration-200 ${visuals.wrapper}`}
                >
                  {visuals.icon || (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`absolute -bottom-6 w-max text-sm font-medium ${
                    isCurrent || stepState === "completed"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < array.length - 1 && (
                <div className="relative -top-3 mx-2 h-0.5 flex-1">
                  <div className="bg-border absolute inset-0 rounded-full" />
                  <div
                    className="bg-primary absolute inset-0 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: isPast ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}

const getStepVisuals = (
  stepId: string,
  status: MigrationJobStatus,
  isActiveStep: boolean,
) => {
  if (status === "completed" || (stepId === "complete" && isActiveStep)) {
    return {
      wrapper: "border-primary bg-primary text-primary-foreground",
      icon: <CheckCircle2 className="size-5" />,
    };
  }
  if (status === "running") {
    return {
      wrapper:
        "border-primary text-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)]",
      icon: <Loader2 className="size-5 animate-spin" />,
    };
  }
  if (status === "failed") {
    return {
      wrapper: "border-destructive bg-destructive text-destructive-foreground",
      icon: <AlertCircle className="size-5" />,
    };
  }
  if (isActiveStep) {
    return {
      wrapper:
        "border-primary text-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)]",
      icon: null,
    };
  }
  return {
    wrapper: "border-muted-foreground/30 text-muted-foreground",
    icon: null,
  };
};
