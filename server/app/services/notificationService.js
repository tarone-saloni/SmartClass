import Notification from "../models/Notification.js";
import { emitToUser } from "./socketService.js";

/**
 * Persist a notification to MongoDB and push it in real-time to the user's
 * personal socket room via the `notification:new` event.
 *
 * Always fire-and-forget (never throws) — callers don't need try/catch.
 */
export async function pushNotification(userId, message, type = "course") {
  try {
    const notif = await Notification.create({ user: userId, message, type });
    emitToUser(userId.toString(), "notification:new", {
      id: notif._id,
      message: notif.message,
      type: notif.type,
      read: notif.read,
      createdAt: notif.createdAt,
    });
  } catch {
    // non-critical — never crash the main request
  }
}
