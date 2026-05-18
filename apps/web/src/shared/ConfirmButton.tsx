import type { ComponentProps, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  cancelLabel?: string;
  children: ReactNode;
  confirmLabel?: string;
  description: string;
  onConfirm: () => void;
  title: string;
};

export function ConfirmButton({
  cancelLabel = "取消",
  children,
  confirmLabel = "确认",
  description,
  onConfirm,
  title,
  variant = "destructive",
  ...buttonProps
}: ConfirmButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} {...buttonProps}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
