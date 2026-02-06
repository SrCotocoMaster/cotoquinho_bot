import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
    type: string;
    details: string;
    guildId: string;
    timestamp: Date;
}

const LogSchema: Schema = new Schema({
    type: { type: String, required: true },
    details: { type: String, required: true },
    guildId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<ILog>('Log', LogSchema);
