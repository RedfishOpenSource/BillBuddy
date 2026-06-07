export type AccountType = 'asset_cash' | 'asset_bank' | 'liability_credit' | 'liability_mortgage' | 'liability_loan'

export interface Account {
  id: string
  name: string
  type: AccountType
  icon: string
  color: string
  sortOrder: number
  archived?: boolean
  createdAt: string
  updatedAt: string
}
