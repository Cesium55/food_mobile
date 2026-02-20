import { useMemo } from "react";
import type { WorkflowPageDefinition } from "@/components/workflow/types";
import { SellerOnboardingIntroPage } from "@/components/workflow/seller/SellerOnboardingIntroPage";
import { SellerOnboardingAgreementsPage } from "@/components/workflow/seller/SellerOnboardingAgreementsPage";
import { SellerOnboardingDataPage } from "@/components/workflow/seller/SellerOnboardingDataPage";
import { SellerOnboardingSuccessPage } from "@/components/workflow/seller/SellerOnboardingSuccessPage";

export function useSellerOnboardingWorkflowPages(): WorkflowPageDefinition[] {
  return useMemo(
    () => [
      {
        id: "seller-intro",
        Component: SellerOnboardingIntroPage,
      },
      {
        id: "seller-agreements",
        Component: SellerOnboardingAgreementsPage,
      },
      {
        id: "seller-data",
        Component: SellerOnboardingDataPage,
      },
      {
        id: "seller-success",
        Component: SellerOnboardingSuccessPage,
      },
    ],
    []
  );
}
