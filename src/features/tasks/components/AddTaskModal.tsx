import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
import { Clock3, Flag, ListTodo, Tags, Target, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LocalizedDateInput } from "@/components/common/LocalizedDateInput";
import { ModalShell } from "@/components/common/ModalShell";
import { goalsRepository } from "@/domains/goals/repository";
import { Goal } from "@/domains/goals/types";
import { tasksRepository } from "@/domains/tasks/repository";
import {
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskSource,
  TaskSourceType,
  TaskStatus,
  TaskSubtask,
} from "@/domains/tasks/types";
import {
  normalizeTask,
  normalizeTaskSource,
  normalizeTaskSubtask,
  normalizeTaskTags,
} from "@/domains/tasks/task.utils";
import {
  getGoalPriorityDisplayName,
} from "@/features/goals/utils/goals.i18n";
import {
  generateTaskBasicEnrichment,
  generateTaskSourceSuggestions,
  generateTaskSubtaskSuggestions,
  TaskAiSuggestionError,
} from "@/features/tasks/ai/enrichTaskWithAi";
import {
  EditableAiBasicSuggestion,
  EditableAiSourceSuggestion,
  EditableAiSubtaskSuggestion,
  AiTaskSuggestionMode,
  AiTaskSuggestionsModal,
} from "@/features/tasks/components/AiTaskSuggestionsModal";
import { AiTaskActionButton } from "@/features/tasks/components/AiTaskActionButton";
import { TaskSourcesEditor } from "@/features/tasks/components/TaskSourcesEditor";
import { SubtasksEditor } from "@/features/tasks/components/SubtasksEditor";
import { TaskTree } from "@/features/tasks/components/TaskTree";
import { buildTaskTree, getAllDescendantTasks } from "@/features/tasks/utils/taskHierarchy";
import { buildSearchLink } from "@/features/search/searchProvider";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/i18n/formatters";
import { createId } from "@/lib/id";

interface TaskModalProps {
  isOpen: boolean;
  mode?: "create" | "edit";
  goalId?: string;
  goalTitle?: string;
  initialValues?: Partial<CreateTaskInput>;
  initialTask?: Task | null;
  onSaved?: (task: Task) => void;
  onClose: () => void;
}

interface TaskFormState {
  title: string;
  description: string;
  tags: string[];
  goalConnection: "standalone" | "linked";
  selectedGoalId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  estimatedDurationMinutes: string;
  sources: TaskSource[];
  subtasks: TaskSubtask[];
}

const DEFAULT_FORM_STATE: TaskFormState = {
  title: "",
  description: "",
  tags: [],
  goalConnection: "standalone",
  selectedGoalId: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  estimatedDurationMinutes: "",
  sources: [],
  subtasks: [],
};

function sanitizeFormState(formState: TaskFormState): TaskFormState {
  return {
    ...formState,
    title: formState.title.trim(),
    description: formState.description.trim(),
    tags: normalizeTaskTags(formState.tags),
    dueDate: formState.dueDate,
    estimatedDurationMinutes: formState.estimatedDurationMinutes.trim(),
    sources: formState.sources.map((source) => ({
      ...source,
      label: source.label.trim(),
      query: source.query?.trim() ?? "",
      value: source.value.trim(),
      note: source.note?.trim() ?? "",
    })),
    subtasks: formState.subtasks.map((subtask) => ({
      ...subtask,
      title: subtask.title.trim(),
      description: subtask.description?.trim() ?? "",
    })),
  };
}

function createEmptyTaskFormState(
  defaultGoalId?: string,
  initialValues?: Partial<CreateTaskInput>,
): TaskFormState {
  return {
    ...DEFAULT_FORM_STATE,
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    tags: normalizeTaskTags(initialValues?.tags ?? []),
    goalConnection: initialValues?.goalId || defaultGoalId ? "linked" : "standalone",
    selectedGoalId: initialValues?.goalId ?? defaultGoalId ?? "",
    status: initialValues?.status ?? "todo",
    priority: initialValues?.priority ?? "medium",
    dueDate: initialValues?.dueDate ?? initialValues?.scheduledDate ?? "",
    estimatedDurationMinutes: initialValues?.estimatedDurationMinutes
      ? String(initialValues.estimatedDurationMinutes)
      : "",
    sources: [],
    subtasks: [],
  };
}

function getFormStateFromTask(task: Task): TaskFormState {
  const normalizedTask = normalizeTask(task);

  return {
    title: normalizedTask.title,
    description: normalizedTask.description ?? "",
    tags: normalizedTask.tags,
    goalConnection: normalizedTask.goalId ? "linked" : "standalone",
    selectedGoalId: normalizedTask.goalId ?? "",
    status: normalizedTask.status,
    priority: normalizedTask.priority,
    dueDate: normalizedTask.dueDate ?? normalizedTask.scheduledDate ?? "",
    estimatedDurationMinutes: normalizedTask.estimatedDurationMinutes
      ? String(normalizedTask.estimatedDurationMinutes)
      : "",
    sources: normalizedTask.sources.map((source) => ({
      ...source,
      note: source.note ?? "",
    })),
    subtasks: normalizedTask.subtasks.map((subtask) => ({
      ...subtask,
      description: subtask.description ?? "",
    })),
  };
}

