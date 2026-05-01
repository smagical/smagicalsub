import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export function EmptyState({ label }: { label: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{label}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
