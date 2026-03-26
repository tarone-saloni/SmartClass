import Notification from '../models/Notification.js';

// GET /api/notifications/:userId
export async function getNotifications(req, res) {
  try {
    const { userId } = req.params;
    const notifs = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(
      notifs.map((n) => ({
        id: n._id,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.createdAt,
      }))
    );
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

// PATCH /api/notifications/read-all/:userId
export async function markAllRead(req, res) {
  try {
    const { userId } = req.params;
    await Notification.updateMany({ user: userId, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('markAllRead error:', err);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
}
