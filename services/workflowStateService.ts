import AsyncStorage from "@react-native-async-storage/async-storage";

const WORKFLOW_PROGRESS_PREFIX = "workflow_progress_";

function getWorkflowKey(workflowId: string): string {
  return `${WORKFLOW_PROGRESS_PREFIX}${workflowId}`;
}

export async function getWorkflowProgress(workflowId: string): Promise<number> {
  try {
    const rawValue = await AsyncStorage.getItem(getWorkflowKey(workflowId));
    if (!rawValue) {
      return 0;
    }
    const parsed = Number.parseInt(rawValue, 10);
    return Number.isNaN(parsed) ? 0 : Math.max(parsed, 0);
  } catch {
    return 0;
  }
}

export async function saveWorkflowProgress(workflowId: string, nextIndex: number): Promise<void> {
  const currentProgress = await getWorkflowProgress(workflowId);
  const safeProgress = Math.max(currentProgress, nextIndex);
  await AsyncStorage.setItem(getWorkflowKey(workflowId), String(safeProgress));
}
