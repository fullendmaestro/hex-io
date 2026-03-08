import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ThreadState {
  threadId: string | null;
}

const initialState: ThreadState = {
  threadId: null,
};

export const threadSlice = createSlice({
  name: "thread",
  initialState,
  reducers: {
    setThreadId: (state, action: PayloadAction<string | null>) => {
      state.threadId = action.payload;
    },
    clearThread: (state) => {
      state.threadId = null;
    },
  },
  selectors: {
    selectThreadId: (state) => state.threadId,
  },
});

export const { setThreadId, clearThread } = threadSlice.actions;

export const { selectThreadId } = threadSlice.selectors;
