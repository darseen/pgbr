import { ReactNode } from "react";
import { Separator } from "./separator";

interface Props {
  children: ReactNode;
}

export default function SeparatorWithText({ children }: Props) {
  return (
    <div className="relative flex w-full items-center">
      <Separator className="flex-1" />

      <span className="text-muted-foreground shrink-0 px-4 text-xs uppercase">
        {children}
      </span>

      <Separator className="flex-1" />
    </div>
  );
}
