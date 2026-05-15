import { Capacitor, registerPlugin } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'
import type { NotificationPayload } from '../../types/ingest'

interface ListenerStatus {
  available: boolean
  enabled: boolean
}

interface PendingNotificationsResult {
  notifications: NotificationPayload[]
}

interface BillNotificationPlugin {
  getListenerStatus(): Promise<ListenerStatus>
  openNotificationAccessSettings(): Promise<void>
  consumePendingNotifications(): Promise<PendingNotificationsResult>
  addListener(
    eventName: 'billNotificationReceived',
    listener: (payload: NotificationPayload) => void,
  ): Promise<PluginListenerHandle>
}

const BillNotification = registerPlugin<BillNotificationPlugin>('BillNotification')
const unavailableListenerStatus: ListenerStatus = { available: false, enabled: false }

export function isNotificationBridgeAvailable(): boolean {
  return Capacitor.getPlatform() === 'android'
}

export async function getNotificationListenerStatus(): Promise<ListenerStatus> {
  if (!isNotificationBridgeAvailable()) {
    return unavailableListenerStatus
  }

  try {
    return await BillNotification.getListenerStatus()
  } catch {
    return { available: true, enabled: false }
  }
}

export async function openNotificationAccessSettings(): Promise<void> {
  if (!isNotificationBridgeAvailable()) {
    return
  }

  await BillNotification.openNotificationAccessSettings()
}

export async function consumePendingNotifications(): Promise<NotificationPayload[]> {
  if (!isNotificationBridgeAvailable()) {
    return []
  }

  try {
    const result = await BillNotification.consumePendingNotifications()
    return result.notifications ?? []
  } catch {
    return []
  }
}

export async function subscribeToNotifications(
  listener: (payload: NotificationPayload) => void,
): Promise<() => void> {
  if (!isNotificationBridgeAvailable()) {
    return () => undefined
  }

  const handle = await BillNotification.addListener('billNotificationReceived', listener)
  return () => {
    void handle.remove()
  }
}
