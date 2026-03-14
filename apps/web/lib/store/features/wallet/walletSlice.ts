import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface WalletState {
  accountId: string | null;
}

const initialState: WalletState = {
  accountId: null,
};

export const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setWalletAccountId: (state, action: PayloadAction<string>) => {
      state.accountId = action.payload;
    },
    clearWalletAccountId: (state) => {
      state.accountId = null;
    },
  },
  selectors: {
    selectWalletAccountId: (state) => state.accountId,
  },
});

export const { setWalletAccountId, clearWalletAccountId } = walletSlice.actions;
export const { selectWalletAccountId } = walletSlice.selectors;
