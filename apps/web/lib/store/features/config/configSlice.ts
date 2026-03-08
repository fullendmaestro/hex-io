import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ConfigState {
  apiUrl: string;
  assistantId: string;
  apiKey: string;
}

// Get environment variables with fallbacks
const getEnvValue = (key: string, defaultValue: string = ""): string => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  return defaultValue;
};

const DEFAULT_API_URL = "http://localhost:2024";
const DEFAULT_ASSISTANT_ID = "agent";

const initialState: ConfigState = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL,
  assistantId: process.env.NEXT_PUBLIC_ASSISTANT_ID || DEFAULT_ASSISTANT_ID,
  apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY || "",
};

export const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setApiUrl: (state, action: PayloadAction<string>) => {
      state.apiUrl = action.payload;
    },
    setAssistantId: (state, action: PayloadAction<string>) => {
      state.assistantId = action.payload;
    },
    setApiKey: (state, action: PayloadAction<string>) => {
      state.apiKey = action.payload;
    },
    resetConfig: () => initialState,
  },
  selectors: {
    selectApiUrl: (state) => state.apiUrl,
    selectAssistantId: (state) => state.assistantId,
    selectApiKey: (state) => state.apiKey,
  },
});

export const { setApiUrl, setAssistantId, setApiKey, resetConfig } =
  configSlice.actions;

export const { selectApiUrl, selectAssistantId, selectApiKey } =
  configSlice.selectors;
