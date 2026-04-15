import * as Notifications from "expo-notifications";

export async function setupNotifications() {
  await Notifications.requestPermissionsAsync();
}

export async function notify(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null
  });
}
