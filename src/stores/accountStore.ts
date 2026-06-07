import { defineStore } from 'pinia'
import { ensureAccounts, listAccounts, upsertAccount } from '../services/db/accountRepository'
import type { Account } from '../types/account'

export const useAccountStore = defineStore('accounts', {
  state: () => ({
    accounts: [] as Account[],
  }),
  getters: {
    activeAccounts: (state) => state.accounts.filter((account) => !account.archived),
    assetAccounts: (state) => state.accounts.filter((account) => !account.archived && (account.type === 'asset_cash' || account.type === 'asset_bank')),
    liabilityAccounts: (state) => state.accounts.filter((account) => !account.archived && account.type.startsWith('liability_')),
    getAccountById: (state) => (accountId?: string) => state.accounts.find((account) => account.id === accountId) ?? null,
  },
  actions: {
    hydrate() {
      this.accounts = listAccounts()
    },
    ensureSeeded() {
      this.accounts = ensureAccounts()
    },
    saveAccount(account: Account) {
      this.accounts = upsertAccount(account)
    },
  },
})
