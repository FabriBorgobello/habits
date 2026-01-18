import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Habit } from "@/db/schema";
import { useCreateHabit, useUpdateHabit } from "@/hooks/use-habits";
import { DEFAULT_COLOR, DEFAULT_ICON, HABIT_COLORS, HABIT_ICONS } from "@/lib/habit-constants";
import { cn } from "@/lib/utils";

interface HabitModalProps {
  open: boolean;
  onClose: () => void;
  editingHabit?: Habit | null;
}

type FrequencyType = "daily" | "weekly_count" | "specific_days";

const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

export function HabitModal({ open, onClose, editingHabit }: HabitModalProps) {
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  // Extract initial values from editing habit
  const getInitialFrequencyType = (): FrequencyType => {
    if (!editingHabit) return "daily";
    if (editingHabit.frequency === "daily") return "daily";
    if (editingHabit.frequencyConfig) {
      const config = editingHabit.frequencyConfig as
        | { type: "weekly_count"; count: number }
        | { type: "specific_days"; days: number[] };
      return config.type === "weekly_count" ? "weekly_count" : "specific_days";
    }
    return "daily";
  };

  const getInitialWeeklyCount = (): number => {
    if (!editingHabit?.frequencyConfig) return 3;
    const config = editingHabit.frequencyConfig as { type: string; count?: number };
    return config.type === "weekly_count" && config.count ? config.count : 3;
  };

  const getInitialSelectedDays = (): number[] => {
    if (!editingHabit?.frequencyConfig) return [new Date().getDay()];
    const config = editingHabit.frequencyConfig as { type: string; days?: number[] };
    return config.type === "specific_days" && config.days ? config.days : [new Date().getDay()];
  };

  const form = useForm({
    defaultValues: {
      name: editingHabit?.name || "",
      colorHex: editingHabit?.colorHex || DEFAULT_COLOR,
      icon: editingHabit?.icon || DEFAULT_ICON,
      frequencyType: getInitialFrequencyType(),
      weeklyCount: getInitialWeeklyCount(),
      selectedDays: getInitialSelectedDays(),
    },
    onSubmit: async ({ value }) => {
      const habitData = {
        name: value.name,
        description: "",
        category: "",
        colorHex: value.colorHex,
        icon: value.icon,
        frequency: value.frequencyType === "daily" ? ("daily" as const) : ("custom" as const),
        frequencyConfig:
          value.frequencyType === "daily"
            ? null
            : value.frequencyType === "weekly_count"
              ? { type: "weekly_count" as const, count: value.weeklyCount }
              : { type: "specific_days" as const, days: value.selectedDays },
      };

      try {
        if (editingHabit) {
          await updateHabit.mutateAsync({ ...habitData, id: editingHabit.id });
        } else {
          await createHabit.mutateAsync(habitData);
          form.reset();
        }
        onClose();
      } catch (error) {
        console.error("Failed to save habit:", error);
      }
    },
  });

  const getFrequencyText = (frequencyType: FrequencyType, weeklyCount: number, selectedDays: number[]) => {
    if (frequencyType === "daily") return "Every day";
    if (frequencyType === "weekly_count") return `${weeklyCount}x per week`;
    return `${selectedDays.length} days per week`;
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setTimeout(() => form.reset(), 200);
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={handleOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-zinc-950 flex flex-col rounded-t-3xl max-h-[85dvh] fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)]">
          {/* Fixed handle and title */}
          <div className="shrink-0 px-4 pt-4 sm:pt-6 bg-zinc-950 rounded-t-3xl">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-zinc-700 mb-4 sm:mb-6" />
            <Drawer.Title className="text-white text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
              {editingHabit ? "Edit Habit" : "New Habit"}
            </Drawer.Title>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-6 sm:pb-6">
            <motion.form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4 sm:space-y-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {/* Name */}
                <form.Field
                  name="name"
                  validators={{
                    onBlur: ({ value }) => (!value?.trim() ? "Name is required" : undefined),
                  }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name} className="text-xs uppercase text-gray-400">
                        Name
                      </Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Morning yoga"
                        className="bg-zinc-950 border-zinc-800 text-white placeholder:text-gray-500"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <em className="text-xs text-red-400">{field.state.meta.errors.join(", ")}</em>
                      )}
                    </div>
                  )}
                </form.Field>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {/* Color */}
                <form.Field name="colorHex">
                  {(field) => (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-gray-400">Color</Label>
                      <div className="flex gap-2 sm:gap-3">
                        {HABIT_COLORS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => field.handleChange(color.value)}
                            className={cn(
                              "w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all",
                              field.state.value === color.value
                                ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950"
                                : "hover:scale-110",
                            )}
                            style={{ backgroundColor: color.value }}
                            aria-label={`Select ${color.name} color`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </form.Field>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {/* Icon */}
                <form.Field name="icon">
                  {(field) => (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-gray-400">Icon</Label>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 justify-center">
                        {HABIT_ICONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => field.handleChange(emoji)}
                            className={cn(
                              "mx-auto w-full min-w-12 sm:min-w-14 h-12 sm:h-14 text-xl sm:text-2xl rounded-xl transition-all",
                              field.state.value === emoji
                                ? "bg-zinc-700 ring-2 ring-white"
                                : "bg-zinc-950 hover:bg-zinc-800",
                            )}
                            aria-label={`Select ${emoji} icon`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form.Field>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {/* Frequency */}
                <form.Field name="frequencyType">
                  {(frequencyField) => (
                    <div className="space-y-3">
                      <Label className="text-xs uppercase text-gray-400">Frequency</Label>

                      <div className="space-y-2">
                        {/* Daily */}
                        <button
                          type="button"
                          onClick={() => frequencyField.handleChange("daily")}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-lg transition-colors",
                            frequencyField.state.value === "daily"
                              ? "bg-zinc-700 text-white"
                              : "bg-zinc-950 text-gray-400 hover:bg-zinc-800",
                          )}
                        >
                          Every day
                        </button>

                        {/* Weekly Count */}
                        <div>
                          <button
                            type="button"
                            onClick={() => frequencyField.handleChange("weekly_count")}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-lg transition-colors",
                              frequencyField.state.value === "weekly_count"
                                ? "bg-zinc-700 text-white"
                                : "bg-zinc-950 text-gray-400 hover:bg-zinc-800",
                            )}
                          >
                            X times per week
                          </button>
                          {frequencyField.state.value === "weekly_count" && (
                            <form.Field name="weeklyCount">
                              {(countField) => (
                                <div className="mt-2 ml-4">
                                  <Input
                                    type="number"
                                    min={1}
                                    max={7}
                                    value={countField.state.value}
                                    onChange={(e) => countField.handleChange(Number(e.target.value))}
                                    className="w-full bg-zinc-950 border-zinc-800 text-white"
                                  />
                                  {countField.state.meta.errors.length > 0 && (
                                    <em className="text-xs text-red-400">{countField.state.meta.errors.join(", ")}</em>
                                  )}
                                </div>
                              )}
                            </form.Field>
                          )}
                        </div>

                        {/* Specific Days */}
                        <div>
                          <button
                            type="button"
                            onClick={() => frequencyField.handleChange("specific_days")}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-lg transition-colors",
                              frequencyField.state.value === "specific_days"
                                ? "bg-zinc-700 text-white"
                                : "bg-zinc-950 text-gray-400 hover:bg-zinc-800",
                            )}
                          >
                            Specific days
                          </button>
                          {frequencyField.state.value === "specific_days" && (
                            <form.Field name="selectedDays">
                              {(daysField) => (
                                <div className="mt-2 ml-2 sm:ml-4">
                                  <div className="flex gap-1.5 sm:gap-2">
                                    {DAY_NAMES.map((day, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                          const current = daysField.state.value;
                                          const updated = current.includes(index)
                                            ? current.filter((d) => d !== index)
                                            : [...current, index].sort();
                                          daysField.handleChange(updated);
                                        }}
                                        className={cn(
                                          "w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base rounded-lg transition-colors",
                                          daysField.state.value.includes(index)
                                            ? "bg-white text-black"
                                            : "bg-zinc-950 text-gray-400 hover:bg-zinc-800",
                                        )}
                                      >
                                        {day}
                                      </button>
                                    ))}
                                  </div>
                                  {daysField.state.meta.errors.length > 0 && (
                                    <em className="text-xs text-red-400">{daysField.state.meta.errors.join(", ")}</em>
                                  )}
                                </div>
                              )}
                            </form.Field>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </form.Field>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {/* Preview */}
                <form.Subscribe
                  selector={(state) => ({
                    name: state.values.name,
                    icon: state.values.icon,
                    colorHex: state.values.colorHex,
                    frequencyType: state.values.frequencyType,
                    weeklyCount: state.values.weeklyCount,
                    selectedDays: state.values.selectedDays,
                  })}
                >
                  {({ name, icon, colorHex, frequencyType, weeklyCount, selectedDays }) => (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-gray-400">Preview</Label>
                      <div className="bg-zinc-950 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span className="text-xl sm:text-2xl shrink-0">{icon}</span>
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm sm:text-base truncate line-clamp-1">
                              {name || "Habit name"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {getFrequencyText(frequencyType, weeklyCount, selectedDays)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 sm:gap-1 shrink-0">
                          {[...Array(7)].map((_, i) => {
                            const isCompleted = i < 4;
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "w-4 h-4 sm:w-6 sm:h-6 rounded",
                                  isCompleted ? "border-0" : "bg-zinc-800 border border-zinc-700",
                                )}
                                style={isCompleted ? { backgroundColor: colorHex } : undefined}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </form.Subscribe>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                {/* Actions */}
                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                  {([canSubmit, isSubmitting]) => (
                    <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 text-sm sm:text-base text-gray-400 hover:text-white hover:bg-zinc-950"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                        className="flex-1 text-sm sm:text-base bg-white text-black hover:bg-gray-200"
                      >
                        {editingHabit ? "Save" : "Add"}
                      </Button>
                    </div>
                  )}
                </form.Subscribe>
              </motion.div>
            </motion.form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
