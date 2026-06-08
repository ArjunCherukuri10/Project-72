"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Activity, Plus } from "lucide-react";

export default function HealthPage() {
  const queryClient = useQueryClient();
  const [metricType, setMetricType] = useState("resting_heart_rate");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("bpm");
  const [notes, setNotes] = useState("");

  const { data: metrics = [] } = useQuery({
    queryKey: ["healthMetrics"],
    queryFn: trackerService.getHealthMetrics,
  });

  const logHealthMutation = useMutation({
    mutationFn: async () => {
      if (!value) throw new Error("Value is required");
      return trackerService.addHealthMetric({
        date: new Date().toISOString().split("T")[0],
        metric_type: metricType,
        value: parseFloat(value),
        unit,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthMetrics"] });
      toast.success("Health metric logged successfully!");
      setValue("");
      setNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log health metric");
    },
  });

  const getMetricTypeLabel = (val: string) => {
    switch (val) {
      case "resting_heart_rate": return "Resting Heart Rate";
      case "fasting_glucose": return "Fasting Glucose";
      case "blood_pressure_systolic": return "Systolic Blood Pressure";
      case "blood_pressure_diastolic": return "Diastolic Blood Pressure";
      case "hba1c": return "HbA1c";
      case "cholesterol": return "Total Cholesterol";
      default: return val.replace(/_/g, " ");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Health Metrics & Labs</h1>
        <p className="text-white/60">
          Track clinical biological health records: fast glucose, resting heart rate, blood pressure.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Log Health Form */}
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Log Health Metric</CardTitle>
            <CardDescription>Enter test values or vitals metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="hType">Metric Type</Label>
              <select
                id="hType"
                className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#07070f] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={metricType}
                onChange={(e) => {
                  const val = e.target.value;
                  setMetricType(val);
                  if (val === "resting_heart_rate") setUnit("bpm");
                  else if (val === "fasting_glucose") setUnit("mg/dL");
                  else if (val === "hba1c") setUnit("%");
                  else if (val.startsWith("blood_pressure")) setUnit("mmHg");
                  else setUnit("mg/dL");
                }}
              >
                <option value="resting_heart_rate">Resting Heart Rate (RHR)</option>
                <option value="fasting_glucose">Fasting Glucose</option>
                <option value="blood_pressure_systolic">Blood Pressure (Systolic)</option>
                <option value="blood_pressure_diastolic">Blood Pressure (Diastolic)</option>
                <option value="hba1c">HbA1c</option>
                <option value="cholesterol">Cholesterol</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="hValue">Value</Label>
                <Input
                  id="hValue"
                  type="number"
                  placeholder="e.g. 65"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hUnit">Unit</Label>
                <Input id="hUnit" value={unit} readOnly disabled className="opacity-60" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="hNotes">Notes / Lab Source</Label>
              <Input
                id="hNotes"
                placeholder="Morning measurement"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              className="w-full mt-3"
              onClick={() => logHealthMutation.mutate()}
              disabled={logHealthMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" /> Log Metric
            </Button>
          </CardContent>
        </Card>

        {/* History List */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader>
            <CardTitle>Health History Logs</CardTitle>
            <CardDescription>Records of clinical vitals and diagnostic labs.</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px] overflow-y-auto">
            {metrics.length > 0 ? (
              <div className="grid gap-3">
                {metrics.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-violet-500/30 transition-all duration-200"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white capitalize">
                        {getMetricTypeLabel(m.metric_type)}
                      </h4>
                      <div className="flex gap-4 text-xs text-white/50">
                        <span className="font-bold text-violet-400">
                          {m.value} {m.unit}
                        </span>
                        <span>Logged: {m.date}</span>
                      </div>
                      {m.notes && (
                        <p className="text-xs text-white/40 mt-1 italic">&quot;{m.notes}&quot;</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-white/30 gap-2">
                <Activity className="h-8 w-8 text-white/20" />
                <span className="text-sm">No health metrics logged yet. Track labs to monitor metabolic markers.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
