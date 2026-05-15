import { defineStore } from 'pinia'
import { listIngestRecords, saveIngestRecords, upsertIngestRecord } from '../services/db/ingestRepository'
import { parseNotificationToRecord } from '../services/ingest/notificationParser'
import {
  consumePendingNotifications,
  getNotificationListenerStatus,
  openNotificationAccessSettings,
  subscribeToNotifications,
} from '../services/native/notificationBridge'
import type { NotificationPayload } from '../types/ingest'

let detachBridgeListener: null | (() => void) = null
let detachStatusRefreshListeners: null | (() => void) = null

export const useIngestStore = defineStore('ingest', {
  state: () => ({
    records: [] as ReturnType<typeof listIngestRecords>,
    listenerAvailable: false,
    listenerEnabled: false,
    listenerBound: false,
  }),
  getters: {
    pendingRecords: (state) =>
      state.records.filter((record) => ['parsed', 'needs_review'].includes(record.parsedStatus)),
  },
  actions: {
    hydrate() {
      this.records = listIngestRecords()
    },
    async refreshListenerStatus() {
      const status = await getNotificationListenerStatus()

      if (
        this.listenerAvailable === status.available &&
        this.listenerEnabled === status.enabled
      ) {
        return
      }

      this.listenerAvailable = status.available
      this.listenerEnabled = status.enabled
    },
    async bindNotificationBridge() {
      if (this.listenerBound) {
        return
      }

      await this.refreshListenerStatus()
      detachBridgeListener = await subscribeToNotifications((payload) => {
        this.receiveNotification(payload)
      })

      const pendingNotifications = await consumePendingNotifications()
      pendingNotifications.forEach((payload) => this.receiveNotification(payload))

      const refreshStatus = () => {
        void this.refreshListenerStatus()
      }
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          refreshStatus()
        }
      }

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        window.addEventListener('focus', refreshStatus)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        detachStatusRefreshListeners = () => {
          window.removeEventListener('focus', refreshStatus)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
      }

      this.listenerBound = true
    },
    async openListenerSettings() {
      await openNotificationAccessSettings()
    },
    receiveNotification(payload: NotificationPayload) {
      const record = parseNotificationToRecord(payload)
      this.records = upsertIngestRecord(record)
      return record
    },
    confirmRecord(recordId: string, billId: string) {
      this.records = saveIngestRecords(
        this.records.map((record) =>
          record.id === recordId
            ? {
                ...record,
                parsedStatus: 'confirmed',
                matchedBillId: billId,
              }
            : record,
        ),
      )
    },
    dismissRecord(recordId: string) {
      this.records = saveIngestRecords(
        this.records.map((record) =>
          record.id === recordId
            ? {
                ...record,
                parsedStatus: 'ignored',
                draft: null,
                errorMessage: record.errorMessage || '已由用户忽略',
              }
            : record,
        ),
      )
    },
    addMockNotification(source: 'wechat' | 'alipay') {
      const receivedAt = new Date().toISOString()
      let payload: NotificationPayload

      if (source === 'wechat') {
        payload = {
          packageName: 'com.tencent.mm',
          title: '微信支付',
          text: '你向麦当劳付款￥32.50，交易单号420000123456，5月12日',
          receivedAt,
        }
      } else {
        payload = {
          packageName: 'com.eg.android.AlipayGphone',
          title: '支付宝',
          text: '支付宝支出￥88.60，订单号2026051212345678，5月11日',
          receivedAt,
        }
      }

      return this.receiveNotification(payload)
    },
    $resetBridge() {
      detachBridgeListener?.()
      detachStatusRefreshListeners?.()
      detachBridgeListener = null
      detachStatusRefreshListeners = null
      this.listenerBound = false
    },
  },
})
