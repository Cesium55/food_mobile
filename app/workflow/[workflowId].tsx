import { PagesWorkflow } from "@/components/workflow/PagesWorkflow";
import { useDemoWorkflowPages } from "@/components/workflow/demo/demoWorkflowConfig";
import { SellerOnboardingProvider } from "@/components/workflow/seller/SellerOnboardingContext";
import { useSellerOnboardingWorkflowPages } from "@/components/workflow/seller/sellerOnboardingWorkflowConfig";
import { getWorkflowProgress, saveWorkflowProgress } from "@/services/workflowStateService";
import type { Href } from "expo-router";
import { useLocalSearchParams } from "expo-router";

export default function WorkflowScreen() {
  const params = useLocalSearchParams<{
    workflowId: string;
    exitTo?: string;
    persist?: string;
    firstBackTo?: string;
  }>();
  const workflowId = params.workflowId ?? "demo";
  const exitTo = (params.exitTo as Href | undefined) ?? ("/(tabs)/(home)" as Href);
  const firstPageBackTo = params.firstBackTo as Href | undefined;
  const persistProgress = params.persist !== "0";
  const demoPages = useDemoWorkflowPages();
  const sellerOnboardingPages = useSellerOnboardingWorkflowPages();
  const pages = workflowId === "seller-onboarding" ? sellerOnboardingPages : demoPages;

  const workflowElement = (
    <PagesWorkflow
      workflowId={workflowId}
      pages={pages}
      exitTo={exitTo}
      firstPageBackTo={firstPageBackTo}
      resolveInitialPage={
        persistProgress ? () => getWorkflowProgress(workflowId) : undefined
      }
      onAdvance={
        persistProgress
          ? async (_fromIndex, toIndex) => {
              await saveWorkflowProgress(workflowId, toIndex);
            }
          : undefined
      }
    />
  );

  if (workflowId === "seller-onboarding") {
    return <SellerOnboardingProvider>{workflowElement}</SellerOnboardingProvider>;
  }

  return workflowElement;
}
