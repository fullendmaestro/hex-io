import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  chatHistoryOpen: boolean;
  hideToolCalls: boolean;
}

const initialState: UIState = {
  chatHistoryOpen: false,
  hideToolCalls: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setChatHistoryOpen: (state, action: PayloadAction<boolean>) => {
      state.chatHistoryOpen = action.payload;
    },
    toggleChatHistory: (state) => {
      state.chatHistoryOpen = !state.chatHistoryOpen;
    },
    setHideToolCalls: (state, action: PayloadAction<boolean>) => {
      state.hideToolCalls = action.payload;
    },
    toggleHideToolCalls: (state) => {
      state.hideToolCalls = !state.hideToolCalls;
    },
    resetUI: () => initialState,
  },
  selectors: {
    selectChatHistoryOpen: (state) => state.chatHistoryOpen,
    selectHideToolCalls: (state) => state.hideToolCalls,
  },
});

export const {
  setChatHistoryOpen,
  toggleChatHistory,
  setHideToolCalls,
  toggleHideToolCalls,
  resetUI,
} = uiSlice.actions;

export const { selectChatHistoryOpen, selectHideToolCalls } = uiSlice.selectors;
