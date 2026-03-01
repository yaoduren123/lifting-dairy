"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteWorkout } from "@/app/actions/workouts";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteWorkoutButton({ id }: { id: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent modal from immediately closing on click because of action default
    startTransition(async () => {
      const result = await deleteWorkout(id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Workout deleted");
      setIsOpen(false);
      // Redirect to list page
      router.push("/workouts");
      router.refresh();
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" className="shrink-0 flex items-center justify-center">
          <Trash2 className="w-4 h-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Workout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this workout? This action cannot be undone.
            All associated exercises and sets will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete Permanently"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
