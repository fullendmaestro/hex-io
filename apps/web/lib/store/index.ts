import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { configSlice } from "./features/config/configSlice";
import { threadSlice } from "./features/thread/threadSlice";
import { uiSlice } from "./features/ui/uiSlice";
import { walletSlice } from "./features/wallet/walletSlice";

// Re-export state types for visibility
export type { ConfigState } from "./features/config/configSlice";
export type { ThreadState } from "./features/thread/threadSlice";
export type { UIState } from "./features/ui/uiSlice";
export type { WalletState } from "./features/wallet/walletSlice";

// `combineSlices` automatically combines the reducers using
// their `reducerPath`s, therefore we no longer need to call `combineReducers`.
const rootReducer = combineSlices(configSlice, threadSlice, uiSlice, walletSlice);

// Infer the `RootState` type from the root reducer
export type RootState = ReturnType<typeof rootReducer>;

// `makeStore` encapsulates the store configuration to allow
// creating unique store instances, which is particularly important for
// server-side rendering (SSR) scenarios. In SSR, separate store instances
// are needed for each request to prevent cross-request state pollution.
export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
  });
};

// Infer the return type of `makeStore`
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;
