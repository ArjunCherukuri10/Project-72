"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackerService } from "@/lib/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function QuickActionModal() {
  const { quickActionOpen, setQuickActionOpen, selectedDate } = useAppStore();
  const queryClient = useQueryClient();

  const [weight, setWeight] = useState("");
  const [water, setWater] = useState("");
  const [steps, setSteps] = useState("");
  const [sleep, setSleep] = useState("");

  const logMutation = useMutation({
    mutationFn: async () => {
      if (weight) {
        trackerService.addWeightLog(parseFloat(weight), selectedDate);
      }
      if (water || steps || sleep) {
        const update: Record<string, any> = {};
        if (water) update.water_ml = parseInt(water);
        if (steps) update.steps = parseInt(steps);
        if (sleep) update.sleep_hours = parseFloat(sleep);
        trackerService.updateDailySummaryField(selectedDate, update);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      queryClient.invalidateQueries({ queryKey: ["weightLogs"] });
      toast.success("Metrics logged successfully!");
      setQuickActionOpen(false);
      setWeight("");
      setWater("");
      setSteps("");
      setSleep("");
    },
    onError: () => {
      toast.error("Failed to save metrics.");
    },
  });

  return (
    <Dialog open={quickActionOpen} onOpenChange={setQuickActionOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Quick Log Metrics</DialogTitle>
          <DialogDescription>
            Record your key metrics for {selectedDate}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weight" className="text-right">
              Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 84.2"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="water" className="text-right">
              Water (ml)
            </Label>
            <Input
              id="water"
              type="number"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              placeholder="e.g. 2500"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="steps" className="text-right">
              Steps
            </Label>
            <Input
              id="steps"
              type="number"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="e.g. 10000"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sleep" className="text-right">
              Sleep (hrs)
            </Label>
            <Input
              id="sleep"
              type="number"
              step="0.5"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              placeholder="e.g. 7.5"
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="submit"
            onClick={() => logMutation.mutate()}
            disabled={logMutation.isPending}
          >
            {logMutation.isPending ? "Saving..." : "Save Metrics"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
