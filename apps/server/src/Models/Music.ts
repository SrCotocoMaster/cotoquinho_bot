import mongoose, { Schema, Document } from 'mongoose';

export interface IMusic extends Document {
    title: string;
    path: string;
    duration: number;
    userId: string;
    guildId: string;
    createdAt: Date;
}

const MusicSchema: Schema = new Schema({
    title: { type: String, required: true },
    path: { type: String, required: true },
    duration: { type: Number, default: 0 },
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Music = mongoose.model<IMusic>('Music', MusicSchema);
