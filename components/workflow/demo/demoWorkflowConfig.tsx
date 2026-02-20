import { DemoWorkflowPage } from "@/components/workflow/demo/DemoWorkflowPage";
import type { WorkflowPageDefinition, WorkflowPageProps } from "@/components/workflow/types";
import { useMemo } from "react";

function createInitializer(delayMs: number): () => Promise<void> {
  return async () => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  };
}

function FirstStep(props: WorkflowPageProps) {
  return (
    <DemoWorkflowPage
      title="Тестовый Workflow"
      stepLabel="Шаг 1 из 3"
      description="Первый шаг. Нажмите Далее."
      canGoBack
      isInitializing={props.isInitializing}
      onBack={() => props.emit("back")}
      onNext={() => props.emit("next")}
    />
  );
}

function SecondStep(props: WorkflowPageProps) {
  return (
    <DemoWorkflowPage
      title="Тестовый Workflow"
      stepLabel="Шаг 2 из 3"
      description="Второй шаг. Нажмите Далее."
      canGoBack
      isInitializing={props.isInitializing}
      onBack={() => props.emit("back")}
      onNext={() => props.emit("next")}
    />
  );
}

function ThirdStep(props: WorkflowPageProps) {
  return (
    <DemoWorkflowPage
      title="Тестовый Workflow"
      stepLabel="Шаг 3 из 3"
      description="Последний шаг. Нажмите Далее для выхода."
      canGoBack
      isInitializing={props.isInitializing}
      onBack={() => props.emit("back")}
      onNext={() => props.emit("next")}
    />
  );
}

export function useDemoWorkflowPages(): WorkflowPageDefinition[] {
  return useMemo(
    () => [
      {
        id: "demo-step-1",
        Component: FirstStep,
        initialize: createInitializer(150),
      },
      {
        id: "demo-step-2",
        Component: SecondStep,
        initialize: createInitializer(150),
      },
      {
        id: "demo-step-3",
        Component: ThirdStep,
        initialize: createInitializer(150),
      },
    ],
    []
  );
}