function createTaskAiContext(
  formState: TaskFormState,
  language: "en" | "fa",
  selectedGoal?: Goal,
): Parameters<typeof generateTaskBasicEnrichment>[0] {
  const todayDate = getTodayIsoDate();
  return {
    appLanguage: language,
    currentStatus: formState.status,
    description: formState.description.trim(),
    dueDate: formState.dueDate,
    estimatedDurationMinutes: formState.estimatedDurationMinutes,
    existingSources: formState.sources,
    existingSubtasks: formState.subtasks,
    goalCategory: selectedGoal?.category,
    goalDeadline: selectedGoal?.deadline,
    goalDescription: selectedGoal?.description,
    goalIsOverdue: Boolean(selectedGoal?.deadline && selectedGoal.deadline < todayDate),
    goalStatus: selectedGoal?.status,
    goalTitle: selectedGoal?.title,
    priority: formState.priority,
    tags: formState.tags,
    todayDate,
    title: formState.title.trim(),
    userLocale: language === "fa" ? "fa-IR" : "en-US",
  };
}

function createEditableBasicSuggestion(
  suggestion: Awaited<ReturnType<typeof generateTaskBasicEnrichment>>,
): EditableAiBasicSuggestion {
  return {
    description: suggestion.description ?? "",
    dueDate: suggestion.dueDate ?? "",
    estimatedMinutes: suggestion.estimatedMinutes ? String(suggestion.estimatedMinutes) : "",
    priority: suggestion.priority ?? "medium",
    selectedDescription: Boolean(suggestion.description?.trim()),
    selectedDueDate: Boolean(suggestion.dueDate),
    selectedEstimatedMinutes: Boolean(suggestion.estimatedMinutes),
    selectedPriority: Boolean(suggestion.priority),
    selectedTitle: Boolean(suggestion.title?.trim()),
    tags: suggestion.tags.map((tag) => ({
      id: createId(),
      label: tag,
      selected: true,
    })),
    title: suggestion.title ?? "",
  };
}

function createEditableSubtaskSuggestions(
  suggestions: Awaited<ReturnType<typeof generateTaskSubtaskSuggestions>>,
): EditableAiSubtaskSuggestion[] {
  return suggestions.map((suggestion) => ({
    description: suggestion.description ?? "",
    estimatedMinutes: suggestion.estimatedMinutes,
    id: createId(),
    priority: suggestion.priority,
    selected: true,
    title: suggestion.title,
  }));
}

function createEditableSourceSuggestions(
  suggestions: Awaited<ReturnType<typeof generateTaskSourceSuggestions>>,
): EditableAiSourceSuggestion[] {
  return suggestions.map((suggestion) => ({
    content: suggestion.content ?? "",
    description: suggestion.description ?? "",
    id: createId(),
    mode: suggestion.mode,
    query: suggestion.query ?? "",
    selected: true,
    title: suggestion.title,
    type: suggestion.type,
    url:
      suggestion.url ??
      (suggestion.mode === "search"
        ? buildGeneratedSearchUrl(suggestion.type, suggestion.query ?? "")
        : ""),
  }));
}

