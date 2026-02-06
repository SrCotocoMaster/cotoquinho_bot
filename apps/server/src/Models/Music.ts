import mongoose, { Schema, Document } from 'mongoose';

export interface IMusic extends Document {
    title: string;
    url: string;
    thumbnail?: string;
    duration: number;
    source: 'youtube' | 'local' | 'spotify' | 'url';
    userId?: string;
    guildId: string;
    createdAt: Date;
}

const MusicSchema: Schema = new Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail: { type: String },
    duration: { type: Number, default: 0 },
    source: { type: String, required: true, enum: ['youtube', 'local', 'spotify', 'url'], default: 'youtube' },
    userId: { type: String },
    guildId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Index to avoid duplicating the same song in the same guild
MusicSchema.index({ url: 1, guildId: 1 }, { unique: true });

export default mongoose.model<IMusic>('Music', MusicSchema);
