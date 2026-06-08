import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyablePath({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  if (!path) {
    return <span className="text-muted-foreground">-</span>;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="bg-muted hover:bg-muted/80 flex max-w-50 items-center gap-1.5 rounded px-2 py-1 text-left transition-colors"
      title="Click to copy path"
    >
      <code className="truncate font-mono text-xs">{path}</code>
      {copied ? (
        <Check className="size-3 shrink-0 text-green-500" />
      ) : (
        <Copy className="text-muted-foreground size-3 shrink-0" />
      )}
    </button>
  );
}
