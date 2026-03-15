import { Sparkles } from "lucide-react";

export function ThreadWelcome() {
  return (
    <div className="flex flex-col items-start w-full max-w-3xl mx-auto px-4 md:px-0 mb-4">
      <div className="flex items-center gap-2 text-primary dark:text-gray-300">
        <Sparkles className="w-6 h-6 fill-current text-blue-500" />
        <span className="text-xl font-medium tracking-tight">
          Hello
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground/90 mt-1">
        What would you like to do?
      </h1>
    </div>
  );
}
