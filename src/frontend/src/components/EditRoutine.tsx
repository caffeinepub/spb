import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveRoutines } from "../hooks/useQueries";
import type { Category, LocalRoutineBlock } from "../types/planner";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
} from "../types/planner";
import { minutesToTime, timeToMinutes } from "../utils/timeUtils";

const CATEGORIES: Category[] = [
  "class",
  "study",
  "break",
  "meal",
  "exercise",
  "morning-routine",
  "free",
  "wind-down",
  "sleep",
];

interface Props {
  blocks: LocalRoutineBlock[];
  onSaved: (blocks: LocalRoutineBlock[]) => void;
}

export function EditRoutine({ blocks, onSaved }: Props) {
  const [localBlocks, setLocalBlocks] = useState<LocalRoutineBlock[]>(() =>
    blocks.map((b) => ({ ...b })),
  );
  const [newBlock, setNewBlock] = useState({
    blockLabel: "",
    startTime: "09:00",
    endTime: "10:00",
    category: "free" as Category,
  });
  const saveRoutines = useSaveRoutines();

  const updateBlock = (
    id: number,
    field: keyof LocalRoutineBlock,
    value: string | number,
  ) => {
    setLocalBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
  };

  const removeBlock = (id: number) => {
    setLocalBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const addBlock = () => {
    if (!newBlock.blockLabel.trim()) {
      toast.error("Please enter a block label");
      return;
    }
    const start = timeToMinutes(newBlock.startTime);
    const end = timeToMinutes(newBlock.endTime);
    if (end <= start) {
      toast.error("End time must be after start time");
      return;
    }
    const maxId = Math.max(0, ...localBlocks.map((b) => b.id));
    setLocalBlocks((prev) =>
      [
        ...prev,
        {
          id: maxId + 1,
          blockLabel: newBlock.blockLabel,
          startTime: start,
          endTime: end,
          category: newBlock.category,
          completed: false,
        },
      ].sort((a, b) => a.startTime - b.startTime),
    );
    setNewBlock({
      blockLabel: "",
      startTime: "09:00",
      endTime: "10:00",
      category: "free",
    });
  };

  const handleSave = async () => {
    const sorted = [...localBlocks].sort((a, b) => a.startTime - b.startTime);
    const routineInputs = sorted.map((b) => ({
      startTime: BigInt(b.startTime),
      endTime: BigInt(b.endTime),
      blockLabel: b.blockLabel,
      category: b.category,
    }));
    try {
      await saveRoutines.mutateAsync(routineInputs);
      toast.success("Routine saved! ✅");
      onSaved(sorted);
    } catch {
      toast.error("Failed to save routine");
    }
  };

  return (
    <div className="space-y-4">
      {/* Edit existing blocks */}
      <Card className="shadow-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Edit Blocks ({localBlocks.length})
            </CardTitle>
            <Button
              data-ocid="edit.save.button"
              onClick={handleSave}
              disabled={saveRoutines.isPending}
              size="sm"
            >
              {saveRoutines.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Routine
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <div className="px-4 pb-4 space-y-2" data-ocid="edit.blocks.list">
              <AnimatePresence>
                {localBlocks.map((block, idx) => (
                  <motion.div
                    key={block.id}
                    data-ocid={`edit.block.item.${idx + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 p-3 rounded-lg border border-border bg-card"
                  >
                    {/* Color indicator */}
                    <div
                      className="w-2 h-2 rounded-full mt-2 shrink-0"
                      style={{ background: CATEGORY_COLORS[block.category] }}
                    />
                    <div className="flex-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Input
                        data-ocid={`edit.block.label.${idx + 1}`}
                        value={block.blockLabel}
                        onChange={(e) =>
                          updateBlock(block.id, "blockLabel", e.target.value)
                        }
                        placeholder="Label"
                        className="col-span-2 sm:col-span-1 text-sm h-8"
                      />
                      <Input
                        type="time"
                        value={minutesToTime(block.startTime)}
                        onChange={(e) =>
                          updateBlock(
                            block.id,
                            "startTime",
                            timeToMinutes(e.target.value),
                          )
                        }
                        className="text-sm h-8"
                      />
                      <Input
                        type="time"
                        value={minutesToTime(block.endTime)}
                        onChange={(e) =>
                          updateBlock(
                            block.id,
                            "endTime",
                            timeToMinutes(e.target.value),
                          )
                        }
                        className="text-sm h-8"
                      />
                      <Select
                        value={block.category}
                        onValueChange={(v: Category) =>
                          updateBlock(block.id, "category", v)
                        }
                      >
                        <SelectTrigger className="text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`edit.block.delete_button.${idx + 1}`}
                      onClick={() => removeBlock(block.id)}
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {localBlocks.length === 0 && (
                <div
                  data-ocid="edit.blocks.empty_state"
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No blocks yet. Add one below.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add new block */}
      <Card className="shadow-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Custom Block</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Block Label</Label>
              <Input
                data-ocid="edit.new_block.input"
                placeholder="e.g. Study Group, Gym, Nap..."
                value={newBlock.blockLabel}
                onChange={(e) =>
                  setNewBlock((p) => ({ ...p, blockLabel: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                data-ocid="edit.new_block_start.input"
                value={newBlock.startTime}
                onChange={(e) =>
                  setNewBlock((p) => ({ ...p, startTime: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Time</Label>
              <Input
                type="time"
                data-ocid="edit.new_block_end.input"
                value={newBlock.endTime}
                onChange={(e) =>
                  setNewBlock((p) => ({ ...p, endTime: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Category</Label>
              <Select
                value={newBlock.category}
                onValueChange={(v: Category) =>
                  setNewBlock((p) => ({ ...p, category: v }))
                }
              >
                <SelectTrigger data-ocid="edit.new_block_category.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            data-ocid="edit.add_block.button"
            onClick={addBlock}
            className="w-full"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Block
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
