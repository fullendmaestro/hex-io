import { FormEvent } from "react";
import { Button } from "@hexio/ui/components/button";
import { LoaderCircle } from "lucide-react";
import { Switch } from "@hexio/ui/components/switch";
import { Label } from "@hexio/ui/components/label";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  selectHideToolCalls,
  setHideToolCalls,
} from "@/lib/store/features/ui/uiSlice";

interface ThreadInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  stopStream: () => void;
}

export function ThreadInput({
  input,
  setInput,
  handleSubmit,
  isLoading,
  stopStream,
}: ThreadInputProps) {
  const dispatch = useAppDispatch();
  const hideToolCalls = useAppSelector(selectHideToolCalls);

  return (
    <div className="bg-muted rounded-2xl border shadow-xs mx-auto mb-8 w-full max-w-3xl relative z-10">
      <form
        onSubmit={handleSubmit}
        className="grid grid-rows-[1fr_auto] gap-2 max-w-3xl mx-auto"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.metaKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              const el = e.target as HTMLElement | undefined;
              const form = el?.closest("form");
              form?.requestSubmit();
            }
          }}
          placeholder="Type your message..."
          className="p-3.5 pb-0 border-none bg-transparent field-sizing-content shadow-none ring-0 outline-none focus:outline-none focus:ring-0 resize-none"
        />

        <div className="flex items-center justify-between p-2 pt-4">
          <div>
            <div className="flex items-center space-x-2">
              <Switch
                id="render-tool-calls"
                checked={hideToolCalls ?? false}
                onCheckedChange={(checked) => dispatch(setHideToolCalls(checked))}
              />
              <Label
                htmlFor="render-tool-calls"
                className="text-sm text-gray-600"
              >
                Hide Tool Calls
              </Label>
            </div>
          </div>
          {isLoading ? (
            <Button key="stop" type="button" onClick={stopStream}>
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Cancel
            </Button>
          ) : (
            <Button
              type="submit"
              className="transition-all shadow-md"
              disabled={isLoading || !input.trim()}
            >
              Send
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
