import { z } from "zod";

export const deleteWorkoutSchema = z.object({
  id: z.number().int().positive("Invalid workout ID"),
});

export const createWorkoutSchema = z.object({
  date: z.date({
    message: "A date is required.",
  }),
  type: z.enum(["strength", "cardio", "flexibility"], {
    message: "Please select a valid workout type.",
  }),
  notes: z.string().optional(),
  duration: z.number().int().positive("Duration must be a positive number").optional(),
});

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;

export const updateWorkoutSchema = z.object({
  id: z.number().int().positive("Invalid workout ID"),
}).merge(createWorkoutSchema);

export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;

export const setSchema = z.object({
  weight: z.number().nonnegative().optional(),
  reps: z.number().int().nonnegative().optional(),
  rpe: z.number().min(0).max(10).optional(),
});

export const addExerciseSchema = z.object({
  workoutId: z.number().int().positive(),
  exerciseId: z.number().int().positive(),
  sets: z.array(setSchema).min(1, "At least one set is required"),
});

export type AddExerciseInput = z.infer<typeof addExerciseSchema>;
