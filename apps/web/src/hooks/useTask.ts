import { useCallback, useEffect, useRef, useState } from "react";
import type {
  TaskOutputChunk,
  TaskRecord,
  TaskStreamEvent,
} from "@skilldock/shared";
import { createTaskEventSource, fetchTask } from "../lib/api";

export function useTask() {
  const [activeTask, setActiveTask] = useState<{
    title: string;
    task: TaskRecord;
    transport: "sse" | "polling";
  } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (taskId: string, title: string) => {
      stop();
      pollingRef.current = setInterval(() => {
        void fetchTask(taskId)
          .then((response) => {
            setActiveTask({ title, task: response.task, transport: "polling" });
            if (
              response.task.status === "succeeded" ||
              response.task.status === "failed"
            ) {
              stop();
            }
          })
          .catch(() => {
            // polling errors are silent
          });
      }, 1200);
    },
    [stop],
  );

  const watch = useCallback(
    (taskId: string, title: string) => {
      stop();
      const es = createTaskEventSource(taskId);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        let data: TaskStreamEvent;
        try {
          data = JSON.parse(event.data) as TaskStreamEvent;
        } catch {
          return;
        }
        if (
          (data.type === "snapshot" || data.type === "status") &&
          (data.task.status === "succeeded" || data.task.status === "failed")
        ) {
          es.close();
          if (eventSourceRef.current === es) {
            eventSourceRef.current = null;
          }
        }
        setActiveTask((current) => {
          if (data.type === "snapshot" || data.type === "status") {
            return { title, task: data.task, transport: "sse" };
          }
          if (data.type === "chunk") {
            const baseTask =
              current?.task?.id === taskId
                ? current.task
                : ({
                    id: taskId,
                    source: title,
                    status: "running" as const,
                    createdAt: new Date().toISOString(),
                    output: [],
                  } satisfies TaskRecord);

            return {
              title,
              task: {
                ...baseTask,
                output: [...baseTask.output, data.chunk],
              },
              transport: "sse" as const,
            };
          }
          return current;
        });
      };

      es.onerror = () => {
        es.close();
        if (eventSourceRef.current === es) {
          eventSourceRef.current = null;
        }
        startPolling(taskId, title);
      };
    },
    [stop, startPolling],
  );

  const loadTask = useCallback(
    async (taskId: string, title: string) => {
      const response = await fetchTask(taskId);
      const task = response.task;
      setActiveTask({ title, task, transport: "sse" });
      watch(taskId, title);
      if (task.status === "succeeded" || task.status === "failed") {
        return;
      }
    },
    [watch],
  );

  // Cleanup
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { activeTask, setActiveTask, watch, loadTask, stop };
}
