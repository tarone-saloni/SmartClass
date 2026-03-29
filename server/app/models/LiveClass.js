import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
    // 'meetLink' = teacher pastes a Google Meet / Zoom URL
    // 'platform' = class hosted on-platform via Jitsi embed
    type: { type: String, enum: ['meetLink', 'platform'], default: 'meetLink' },
    meetingLink: { type: String, trim: true, default: '' },
    recordingUrl: { type: String, trim: true, default: '' },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model('LiveClass', liveClassSchema);