function getTaskAiErrorMessage(
  error: unknown,
  t: (key: string) => string,
): string {
  if (error instanceof TaskAiSuggestionError) {
    switch (error.code) {
      case "ai-disabled":
        return t("tasks.ai.errors.disabled");
      case "ai-incomplete":
        return t("tasks.ai.errors.incomplete");
      case "ai-empty":
        return t("tasks.ai.errors.empty");
      case "ai-request-failed":
      default:
        return t("tasks.ai.errors.failed");
    }
  }

  return t("tasks.ai.errors.failed");
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isGoalOverdue(goal?: Goal): boolean {
  return Boolean(goal?.deadline && goal.deadline < getTodayIsoDate());
}

function getSourceDuplicateKey(
  source: Pick<TaskSource, "type" | "label" | "value" | "note" | "query">,
): string {
  return [
    source.type,
    source.label.trim().toLocaleLowerCase(),
    source.value.trim().toLocaleLowerCase(),
    (source.query ?? "").trim().toLocaleLowerCase(),
    (source.note ?? "").trim().toLocaleLowerCase(),
  ].join("|");
}

function getAiSourceSuggestionDuplicateKey(source: EditableAiSourceSuggestion): string {
  return [
    source.type,
    source.mode,
    source.title.trim().toLocaleLowerCase(),
    source.url.trim().toLocaleLowerCase(),
    source.query.trim().toLocaleLowerCase(),
    source.content.trim().toLocaleLowerCase(),
    source.description.trim().toLocaleLowerCase(),
  ].join("|");
}

function buildGeneratedSearchUrl(type: TaskSourceType, query: string): string {
  const searchLink = buildSearchLink({
    query,
    type: type === "video" ? "youtube" : "web",
  });

  return searchLink?.url ?? "";
}

export function TaskModal({
  goalId,
  goalTitle,
  initialValues,
  initialTask = null,
  isOpen,
  mode = "create",
  onSaved,
  onClose,
}: TaskModalProps): JSX.Element | null {
  const { language, t } = useI18n();
  const [formState, setFormState] = useState<TaskFormState>(createEmptyTaskFormState);
  const [tagDraft, setTagDraft] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [aiMode, setAiMode] = useState<AiTaskSuggestionMode | null>(null);
  const [aiError, setAiError] = useState("");
  const [aiNotice, setAiNotice] = useState("");
  const [isAiApplying, setIsAiApplying] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [basicSuggestion, setBasicSuggestion] = useState<EditableAiBasicSuggestion | null>(null);
  const [subtaskSuggestions, setSubtaskSuggestions] = useState<EditableAiSubtaskSuggestion[]>([]);
  const [sourceSuggestions, setSourceSuggestions] = useState<EditableAiSourceSuggestion[]>([]);
  const goals = useLiveQuery(() => goalsRepository.getAll(), [], []);
  const allTasks = useLiveQuery(() => tasksRepository.getAll(), [], []);
  const taskTree = useMemo(
    () => (mode === "edit" && initialTask ? buildTaskTree(allTasks ?? [], initialTask.id) : null),
    [allTasks, initialTask, mode],
  );
  const descendantTasks = useMemo(
    () => (mode === "edit" && initialTask ? getAllDescendantTasks(allTasks ?? [], initialTask.id) : []),
    [allTasks, initialTask, mode],
  );

  const initialFormState = useMemo(
    () =>
      mode === "edit" && initialTask
        ? getFormStateFromTask(initialTask)
        : createEmptyTaskFormState(goalId, initialValues),
    [goalId, initialTask, initialValues, mode],
  );
  const hasGoals = (goals?.length ?? 0) > 0;
  const selectedGoal = useMemo(
    () => (goals ?? []).find((goal) => goal.id === formState.selectedGoalId),
    [formState.selectedGoalId, goals],
  );
  const descendantTaskIds = useMemo(
    () => new Set(descendantTasks.map((task) => task.id)),
    [descendantTasks],
  );
  const embeddedSubtasks = useMemo(
    () => formState.subtasks.filter((subtask) => !descendantTaskIds.has(subtask.id)),
    [descendantTaskIds, formState.subtasks],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormState(initialFormState);
    setError("");
    setIsSubmitting(false);
    setShowDiscardDialog(false);
    setTagDraft("");
    setAiMode(null);
    setAiError("");
    setAiNotice("");
    setIsAiApplying(false);
    setIsAiGenerating(false);
    setBasicSuggestion(null);
    setSubtaskSuggestions([]);
    setSourceSuggestions([]);
  }, [initialFormState, isOpen]);

  const serializedBaseline = useMemo(() => JSON.stringify(sanitizeFormState(initialFormState)), [
    initialFormState,
  ]);
  const hasPendingTagDraft = tagDraft.trim().length > 0;
  const isDirty = useMemo(
    () => JSON.stringify(sanitizeFormState(formState)) !== serializedBaseline || hasPendingTagDraft,
    [formState, hasPendingTagDraft, serializedBaseline],
  );

  function commitTag(rawTag: string): void {
    const nextTag = rawTag.trim();

    if (!nextTag) {
      setTagDraft("");
      return;
    }

    setFormState((current) => ({
      ...current,
      tags: normalizeTaskTags([...current.tags, nextTag]),
    }));
    setTagDraft("");
  }

  function removeTag(tagToRemove: string): void {
    setFormState((current) => ({
      ...current,
      tags: current.tags.filter((tag) => tag !== tagToRemove),
    }));
  }

  function requestClose(): void {
    if (isSubmitting) {
      return;
    }

    if (isDirty) {
      setShowDiscardDialog(true);
      return;
    }

    onClose();
  }

  function updateEmbeddedSubtasks(nextEmbeddedSubtasks: TaskSubtask[]): void {
    setFormState((current) => ({
      ...current,
      subtasks: [
        ...current.subtasks.filter((subtask) => descendantTaskIds.has(subtask.id)),
        ...nextEmbeddedSubtasks,
      ],
    }));
  }

  async function runAiGeneration(nextMode: AiTaskSuggestionMode): Promise<void> {
    setAiMode(nextMode);
    setAiError("");
    setAiNotice("");
    setIsAiGenerating(true);

    try {
      const context = createTaskAiContext(formState, language, selectedGoal);

      if (nextMode === "basic") {
        const suggestion = await generateTaskBasicEnrichment(context);
        if (suggestion.hadInvalidDueDate) {
          setAiError(t("tasks.ai.invalidFutureDate"));
        }
        setBasicSuggestion(createEditableBasicSuggestion(suggestion));
      } else if (nextMode === "subtasks") {
        const suggestions = await generateTaskSubtaskSuggestions(context);
        const existingTitles = new Set(
          formState.subtasks.map((subtask) => subtask.title.trim().toLocaleLowerCase()).filter(Boolean),
        );

        const nextSuggestions = createEditableSubtaskSuggestions(suggestions).filter(
          (suggestion) => !existingTitles.has(suggestion.title.trim().toLocaleLowerCase()),
        );

        if (nextSuggestions.length === 0) {
          throw new TaskAiSuggestionError("ai-empty", "No usable subtask suggestions were generated.");
        }

        setSubtaskSuggestions(nextSuggestions);
      } else {
        const suggestions = await generateTaskSourceSuggestions(context);
        const existingKeys = new Set(formState.sources.map(getSourceDuplicateKey));

        const nextSuggestions = createEditableSourceSuggestions(suggestions).filter((suggestion) => {
            const normalizedSource = normalizeTaskSource({
              type: suggestion.type,
              label: suggestion.title,
              note:
                suggestion.mode === "search"
                  ? [suggestion.query, suggestion.description || suggestion.content]
                      .filter(Boolean)
                      .join("\n")
                  : suggestion.description || suggestion.content,
              value:
                suggestion.mode === "url"
                  ? suggestion.url
                  : suggestion.type === "link" || suggestion.type === "video"
                  ? ""
                  : suggestion.query || suggestion.content,
            });

            return !existingKeys.has(getSourceDuplicateKey(normalizedSource));
          });

        if (nextSuggestions.length === 0) {
          throw new TaskAiSuggestionError("ai-empty", "No usable source suggestions were generated.");
        }

        setSourceSuggestions(nextSuggestions);
        setAiNotice(t("tasks.ai.searchLinkGenerated"));
      }
    } catch (nextError) {
      setAiError(getTaskAiErrorMessage(nextError, t));
      if (nextMode === "basic") {
        setBasicSuggestion(null);
      } else if (nextMode === "subtasks") {
        setSubtaskSuggestions([]);
      } else {
        setSourceSuggestions([]);
      }
    } finally {
      setIsAiGenerating(false);
    }
  }

  function closeAiModal(): void {
    if (isAiGenerating || isAiApplying) {
      return;
    }

    setAiMode(null);
    setAiError("");
  }

  function applyAiSuggestions(): void {
    if (!aiMode) {
      return;
    }

    setIsAiApplying(true);
    setAiError("");

    try {
      if (aiMode === "basic" && basicSuggestion) {
        const today = getTodayIsoDate();
        const canApplyDueDate =
          !basicSuggestion.selectedDueDate ||
          !basicSuggestion.dueDate ||
          basicSuggestion.dueDate >= today ||
          isGoalOverdue(selectedGoal);

        setFormState((current) => ({
          ...current,
          title:
            basicSuggestion.selectedTitle && basicSuggestion.title.trim()
              ? basicSuggestion.title.trim()
              : current.title,
          description:
            basicSuggestion.selectedDescription && basicSuggestion.description.trim()
              ? basicSuggestion.description.trim()
              : current.description,
          dueDate:
            basicSuggestion.selectedDueDate && canApplyDueDate
              ? basicSuggestion.dueDate
              : current.dueDate,
          estimatedDurationMinutes:
            basicSuggestion.selectedEstimatedMinutes &&
            Number(basicSuggestion.estimatedMinutes) > 0
              ? basicSuggestion.estimatedMinutes
              : current.estimatedDurationMinutes,
          priority: basicSuggestion.selectedPriority ? basicSuggestion.priority : current.priority,
          tags: normalizeTaskTags([
            ...current.tags,
            ...basicSuggestion.tags
              .filter((tag) => tag.selected && tag.label.trim())
              .map((tag) => tag.label),
          ]),
        }));
      }

      if (aiMode === "subtasks") {
        const existingTitles = new Set(
          formState.subtasks.map((subtask) => subtask.title.trim().toLocaleLowerCase()).filter(Boolean),
        );
        const nextEmbeddedSubtasks = [
          ...embeddedSubtasks,
          ...subtaskSuggestions
            .filter((suggestion) => suggestion.selected && suggestion.title.trim())
            .map((suggestion) => normalizeTaskSubtask({
              id: createId(),
              title: suggestion.title,
              description: suggestion.description,
              completed: false,
            }))
            .filter((subtask) => {
              const key = subtask.title.trim().toLocaleLowerCase();
              if (!key || existingTitles.has(key)) {
                return false;
              }

              existingTitles.add(key);
              return true;
            }),
        ];

        updateEmbeddedSubtasks(nextEmbeddedSubtasks);
      }

      if (aiMode === "sources") {
        const existingKeys = new Set(formState.sources.map(getSourceDuplicateKey));
        const seenSuggestionKeys = new Set<string>();
        const nextSources = [
          ...formState.sources,
          ...sourceSuggestions
            .filter(
              (suggestion) =>
                suggestion.selected &&
                suggestion.title.trim() &&
                (suggestion.mode === "url"
                  ? Boolean(suggestion.url.trim())
                  : Boolean(suggestion.query.trim()) || suggestion.type === "note"),
            )
            .map((suggestion) => ({
              suggestionKey: getAiSourceSuggestionDuplicateKey(suggestion),
              source: normalizeTaskSource({
                id: createId(),
                label: suggestion.title,
                generatedFromAiSearch: suggestion.mode === "search",
                note:
                  suggestion.mode === "search"
                    ? [suggestion.query, suggestion.description || suggestion.content]
                        .filter(Boolean)
                        .join("\n")
                    : suggestion.description || suggestion.content,
                origin: suggestion.type === "note" ? "local" : "url",
                query: suggestion.mode === "search" ? suggestion.query : undefined,
                type: suggestion.type,
                value:
                  suggestion.mode === "url"
                    ? suggestion.url
                    : suggestion.type === "note"
                    ? suggestion.content
                    : suggestion.type === "link" || suggestion.type === "video"
                      ? ""
                      : suggestion.query,
              }),
            }))
            .filter(({ source, suggestionKey }) => {
              const key = getSourceDuplicateKey(source);
              if (existingKeys.has(key) || seenSuggestionKeys.has(suggestionKey)) {
                return false;
              }

              existingKeys.add(key);
              seenSuggestionKeys.add(suggestionKey);
              return true;
            })
            .map(({ source }) => source),
        ];

        setFormState((current) => ({
          ...current,
          sources: nextSources,
        }));
      }

      setAiMode(null);
      setAiError("");
    } finally {
      setIsAiApplying(false);
    }
  }

  function updateAiSourceSuggestion(
    sourceId: string,
    patch: Partial<EditableAiSourceSuggestion>,
  ): void {
    setSourceSuggestions((current) =>
      current.map((source) => {
        if (source.id !== sourceId) {
          return source;
        }

        const nextSource = { ...source, ...patch };

        if (nextSource.mode === "search") {
          nextSource.url = buildGeneratedSearchUrl(nextSource.type, nextSource.query);
        } else if (patch.mode === "url" && !patch.url) {
          nextSource.url = source.url;
        }

        if (nextSource.type === "note") {
          nextSource.mode = "search";
          nextSource.url = "";
        }

        return nextSource;
      }),
    );
  }

  async function handleSubmit(): Promise<void> {
    const normalizedTags = normalizeTaskTags(
      hasPendingTagDraft ? [...formState.tags, tagDraft] : formState.tags,
    );
    const normalizedSources = formState.sources
      .map((source) => ({
        ...source,
        query: source.query?.trim() || undefined,
        label: source.label.trim(),
        value: source.value.trim(),
        note: source.note?.trim() || undefined,
        previewUrl: source.origin === "local" ? undefined : source.previewUrl,
      }))
      .filter((source) => source.label || source.value || source.note || source.query);
    const normalizedSubtasks = formState.subtasks
      .map((subtask) => ({
        ...subtask,
        title: subtask.title.trim(),
        description: subtask.description?.trim() || undefined,
      }))
      .filter((subtask) => subtask.title);

    if (!formState.title.trim()) {
      setError(t("tasks.modal.errors.titleRequired"));
      return;
    }

    if (formState.goalConnection === "linked" && !formState.selectedGoalId) {
      setError(t("tasks.modal.errors.goalRequired"));
      return;
    }

    const invalidLink = normalizedSources.find(
      (source) =>
        source.origin !== "local" &&
        (source.type === "link" || source.type === "video" || source.type === "image") &&
        source.value &&
        !isValidUrl(source.value),
    );

    if (invalidLink) {
      setError(
        t("tasks.modal.errors.invalidLink", {
          label: invalidLink.label || invalidLink.value,
        }),
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    const input: CreateTaskInput = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      tags: normalizedTags,
      status: formState.status,
      priority: formState.priority,
      goalId: formState.goalConnection === "linked" ? formState.selectedGoalId : undefined,
      dueDate: formState.dueDate || undefined,
      estimatedDurationMinutes: formState.estimatedDurationMinutes
        ? Number(formState.estimatedDurationMinutes)
        : undefined,
      sources: normalizedSources,
      subtasks: normalizedSubtasks,
    };

    try {
      let savedTask: Task;

      if (mode === "edit" && initialTask) {
        savedTask = await tasksRepository.update({
          ...initialTask,
          title: input.title,
          description: input.description,
          notes: input.description,
          tags: input.tags ?? initialTask.tags,
          status: input.status ?? initialTask.status,
          priority: input.priority ?? initialTask.priority,
          goalId: input.goalId,
          dueDate: input.dueDate,
          scheduledDate: input.dueDate,
          estimatedDurationMinutes: input.estimatedDurationMinutes,
          sources: input.sources ?? initialTask.sources,
          subtasks: input.subtasks ?? initialTask.subtasks,
        });
      } else if (goalId) {
        savedTask = await tasksRepository.addTaskToGoal(goalId, input);
      } else {
        savedTask = await tasksRepository.add(input);
      }

      onSaved?.(savedTask);
      onClose();
    } catch {
      setError(
        mode === "edit"
          ? t("tasks.modal.errors.updateFailed")
          : t("tasks.modal.errors.saveFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  async function handleAddNestedSubtask(parentTask: Task): Promise<void> {
    const title = window.prompt(t("tasks.modal.prompts.subtaskTitle"));

    if (!title?.trim()) {
      return;
    }

    const subtask = await tasksRepository.add({
      title: title.trim(),
      goalId: parentTask.goalId ?? initialTask?.goalId ?? goalId,
      parentTaskId: parentTask.id,
      priority: "medium",
      status: "todo",
    });
    await tasksRepository.update({
      ...parentTask,
      subtasks: [
        ...parentTask.subtasks.filter((item) => item.id !== subtask.id),
        {
          id: subtask.id,
          title: subtask.title,
          description: subtask.description,
          completed: false,
        },
      ],
    });
  }

  async function handleEditNestedTask(task: Task): Promise<void> {
    const title = window.prompt(t("tasks.modal.prompts.taskTitle"), task.title);

    if (!title?.trim() || title.trim() === task.title) {
      return;
    }

    await tasksRepository.update({
      ...task,
      title: title.trim(),
    });
  }

  async function handleToggleNestedTask(task: Task): Promise<void> {
    await tasksRepository.toggleTaskComplete(task.id);
  }

  return (
    <>
      <ModalShell
        description={
          mode === "edit"
            ? t("tasks.modal.descriptionEdit")
            : goalTitle
              ? t("tasks.modal.descriptionCreateGoal", { goalTitle })
              : t("tasks.modal.descriptionCreate")
        }
        footer={
          <div className="modal-action-row">
            <Button onClick={requestClose} type="button" variant="ghost">
              {t("common.cancel")}
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleSubmit()} type="button">
              {isSubmitting
                ? t("common.saving")
                : mode === "edit"
                  ? t("goals.edit.saveChanges")
                  : t("tasks.modal.saveTask")}
            </Button>
          </div>
        }
        isOpen={isOpen}
        onRequestClose={requestClose}
        size="wide"
        title={
          mode === "edit"
            ? t("tasks.modal.editTitle")
            : goalTitle
              ? t("tasks.modal.addTaskToGoalTitle", { goalTitle })
              : t("tasks.modal.addTaskTitle")
        }
      >
        <div className="task-modal-layout">
          <section className="task-editor-section task-editor-section--surface">
            <div className="task-editor-section__header">
              <div>
                <h3 className="task-editor-section__title">{t("tasks.modal.sections.basicInfo")}</h3>
                <p className="task-editor-section__description">{t("tasks.modal.sections.basicInfoDescription")}</p>
              </div>
              {mode === "edit" ? (
                <AiTaskActionButton
                  disabled={isAiGenerating}
                  isLoading={isAiGenerating && aiMode === "basic"}
                  label={t("tasks.ai.improveBasic")}
                  loadingLabel={t("tasks.ai.thinking")}
                  onClick={() => {
                    void runAiGeneration("basic");
                  }}
                />
              ) : null}
            </div>

            <div className="task-form-grid">
              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">{t("tasks.modal.taskTitle")}</span>
                <input
                  className="auth-form__input"
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder={t("tasks.modal.placeholders.title")}
                  value={formState.title}
                />
              </label>

              <label className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">{t("tasks.modal.description")}</span>
                <textarea
                  className="auth-form__input task-modal-textarea"
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder={t("tasks.modal.placeholders.description")}
                  value={formState.description}
                />
              </label>

              <div className="auth-form__field task-form-grid__wide">
                <span className="auth-form__label">{t("tasks.modal.tags")}</span>
                <div className="task-tag-editor">
                  <div className="task-select-wrap task-tag-editor__input-wrap">
                    <Tags size={16} />
                    <input
                      className="auth-form__input"
                      onChange={(event) => setTagDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                          event.preventDefault();
                          commitTag(tagDraft);
                        }
                      }}
                      placeholder={t("tasks.modal.placeholders.tag")}
                      value={tagDraft}
                    />
                  </div>
                  <Button onClick={() => commitTag(tagDraft)} type="button" variant="secondary">
                    {t("tasks.modal.addTag")}
                  </Button>
                </div>
                {formState.tags.length > 0 ? (
                  <div className="task-tag-list" role="list" aria-label={t("tasks.modal.tagsAriaLabel")}>
                    {formState.tags.map((tag) => (
                      <span className="task-tag" key={tag} role="listitem">
                        <span>{tag}</span>
                        <button
                          aria-label={t("tasks.modal.removeTagAria", { tag })}
                          className="task-tag__remove"
                          onClick={() => removeTag(tag)}
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="task-tag-editor__hint">{t("tasks.modal.tagsHint")}</p>
                )}
              </div>

              <section className="task-form-grid__wide task-goal-link">
                <div className="task-editor-section__header">
                  <div>
                    <h4 className="task-editor-section__title">{t("tasks.modal.goalConnection")}</h4>
                    <p className="task-editor-section__description">{t("tasks.modal.goalConnectionDescription")}</p>
                  </div>
                </div>

                <div
                  className="task-goal-link__options"
                  role="radiogroup"
                  aria-label={t("tasks.modal.goalConnection")}
                >
                  <button
                    aria-pressed={formState.goalConnection === "standalone"}
                    className={`task-goal-link__option${
                      formState.goalConnection === "standalone"
                        ? " task-goal-link__option--active"
                        : ""
                    }`}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        goalConnection: "standalone",
                        selectedGoalId: "",
                      }))
                    }
                    type="button"
                  >
                    {t("tasks.modal.standalone")}
                  </button>
                  <button
                    aria-pressed={formState.goalConnection === "linked"}
                    className={`task-goal-link__option${
                      formState.goalConnection === "linked"
                        ? " task-goal-link__option--active"
                        : ""
                    }`}
                    disabled={!hasGoals}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        goalConnection: "linked",
                        selectedGoalId: current.selectedGoalId || goalId || goals?.[0]?.id || "",
                      }))
                    }
                    type="button"
                  >
                    {t("tasks.modal.linkedToGoal")}
                  </button>
                </div>

                {formState.goalConnection === "linked" ? (
                  <label className="auth-form__field">
                    <span className="auth-form__label">{t("navigation.goals")}</span>
                    <div className="task-select-wrap">
                      <Target size={16} />
                      <select
                        className="auth-form__input"
                        disabled={!hasGoals}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            selectedGoalId: event.target.value,
                          }))
                        }
                        value={formState.selectedGoalId}
                      >
                        <option value="">{t("tasks.modal.selectGoal")}</option>
                        {(goals ?? []).map((goal) => (
                          <option key={goal.id} value={goal.id}>
                            {goal.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>
                ) : null}

                {!hasGoals ? <p className="task-goal-link__hint">{t("tasks.modal.noGoalsHint")}</p> : null}
              </section>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("common.status")}</span>
                <div className="task-select-wrap">
                  <ListTodo size={16} />
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        status: event.target.value as TaskStatus,
                      }))
                    }
                    value={formState.status}
                  >
                    <option value="todo">{t("tasks.todo")}</option>
                    <option value="in_progress">{t("tasks.inProgress")}</option>
                    <option value="done">{t("tasks.done")}</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("common.priority")}</span>
                <div className="task-select-wrap">
                  <Flag size={16} />
                  <select
                    className="auth-form__input"
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        priority: event.target.value as TaskPriority,
                      }))
                    }
                    value={formState.priority}
                  >
                    <option value="low">{getGoalPriorityDisplayName("low", t)}</option>
                    <option value="medium">{getGoalPriorityDisplayName("medium", t)}</option>
                    <option value="high">{getGoalPriorityDisplayName("high", t)}</option>
                  </select>
                </div>
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("common.dueDate")}</span>
                <LocalizedDateInput
                  className="auth-form__input"
                  onChange={(nextValue) =>
                    setFormState((current) => ({ ...current, dueDate: nextValue }))
                  }
                  value={formState.dueDate}
                />
              </label>

              <label className="auth-form__field">
                <span className="auth-form__label">{t("tasks.modal.estimatedDuration")}</span>
                <div className="task-select-wrap">
                  <Clock3 size={16} />
                  <input
                    className="auth-form__input"
                    inputMode="numeric"
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        estimatedDurationMinutes: event.target.value.replace(/[^\d]/g, ""),
                      }))
                    }
                    placeholder={t("tasks.modal.placeholders.estimatedDuration")}
                    value={formState.estimatedDurationMinutes}
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="task-editor-section task-editor-section--surface">
            <TaskSourcesEditor
              headerActions={
                mode === "edit" ? (
                  <AiTaskActionButton
                    disabled={isAiGenerating}
                    isLoading={isAiGenerating && aiMode === "sources"}
                    label={t("tasks.ai.suggestSources")}
                    loadingLabel={t("tasks.ai.searchingSources")}
                    onClick={() => {
                      void runAiGeneration("sources");
                    }}
                  />
                ) : undefined
              }
              onChange={(sources) => setFormState((current) => ({ ...current, sources }))}
              sources={formState.sources}
            />
            {aiNotice ? <p className="task-ai-status-message">{aiNotice}</p> : null}
          </section>

          <section className="task-editor-section task-editor-section--surface">
            {mode === "edit" && initialTask ? (
              <div className="task-editor-section">
                <div className="task-editor-section__header">
                  <div>
                    <h3 className="task-editor-section__title">{t("tasks.modal.subtasks")}</h3>
                    <p className="task-editor-section__description">
                      {t("tasks.modal.subtasksProgress", {
                        completed: formatNumber(
                          descendantTasks.filter((task) => task.status === "done").length,
                          language,
                        ),
                        total: formatNumber(descendantTasks.length, language),
                      })}
                    </p>
                  </div>
                  <div className="task-editor-section__actions">
                    <AiTaskActionButton
                      disabled={isAiGenerating}
                      isLoading={isAiGenerating && aiMode === "subtasks"}
                      label={t("tasks.ai.generateSubtasks")}
                      loadingLabel={t("tasks.ai.thinking")}
                      onClick={() => {
                        void runAiGeneration("subtasks");
                      }}
                    />
                    <Button
                      onClick={() => {
                        void handleAddNestedSubtask(initialTask);
                      }}
                      type="button"
                      variant="secondary"
                    >
                      {t("tasks.modal.addSubtask")}
                    </Button>
                  </div>
                </div>
                {taskTree && taskTree.children.length > 0 ? (
                  <TaskTree
                    nodes={taskTree.children}
                    depth={1}
                    onAddSubtask={(task) => {
                      void handleAddNestedSubtask(task);
                    }}
                    onEditTask={(task) => {
                      void handleEditNestedTask(task);
                    }}
                    onToggleComplete={(task) => {
                      void handleToggleNestedTask(task);
                    }}
                  />
                ) : (
                  <div className="task-editor-empty-state">
                    <p className="task-editor-empty-state__title">{t("tasks.modal.noSubtasksYet")}</p>
                    <p className="task-editor-empty-state__description">
                      {t("tasks.modal.noSubtasksDescription")}
                    </p>
                  </div>
                )}
                {embeddedSubtasks.length > 0 ? (
                  <div className="task-ai-inline-subtasks">
                    <div className="task-editor-section__header">
                      <div>
                        <h4 className="task-editor-section__title">{t("tasks.ai.pendingSubtasksTitle")}</h4>
                        <p className="task-editor-section__description">
                          {t("tasks.ai.pendingSubtasksDescription")}
                        </p>
                      </div>
                    </div>
                    <div className="subtask-list">
                      {embeddedSubtasks.map((subtask, index) => (
                        <article className="subtask-card" key={subtask.id}>
                          <div className="subtask-card__fields">
                            <label className="auth-form__field">
                              <span className="auth-form__label">{t("tasks.modal.taskTitle")}</span>
                              <input
                                className="auth-form__input"
                                onChange={(event) =>
                                  updateEmbeddedSubtasks(
                                    embeddedSubtasks.map((item) =>
                                      item.id === subtask.id
                                        ? { ...item, title: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                                value={subtask.title}
                              />
                            </label>
                            <label className="auth-form__field">
                              <span className="auth-form__label">{t("tasks.modal.description")}</span>
                              <textarea
                                className="auth-form__input task-source-card__textarea"
                                onChange={(event) =>
                                  updateEmbeddedSubtasks(
                                    embeddedSubtasks.map((item) =>
                                      item.id === subtask.id
                                        ? { ...item, description: event.target.value }
                                        : item,
                                    ),
                                  )
                                }
                                value={subtask.description ?? ""}
                              />
                            </label>
                          </div>
                          <button
                            aria-label={t("tasks.modal.deleteSubtaskAria", { index: index + 1 })}
                            className="subtask-card__remove"
                            onClick={() =>
                              updateEmbeddedSubtasks(
                                embeddedSubtasks.filter((item) => item.id !== subtask.id),
                              )
                            }
                            type="button"
                          >
                            <X size={16} />
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <SubtasksEditor
                headerActions={
                  mode === "edit" ? (
                    <AiTaskActionButton
                      disabled={isAiGenerating}
                      isLoading={isAiGenerating && aiMode === "subtasks"}
                      label={t("tasks.ai.generateSubtasks")}
                      loadingLabel={t("tasks.ai.thinking")}
                      onClick={() => {
                        void runAiGeneration("subtasks");
                      }}
                    />
                  ) : undefined
                }
                onChange={(subtasks) => setFormState((current) => ({ ...current, subtasks }))}
                subtasks={formState.subtasks}
              />
            )}
          </section>

          {error ? <p className="auth-form__error">{error}</p> : null}
        </div>
      </ModalShell>

      <AiTaskSuggestionsModal
        basicSuggestion={basicSuggestion}
        dueDateMin={isGoalOverdue(selectedGoal) ? undefined : getTodayIsoDate()}
        error={aiError}
        isApplying={isAiApplying}
        isOpen={Boolean(aiMode)}
        isRegenerating={isAiGenerating}
        mode={aiMode}
        onApply={applyAiSuggestions}
        onBasicChange={(patch) =>
          setBasicSuggestion((current) => (current ? { ...current, ...patch } : current))
        }
        onClose={closeAiModal}
        onRegenerate={() => {
          if (aiMode) {
            void runAiGeneration(aiMode);
          }
        }}
        onRemoveSource={(sourceId) =>
          setSourceSuggestions((current) => current.filter((source) => source.id !== sourceId))
        }
        onRemoveSubtask={(subtaskId) =>
          setSubtaskSuggestions((current) => current.filter((subtask) => subtask.id !== subtaskId))
        }
        onSourceChange={updateAiSourceSuggestion}
        onSubtaskChange={(subtaskId, patch) =>
          setSubtaskSuggestions((current) =>
            current.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, ...patch } : subtask,
            ),
          )
        }
        onTagChange={(tagId, patch) =>
          setBasicSuggestion((current) =>
            current
              ? {
                  ...current,
                  tags: current.tags.map((tag) => (tag.id === tagId ? { ...tag, ...patch } : tag)),
                }
              : current,
          )
        }
        sourceSuggestions={sourceSuggestions}
        subtaskSuggestions={subtaskSuggestions}
      />

      <ConfirmDialog
        cancelLabel={t("tasks.modal.keepEditing")}
        confirmLabel={t("tasks.modal.discardChanges")}
        description={t("tasks.modal.discardDescription")}
        isOpen={showDiscardDialog}
        onCancel={() => setShowDiscardDialog(false)}
        onConfirm={() => {
          setShowDiscardDialog(false);
          onClose();
        }}
        title={t("tasks.modal.discardTitle")}
        tone="danger"
      />
    </>
  );
}

export const AddTaskModal = TaskModal;

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
