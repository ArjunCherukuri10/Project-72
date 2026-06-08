"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Ruler, Plus } from "lucide-react";

export default function BodyMeasurementsPage() {
  const queryClient = useQueryClient();
  const [waist, setWaist] = useState("");
  const [neck, setNeck] = useState("");
  const [chest, setChest] = useState("");
  const [hips, setHips] = useState("");
  const [notes, setNotes] = useState("");

  const logMeasurementMutation = useMutation({
    mutationFn: async () => {
      // Dynamic fallback list storage setter
      const list = JSON.parse(localStorage.getItem("p72_body_measurements") || "[]");
      const record = {
        id: `bm-${Date.now()}`,
        user_id: "user-1",
        date: new Date().toISOString().split("T")[0],
        waist: waist ? parseFloat(waist) : null,
        neck: neck ? parseFloat(neck) : null,
        chest: chest ? parseFloat(chest) : null,
        hips: hips ? parseFloat(hips) : null,
        notes: notes || null,
        created_at: new Date().toISOString(),
      };
      list.push(record);
      localStorage.setItem("p72_body_measurements", JSON.stringify(list));
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bodyMeasurements"] });
      toast.success("Body measurements saved!");
      setWaist("");
      setNeck("");
      setChest("");
      setHips("");
      setNotes("");
    },
  });

  const { data: measurements = [] } = useQuery({
    queryKey: ["bodyMeasurements"],
    queryFn: () => JSON.parse(localStorage.getItem("p72_body_measurements") || "[]"),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Body Measurements</h1>
        <p className="text-white/60">
          Track waist, neck, chest, and hips changes over time to monitor fat loss.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Entry Card */}
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Log Measurements</CardTitle>
            <CardDescription>Enter tape measurements in cm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="waist">Waist (cm)</Label>
              <Input
                id="waist"
                type="number"
                placeholder="e.g. 92.5"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="neck">Neck (cm)</Label>
              <Input
                id="neck"
                type="number"
                placeholder="e.g. 40.0"
                value={neck}
                onChange={(e) => setNeck(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chest">Chest (cm)</Label>
              <Input
                id="chest"
                type="number"
                placeholder="e.g. 104.5"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hips">Hips (cm)</Label>
              <Input
                id="hips"
                type="number"
                placeholder="e.g. 98.0"
                value={hips}
                onChange={(e) => setHips(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mNotes">Notes</Label>
              <Input
                id="mNotes"
                placeholder="After waking up"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full mt-3"
              onClick={() => logMeasurementMutation.mutate()}
              disabled={logMeasurementMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" /> Save Records
            </Button>
          </CardContent>
        </Card>

        {/* History Grid */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader>
            <CardTitle>Measurements Log</CardTitle>
            <CardDescription>Past tape measurements history.</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px] overflow-y-auto">
            {measurements.length > 0 ? (
              <div className="grid gap-3">
                {measurements.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-violet-500/30 transition-all duration-200 gap-4"
                  >
                    <div>
                      <h4 className="font-semibold text-white">Record Date: {m.date}</h4>
                      <div className="flex flex-wrap gap-4 text-xs text-white/50 mt-1">
                        {m.waist && <span>Waist: <strong className="text-violet-400">{m.waist}cm</strong></span>}
                        {m.neck && <span>Neck: <strong className="text-indigo-400">{m.neck}cm</strong></span>}
                        {m.chest && <span>Chest: <strong className="text-pink-400">{m.chest}cm</strong></span>}
                        {m.hips && <span>Hips: <strong className="text-teal-400">{m.hips}cm</strong></span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-white/30 gap-2">
                <Ruler className="h-8 w-8 text-white/20" />
                <span className="text-sm">No measurements logged yet. Keep track to see body shape changes.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
