"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Scale, Calendar, Trash, Plus } from "lucide-react";

export default function WeightPage() {
  const queryClient = useQueryClient();
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("08:00");
  const [notes, setNotes] = useState("");

  const { data: logs = [] } = useQuery({
    queryKey: ["weightLogs"],
    queryFn: trackerService.getWeightLogs,
  });

  const addLogMutation = useMutation({
    mutationFn: async () => {
      if (!weight) throw new Error("Weight is required");
      return trackerService.addWeightLog(parseFloat(weight), date, time, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weightLogs"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Weight logged successfully!");
      setWeight("");
      setNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log weight");
    },
  });

  // Calculate rate of change
  const currentWeight = logs[0]?.weight || 94;
  const lastWeekWeight = logs.find(
    (l) => new Date(l.date) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  )?.weight || 94;
  const weeklyChange = currentWeight - lastWeekWeight;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Weight Tracking</h1>
        <p className="text-white/60">
          Monitor your weight trend, weekly velocity, and add daily log entries.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Logging Card */}
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Log Weight</CardTitle>
            <CardDescription>Keep consistency with morning weigh-ins.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="e.g. 84.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Weighed fasted, feeling good"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full mt-2"
              onClick={() => addLogMutation.mutate()}
              disabled={addLogMutation.isPending}
            >
              {addLogMutation.isPending ? "Logging..." : "Log Weight"}
            </Button>
          </CardContent>
        </Card>

        {/* Change Stats */}
        <Card className="bg-white/[0.02] md:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Goal Projection & Trends</CardTitle>
            <CardDescription>Your weekly transformation statistics.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Weekly Change Rate
              </div>
              <div
                className={`text-2xl font-bold ${
                  weeklyChange <= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {weeklyChange <= 0 ? "" : "+"}
                {formatNumber(weeklyChange)} kg
              </div>
              <p className="text-xs text-white/40">Compared to 7 days ago</p>
            </div>

            <div className="space-y-2 rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Estimated to Goal (72kg)
              </div>
              <div className="text-2xl font-bold text-violet-400">
                {formatNumber(Math.max(0, currentWeight - 72))} kg
              </div>
              <p className="text-xs text-white/40">Remaining fat loss required</p>
            </div>
          </CardContent>

          <div className="p-6 pt-0">
            {/* History Table */}
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="max-h-[220px] overflow-y-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-[#0f0f1b] border-b border-white/[0.08] text-white/60">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Date</th>
                      <th className="px-4 py-2 font-semibold">Weight</th>
                      <th className="px-4 py-2 font-semibold">Time</th>
                      <th className="px-4 py-2 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">{log.date}</td>
                        <td className="px-4 py-3 font-semibold text-violet-400">
                          {log.weight} kg
                        </td>
                        <td className="px-4 py-3 text-white/60">
                          {log.time_recorded || "--:--"}
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40 truncate max-w-[150px]">
                          {log.notes || "-"}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-white/30">
                          No weigh-ins recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
