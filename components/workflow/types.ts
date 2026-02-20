import type { Href } from "expo-router";
import type { ComponentType } from "react";
import type { WorkflowEventBus } from "./WorkflowEventBus";

export interface WorkflowEvent {
  type: string;
  payload?: unknown;
  pageId: string;
  pageIndex: number;
}

export interface WorkflowControls {
  next: (options?: { skipHistory?: boolean }) => Promise<void> | void;
  back: () => void;
  exit: (target?: Href) => Promise<void> | void;
  emit: (eventName: string, payload?: unknown) => void;
}

export interface WorkflowPageProps extends WorkflowControls {
  pageId: string;
  pageIndex: number;
  totalPages: number;
  isInitializing: boolean;
  eventBus: WorkflowEventBus;
}

export interface WorkflowPageDefinition {
  id: string;
  Component: ComponentType<WorkflowPageProps>;
  initialize?: () => Promise<void> | void;
}

export interface PagesWorkflowProps {
  workflowId: string;
  pages: WorkflowPageDefinition[];
  exitTo: Href;
  firstPageBackTo?: Href;
  resolveInitialPage?: () => Promise<number | string | null | undefined> | number | string | null | undefined;
  onEvent?: (event: WorkflowEvent, controls: WorkflowControls) => boolean | void;
  onAdvance?: (fromIndex: number, toIndex: number) => Promise<void> | void;
  onExit?: () => Promise<void> | void;
}
