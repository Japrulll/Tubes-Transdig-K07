// Pengingat terjadwal (opt-in, hanya di aplikasi Android/iOS) memakai notifikasi lokal:
// tidak butuh server dan tidak memakai lokasi latar belakang.
//   Sabtu & Minggu 06.30 → ajakan jogging pagi
//   Setiap hari 18.00     → air mancur menari mulai 18.30
import { settings } from '../stores/settings'

const IDS = [7101, 7102, 7103]
export const remindersSupported = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()

/** Menyesuaikan jadwal notifikasi dengan pengaturan. Mengembalikan 'ok' | 'off' | 'denied' | 'unsupported' */
export async function syncReminders() {
  if (!remindersSupported) return 'unsupported'
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: IDS.map((id) => ({ id })) }).catch(() => {})
    if (!settings.reminders) return 'off'
    let perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') {
      settings.reminders = false
      return 'denied'
    }
    const jogging = (id, weekday) => ({
      id,
      title: 'Jogging pagi di Kiara Artha?',
      body: 'Kia siap menemani Wellness Trail. Udara pagi paling segar jam segini!',
      schedule: { on: { weekday, hour: 6, minute: 30 }, allowWhileIdle: true },
    })
    await LocalNotifications.schedule({
      notifications: [
        jogging(7101, 7), // Sabtu
        jogging(7102, 1), // Minggu
        {
          id: 7103,
          title: 'Air mancur menari mulai 18.30',
          body: 'Mampir ke Kiara Artha malam ini? Ada kuis menunggumu di tepi danau.',
          schedule: { on: { hour: 18, minute: 0 }, allowWhileIdle: true },
        },
      ],
    })
    return 'ok'
  } catch {
    return 'unsupported'
  }
}
