import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WorkflowEventBus } from "./WorkflowEventBus";
import type { PagesWorkflowProps, WorkflowControls, WorkflowEvent } from "./types";

function toPageIndex(
  value: number | string | null | undefined,
  pageIds: string[]
): number {
  if (typeof value === "number") {
    return Math.max(0, Math.min(value, pageIds.length - 1));
  }

  if (typeof value === "string") {
    const foundIndex = pageIds.indexOf(value);
    return foundIndex >= 0 ? foundIndex : 0;
  }

  return 0;
}

export function PagesWorkflow({
  workflowId,
  pages,
  exitTo,
  firstPageBackTo,
  resolveInitialPage,
  onEvent,
  onAdvance,
  onExit,
}: PagesWorkflowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResolvingInitialPage, setIsResolvingInitialPage] = useState(true);
  const [isPageInitializing, setIsPageInitializing] = useState(false);
  const busRef = useRef(new WorkflowEventBus());

  const currentPage = pages[currentIndex];

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      return;
    }

    if (firstPageBackTo) {
      router.replace(firstPageBackTo);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(exitTo);
  }, [currentIndex, exitTo, firstPageBackTo]);

  const exitWorkflow = useCallback(
    async (target = exitTo) => {
      await onExit?.();
      router.replace(target);
    },
    [exitTo, onExit]
  );

  const goNext = useCallback(async () => {
    if (currentIndex >= pages.length - 1) {
      await exitWorkflow();
      return;
    }

    const nextIndex = currentIndex + 1;
    await onAdvance?.(currentIndex, nextIndex);
    setCurrentIndex(nextIndex);
  }, [currentIndex, exitWorkflow, onAdvance, pages.length]);

  const emit = useCallback((eventName: string, payload?: unknown) => {
    busRef.current.emit(eventName, payload);
  }, []);

  const controls: WorkflowControls = useMemo(
    () => ({
      next: goNext,
      back: goBack,
      exit: exitWorkflow,
      emit,
    }),
    [emit, exitWorkflow, goBack, goNext]
  );

  const pageIds = useMemo(() => pages.map((page) => page.id), [pages]);

  useEffect(() => {
    let isCancelled = false;

    const resolvePage = async () => {
      setIsResolvingInitialPage(true);
      try {
        const initialPage = await resolveInitialPage?.();
        if (!isCancelled) {
          setCurrentIndex(toPageIndex(initialPage, pageIds));
        }
      } finally {
        if (!isCancelled) {
          setIsResolvingInitialPage(false);
        }
      }
    };

    resolvePage();
    return () => {
      isCancelled = true;
    };
  }, [pageIds, resolveInitialPage, workflowId]);

  useEffect(() => {
    let isCancelled = false;

    const initialize = async () => {
      const currentInitializer = pages[currentIndex]?.initialize;
      if (!currentInitializer) {
        setIsPageInitializing(false);
        return;
      }

      setIsPageInitializing(true);
      try {
        await currentInitializer();
      } finally {
        if (!isCancelled) {
          setIsPageInitializing(false);
        }
      }
    };

    initialize();
    return () => {
      isCancelled = true;
    };
  }, [currentIndex, pages]);

  useEffect(() => {
    const unsubscribe = busRef.current.onAny((eventName, payload) => {
      const event: WorkflowEvent = {
        type: eventName,
        payload,
        pageId: currentPage.id,
        pageIndex: currentIndex,
      };

      const isHandledByCustom = onEvent?.(event, controls) === true;
      if (isHandledByCustom) {
        return;
      }

      if (eventName === "next") {
        void controls.next();
        return;
      }

      if (eventName === "back") {
        controls.back();
        return;
      }

      if (eventName === "exit") {
        void controls.exit();
      }
    });

    return unsubscribe;
  }, [controls, currentIndex, currentPage.id, onEvent]);

  if (isResolvingInitialPage || !currentPage) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const CurrentComponent = currentPage.Component;
  return (
    <CurrentComponent
      pageId={currentPage.id}
      pageIndex={currentIndex}
      totalPages={pages.length}
      isInitializing={isPageInitializing}
      eventBus={busRef.current}
      next={goNext}
      back={goBack}
      exit={exitWorkflow}
      emit={emit}
    />
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
