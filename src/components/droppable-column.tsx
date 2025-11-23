"use client";

import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";

interface DroppableColumnProps {
  id: string;
  children: ReactNode;
}

export function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return <div ref={setNodeRef}>{children}</div>;
}

