import {
  ArrowRightLeft,
  UserPlus,
  UserCog,
  UserX,
  Coins,
  Send,
  Image,
  Stamp,
  Palette,
  Gift,
  ShieldCheck,
  ShieldOff,
  Link,
  Unlink,
  Clock,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export type TransactionToolConfig = {
  /** Human-readable label shown in the UI card */
  label: string;
  /** Category for grouping */
  category: string;
  /** Tailwind color stem used for accents — mapped to specific classes below */
  accent: "emerald" | "blue" | "violet" | "amber" | "slate" | "rose";
  /** Lucide icon component */
  icon: LucideIcon;
  /** Map of raw arg key → display label. Keys not listed use the raw key. */
  argLabels?: Record<string, string>;
  /** Ordered list of arg keys to show first. Others follow alphabetically. */
  argPriority?: string[];
  /** Keys to always hide */
  argHidden?: string[];
};

// ── Accent color class maps ────────────────────────────────────────
// Pre-define so Tailwind can purge correctly (no dynamic string concat)
export const accentClasses: Record<
  TransactionToolConfig["accent"],
  {
    border: string;
    bg: string;
    bgLight: string;
    text: string;
    textMuted: string;
    divide: string;
    borderLight: string;
  }
> = {
  emerald: {
    border: "border-emerald-300",
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-50",
    text: "text-emerald-900",
    textMuted: "text-emerald-700",
    divide: "divide-emerald-100",
    borderLight: "border-emerald-200",
  },
  blue: {
    border: "border-blue-300",
    bg: "bg-blue-500",
    bgLight: "bg-blue-50",
    text: "text-blue-900",
    textMuted: "text-blue-700",
    divide: "divide-blue-100",
    borderLight: "border-blue-200",
  },
  violet: {
    border: "border-violet-300",
    bg: "bg-violet-500",
    bgLight: "bg-violet-50",
    text: "text-violet-900",
    textMuted: "text-violet-700",
    divide: "divide-violet-100",
    borderLight: "border-violet-200",
  },
  amber: {
    border: "border-amber-300",
    bg: "bg-amber-500",
    bgLight: "bg-amber-50",
    text: "text-amber-900",
    textMuted: "text-amber-700",
    divide: "divide-amber-100",
    borderLight: "border-amber-200",
  },
  slate: {
    border: "border-slate-300",
    bg: "bg-slate-500",
    bgLight: "bg-slate-50",
    text: "text-slate-900",
    textMuted: "text-slate-700",
    divide: "divide-slate-100",
    borderLight: "border-slate-200",
  },
  rose: {
    border: "border-rose-300",
    bg: "bg-rose-500",
    bgLight: "bg-rose-50",
    text: "text-rose-900",
    textMuted: "text-rose-700",
    divide: "divide-rose-100",
    borderLight: "border-rose-200",
  },
};

// Scheduling params are shared across most tools — always collapse them
const SCHEDULING_HIDDEN = ["schedulingParams"];

// ── Tool configs ───────────────────────────────────────────────────
export const TRANSACTION_TOOL_CONFIGS: Record<string, TransactionToolConfig> = {
  // ─ HBAR ─
  transfer_hbar_tool: {
    label: "Transfer HBAR",
    category: "HBAR",
    accent: "emerald",
    icon: ArrowRightLeft,
    argPriority: ["sourceAccountId", "transfers", "transactionMemo"],
    argLabels: {
      sourceAccountId: "From",
      transfers: "Recipients",
      transactionMemo: "Memo",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  transfer_hbar_with_allowance_tool: {
    label: "Transfer HBAR (Allowance)",
    category: "HBAR",
    accent: "emerald",
    icon: ArrowRightLeft,
    argPriority: ["sourceAccountId", "transfers", "transactionMemo"],
    argLabels: {
      sourceAccountId: "From",
      transfers: "Recipients",
      transactionMemo: "Memo",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  approve_hbar_allowance_tool: {
    label: "Approve HBAR Allowance",
    category: "HBAR Allowance",
    accent: "amber",
    icon: ShieldCheck,
    argPriority: ["ownerAccountId", "spenderAccountId", "amount"],
    argLabels: {
      ownerAccountId: "Owner",
      spenderAccountId: "Spender",
      amount: "Amount (HBAR)",
      transactionMemo: "Memo",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  delete_hbar_allowance_tool: {
    label: "Delete HBAR Allowance",
    category: "HBAR Allowance",
    accent: "amber",
    icon: ShieldOff,
    argPriority: ["ownerAccountId", "spenderAccountId"],
    argLabels: {
      ownerAccountId: "Owner",
      spenderAccountId: "Spender",
      transactionMemo: "Memo",
    },
    argHidden: SCHEDULING_HIDDEN,
  },

  // ─ Account ─
  create_account_tool: {
    label: "Create Account",
    category: "Account",
    accent: "blue",
    icon: UserPlus,
    argPriority: ["initialBalance", "publicKey", "accountMemo"],
    argLabels: {
      initialBalance: "Initial Balance (HBAR)",
      publicKey: "Public Key",
      accountMemo: "Memo",
      maxAutomaticTokenAssociations: "Max Token Associations",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  update_account_tool: {
    label: "Update Account",
    category: "Account",
    accent: "blue",
    icon: UserCog,
    argPriority: [
      "accountId",
      "maxAutomaticTokenAssociations",
      "accountMemo",
      "stakedAccountId",
    ],
    argLabels: {
      accountId: "Account",
      maxAutomaticTokenAssociations: "Max Token Associations",
      accountMemo: "Memo",
      stakedAccountId: "Staked Account",
      declineStakingReward: "Decline Staking Reward",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  delete_account_tool: {
    label: "Delete Account",
    category: "Account",
    accent: "rose",
    icon: UserX,
    argPriority: ["accountId", "transferAccountId"],
    argLabels: {
      accountId: "Account to Delete",
      transferAccountId: "Transfer Remaining To",
    },
  },

  // ─ ERC-20 ─
  create_erc20_tool: {
    label: "Create ERC-20 Token",
    category: "Token (ERC-20)",
    accent: "violet",
    icon: Coins,
    argPriority: ["tokenName", "tokenSymbol", "decimals", "initialSupply"],
    argLabels: {
      tokenName: "Name",
      tokenSymbol: "Symbol",
      decimals: "Decimals",
      initialSupply: "Initial Supply",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  transfer_erc20_tool: {
    label: "Transfer ERC-20 Token",
    category: "Token (ERC-20)",
    accent: "violet",
    icon: Send,
    argPriority: ["contractId", "recipientAddress", "amount"],
    argLabels: {
      contractId: "Contract",
      recipientAddress: "Recipient",
      amount: "Amount",
    },
    argHidden: SCHEDULING_HIDDEN,
  },

  // ─ ERC-721 ─
  create_erc721_tool: {
    label: "Create ERC-721 Token",
    category: "Token (ERC-721)",
    accent: "violet",
    icon: Palette,
    argPriority: ["tokenName", "tokenSymbol", "baseURI"],
    argLabels: {
      tokenName: "Name",
      tokenSymbol: "Symbol",
      baseURI: "Base URI",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  transfer_erc721_tool: {
    label: "Transfer ERC-721 Token",
    category: "Token (ERC-721)",
    accent: "violet",
    icon: Send,
    argPriority: ["contractId", "fromAddress", "toAddress", "tokenId"],
    argLabels: {
      contractId: "Contract",
      fromAddress: "From",
      toAddress: "To",
      tokenId: "Token ID",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  mint_erc721_tool: {
    label: "Mint ERC-721 Token",
    category: "Token (ERC-721)",
    accent: "violet",
    icon: Stamp,
    argPriority: ["contractId", "toAddress"],
    argLabels: { contractId: "Contract", toAddress: "To" },
    argHidden: SCHEDULING_HIDDEN,
  },

  // ─ Native Fungible Token ─
  create_fungible_token_tool: {
    label: "Create Fungible Token",
    category: "Native Token",
    accent: "violet",
    icon: Coins,
    argPriority: [
      "tokenName",
      "tokenSymbol",
      "initialSupply",
      "decimals",
      "supplyType",
      "maxSupply",
    ],
    argLabels: {
      tokenName: "Name",
      tokenSymbol: "Symbol",
      initialSupply: "Initial Supply",
      decimals: "Decimals",
      supplyType: "Supply Type",
      maxSupply: "Max Supply",
      treasuryAccountId: "Treasury Account",
      isSupplyKey: "Has Supply Key",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  mint_fungible_token_tool: {
    label: "Mint Fungible Token",
    category: "Native Token",
    accent: "violet",
    icon: Stamp,
    argPriority: ["tokenId", "amount"],
    argLabels: { tokenId: "Token", amount: "Amount" },
    argHidden: SCHEDULING_HIDDEN,
  },
  airdrop_fungible_token_tool: {
    label: "Airdrop Fungible Token",
    category: "Native Token",
    accent: "violet",
    icon: Gift,
    argPriority: ["tokenId", "sourceAccountId", "recipients"],
    argLabels: {
      tokenId: "Token",
      sourceAccountId: "From",
      recipients: "Recipients",
    },
  },
  transfer_fungible_token_with_allowance_tool: {
    label: "Transfer Token (Allowance)",
    category: "Native Token",
    accent: "violet",
    icon: Send,
    argPriority: ["tokenId", "sourceAccountId", "transfers"],
    argLabels: {
      tokenId: "Token",
      sourceAccountId: "From",
      transfers: "Recipients",
      transactionMemo: "Memo",
    },
    argHidden: SCHEDULING_HIDDEN,
  },

  // ─ Native Non-Fungible Token ─
  create_non_fungible_token_tool: {
    label: "Create Non-Fungible Token",
    category: "Native Token",
    accent: "violet",
    icon: Image,
    argPriority: [
      "tokenName",
      "tokenSymbol",
      "supplyType",
      "maxSupply",
      "treasuryAccountId",
    ],
    argLabels: {
      tokenName: "Name",
      tokenSymbol: "Symbol",
      supplyType: "Supply Type",
      maxSupply: "Max Supply",
      treasuryAccountId: "Treasury Account",
      isSupplyKey: "Has Supply Key",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  mint_non_fungible_token_tool: {
    label: "Mint Non-Fungible Token",
    category: "Native Token",
    accent: "violet",
    icon: Stamp,
    argPriority: ["tokenId", "uris"],
    argLabels: { tokenId: "Token", uris: "URIs" },
    argHidden: SCHEDULING_HIDDEN,
  },
  transfer_non_fungible_token_tool: {
    label: "Transfer NFT",
    category: "Native Token",
    accent: "violet",
    icon: Send,
    argPriority: ["tokenId", "recipients"],
    argLabels: {
      tokenId: "Token",
      recipients: "Recipients",
      transactionMemo: "Memo",
    },
    argHidden: SCHEDULING_HIDDEN,
  },
  transfer_non_fungible_token_with_allowance_tool: {
    label: "Transfer NFT (Allowance)",
    category: "Native Token",
    accent: "violet",
    icon: Send,
    argPriority: ["sourceAccountId", "tokenId", "recipients"],
    argLabels: {
      sourceAccountId: "From",
      tokenId: "Token",
      recipients: "Recipients",
      transactionMemo: "Memo",
    },
  },

  // ─ Token Allowances ─
  approve_token_allowance_tool: {
    label: "Approve Token Allowance",
    category: "Token Allowance",
    accent: "amber",
    icon: ShieldCheck,
    argPriority: ["ownerAccountId", "spenderAccountId", "tokenApprovals"],
    argLabels: {
      ownerAccountId: "Owner",
      spenderAccountId: "Spender",
      tokenApprovals: "Token Approvals",
      transactionMemo: "Memo",
    },
  },
  delete_token_allowance_tool: {
    label: "Delete Token Allowance",
    category: "Token Allowance",
    accent: "amber",
    icon: ShieldOff,
    argPriority: ["ownerAccountId", "spenderAccountId", "tokenIds"],
    argLabels: {
      ownerAccountId: "Owner",
      spenderAccountId: "Spender",
      tokenIds: "Tokens",
      transactionMemo: "Memo",
    },
  },
  approve_nft_allowance_tool: {
    label: "Approve NFT Allowance",
    category: "NFT Allowance",
    accent: "amber",
    icon: ShieldCheck,
    argPriority: [
      "ownerAccountId",
      "spenderAccountId",
      "tokenId",
      "allSerials",
      "serialNumbers",
    ],
    argLabels: {
      ownerAccountId: "Owner",
      spenderAccountId: "Spender",
      tokenId: "Token",
      allSerials: "All Serials",
      serialNumbers: "Serial Numbers",
      transactionMemo: "Memo",
    },
  },
  delete_non_fungible_token_allowance_tool: {
    label: "Delete NFT Allowance",
    category: "NFT Allowance",
    accent: "amber",
    icon: ShieldOff,
    argPriority: ["ownerAccountId", "tokenId", "serialNumbers"],
    argLabels: {
      ownerAccountId: "Owner",
      tokenId: "Token",
      serialNumbers: "Serial Numbers",
      transactionMemo: "Memo",
    },
  },

  // ─ Token Admin ─
  update_token_tool: {
    label: "Update Token",
    category: "Token Admin",
    accent: "violet",
    icon: UserCog,
    argPriority: ["tokenId", "tokenName", "tokenSymbol"],
    argLabels: {
      tokenId: "Token",
      tokenName: "New Name",
      tokenSymbol: "New Symbol",
      tokenDesc: "Description",
      treasuryAccountId: "Treasury Account",
      tokenMemo: "Memo",
    },
  },

  // ─ Token Association ─
  associate_token_tool: {
    label: "Associate Token",
    category: "Token Association",
    accent: "blue",
    icon: Link,
    argPriority: ["accountId", "tokenIds"],
    argLabels: { accountId: "Account", tokenIds: "Tokens" },
  },
  dissociate_token_tool: {
    label: "Dissociate Token",
    category: "Token Association",
    accent: "blue",
    icon: Unlink,
    argPriority: ["accountId", "tokenIds"],
    argLabels: {
      accountId: "Account",
      tokenIds: "Tokens",
      transactionMemo: "Memo",
    },
  },

  // ─ Scheduling ─
  sign_schedule_transaction_tool: {
    label: "Sign Scheduled Transaction",
    category: "Scheduling",
    accent: "slate",
    icon: Clock,
    argPriority: ["scheduleId"],
    argLabels: { scheduleId: "Schedule ID" },
  },
  schedule_delete_tool: {
    label: "Delete Scheduled Transaction",
    category: "Scheduling",
    accent: "slate",
    icon: Trash2,
    argPriority: ["scheduleId"],
    argLabels: { scheduleId: "Schedule ID" },
  },
};

/** Quick lookup: is this tool name registered as a transaction tool? */
export function isTransactionTool(name: string): boolean {
  return name in TRANSACTION_TOOL_CONFIGS;
}

/** Get config for a transaction tool, or undefined if not found */
export function getTransactionToolConfig(
  name: string,
): TransactionToolConfig | undefined {
  return TRANSACTION_TOOL_CONFIGS[name];
}
