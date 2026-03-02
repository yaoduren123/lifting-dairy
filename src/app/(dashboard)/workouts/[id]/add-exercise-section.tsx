"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash, History, Dumbbell, Save } from "lucide-react";
import { toast } from "sonner";
import { addExerciseToWorkout } from "@/app/actions/workouts";
import { fetchExerciseHistory } from "@/app/actions/exercises";
import { addExerciseSchema, type AddExerciseInput } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string | null;
  equipmentType: string | null;
}

interface AddExerciseSectionProps {
  workoutId: number;
  availableExercises: Exercise[];
}

interface HistoryData {
  summary: string;
  lastWeight: number;
  lastReps: number;
}

export function AddExerciseSection({ workoutId, availableExercises }: AddExerciseSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [history, setHistory] = useState<HistoryData | null>(null);

  const form = useForm<AddExerciseInput>({
    resolver: zodResolver(addExerciseSchema),
    defaultValues: {
      workoutId,
      exerciseId: undefined, // user must pick something
      sets: [{ weight: undefined, reps: undefined, rpe: undefined }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "sets",
  });

  const selectedExerciseId = useWatch({
    control: form.control,
    name: "exerciseId",
  });

  const handleExerciseChange = async (val: string) => {
    const exId = parseInt(val, 10);
    form.setValue("exerciseId", exId);
    
    // reset history
    setHistory(null);

    // fetch latest history for auto-fill
    try {
      const hist = await fetchExerciseHistory(exId);
      if (hist) {
        setHistory(hist);
        // Autofill the first set with history data
        replace([{ weight: hist.lastWeight, reps: hist.lastReps, rpe: undefined }]);
      } else {
        replace([{ weight: undefined, reps: undefined, rpe: undefined }]);
      }
    } catch (e) {
      console.error(e);
      // fallback just reset
      replace([{ weight: undefined, reps: undefined, rpe: undefined }]);
    }
  };

  const onSubmit = (data: AddExerciseInput) => {
    // Make sure we have valid numbers
    const validData = {
      ...data,
      sets: data.sets.map(s => ({
        weight: s.weight ? Number(s.weight) : undefined,
        reps: s.reps ? Number(s.reps) : undefined,
        rpe: s.rpe ? Number(s.rpe) : undefined,
      }))
    };

    startTransition(async () => {
      const result = await addExerciseToWorkout(validData as any);
      if (result.success) {
        toast.success("Exercise added!", { icon: "📈" });
        setIsOpen(false);
        form.reset({
          workoutId,
          exerciseId: undefined,
          sets: [{ weight: undefined, reps: undefined, rpe: undefined }],
        });
        setHistory(null);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Card className="mt-6 border-dashed border-2 shadow-sm transition-all duration-300 relative overflow-hidden group">
      {!isOpen ? (
        <CardContent className="p-8 text-center bg-card/60 backdrop-blur-sm">
          <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Plus className="w-6 h-6" />
          </div>
          <CardTitle className="mb-2">Add Next Exercise</CardTitle>
          <CardDescription className="mb-6">Log the exercises and sets for this session.</CardDescription>
          <Button onClick={() => setIsOpen(true)} className="px-8 shadow-md">
            Add Exercise
          </Button>
        </CardContent>
      ) : (
        <CardContent className="p-0 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-primary/5 p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2 text-primary">
              <Dumbbell className="w-4 h-4" />
              New Exercise Entry
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
          </div>
          
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Exercise Selection */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="exerciseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exercise</FormLabel>
                        <Select onValueChange={handleExerciseChange}>
                          <FormControl>
                            <SelectTrigger className="w-full sm:max-w-md h-12 text-base shadow-sm">
                              <SelectValue placeholder="Select an exercise..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {availableExercises.map((ex) => (
                              <SelectItem key={ex.id} value={ex.id.toString()}>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{ex.name}</span>
                                  {(ex.muscleGroup || ex.equipmentType) && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({ex.muscleGroup})
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {history && (
                    <div className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-md font-medium border border-amber-200 dark:border-amber-500/20 animate-in fade-in">
                      <History className="w-4 h-4" />
                      Last time: {history.summary}
                    </div>
                  )}
                </div>

                {/* Sets List */}
                {selectedExerciseId && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Sets</Label>
                    </div>
                    
                    <div className="grid gap-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-3">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground mr-1">
                            {index + 1}
                          </div>
                          <FormField
                            control={form.control}
                            name={`sets.${index}.weight`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input type="number" placeholder="Weight (lbs)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`sets.${index}.reps`}
                            render={({ field }) => (
                              <FormItem className="w-24 shrink-0">
                                <FormControl>
                                  <Input type="number" placeholder="Reps" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`sets.${index}.rpe`}
                            render={({ field }) => (
                              <FormItem className="w-20 shrink-0 hidden sm:block">
                                <FormControl>
                                  <Input type="number" placeholder="RPE" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-start">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const lastSet = form.getValues(`sets.${fields.length - 1}`);
                          append({
                            weight: lastSet?.weight,
                            reps: lastSet?.reps,
                            rpe: undefined
                          });
                        }}
                        className="gap-1 mt-2 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Set
                      </Button>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button 
                    type="submit" 
                    disabled={isPending || !selectedExerciseId}
                    className="gap-2 min-w-[140px] shadow-lg"
                  >
                    {isPending ? (
                       <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Exercise
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
