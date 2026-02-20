import { authService } from "@/services/autoAuthService";
import {
  bindUserEmail,
  createSellerRegistrationRequest,
  getMySellerRegistrationRequest,
  SellerRegistrationRequest,
  SellerRegistrationRequestPayload,
  updateSellerRegistrationRequest,
} from "@/services/sellerRegistrationService";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface SellerOnboardingContextValue {
  initializing: boolean;
  email: string | null;
  hasEmail: boolean;
  request: SellerRegistrationRequest | null;
  loadingRequest: boolean;
  bindingEmail: boolean;
  submittingRequest: boolean;
  bindEmail: (email: string) => Promise<void>;
  submitRequest: (payload: SellerRegistrationRequestPayload) => Promise<SellerRegistrationRequest>;
}

const SellerOnboardingContext = createContext<SellerOnboardingContextValue | null>(null);

export function SellerOnboardingProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [request, setRequest] = useState<SellerRegistrationRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [bindingEmail, setBindingEmail] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const loadInitialData = useCallback(async () => {
    setInitializing(true);
    setLoadingRequest(true);
    try {
      const [authResult, existingRequest] = await Promise.all([
        authService.forceReloadAuth(),
        getMySellerRegistrationRequest(),
      ]);

      setEmail(authResult.userData?.email || null);
      setRequest(existingRequest);
    } finally {
      setLoadingRequest(false);
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const handleBindEmail = useCallback(async (newEmail: string) => {
    setBindingEmail(true);
    try {
      await bindUserEmail(newEmail);
      authService.clearCache();
      const authResult = await authService.forceReloadAuth();
      setEmail(authResult.userData?.email || newEmail);
    } finally {
      setBindingEmail(false);
    }
  }, []);

  const handleSubmitRequest = useCallback(
    async (payload: SellerRegistrationRequestPayload) => {
      setSubmittingRequest(true);
      try {
        let nextRequest: SellerRegistrationRequest | null = null;
        const normalizedPayload = {
          ...payload,
          terms_accepted: true,
        };

        if (request) {
          nextRequest = await updateSellerRegistrationRequest(normalizedPayload);
        } else {
          try {
            nextRequest = await createSellerRegistrationRequest(normalizedPayload);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message.toLowerCase() : "";
            if (errorMessage.includes("already has registration request")) {
              nextRequest = await updateSellerRegistrationRequest(normalizedPayload);
            } else {
              throw error;
            }
          }
        }

        setRequest(nextRequest);
        return nextRequest;
      } finally {
        setSubmittingRequest(false);
      }
    },
    [request]
  );

  return (
    <SellerOnboardingContext.Provider
      value={{
        initializing,
        email,
        hasEmail: Boolean(email?.trim()),
        request,
        loadingRequest,
        bindingEmail,
        submittingRequest,
        bindEmail: handleBindEmail,
        submitRequest: handleSubmitRequest,
      }}
    >
      {children}
    </SellerOnboardingContext.Provider>
  );
}

export function useSellerOnboardingContext(): SellerOnboardingContextValue {
  const context = useContext(SellerOnboardingContext);
  if (!context) {
    throw new Error("useSellerOnboardingContext must be used within SellerOnboardingProvider");
  }
  return context;
}
