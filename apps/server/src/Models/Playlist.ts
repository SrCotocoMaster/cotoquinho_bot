import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaylist extends Document {
    name: string;
    userId: string;
    guildId: string;
    tracks: { title: string, url: string }[];
    createdAt: Date;
}

const PlaylistSchema: Schema = new Schema({
    name: { type: String, required: true },
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    tracks: {
        type: [{ title: String, url: String }],
        default: []
    },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
