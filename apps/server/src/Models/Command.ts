import mongoose, { Schema, Document } from 'mongoose';

export interface ICommand extends Document {
    name: string;
    description: string;
    type: string;
    response: string;
    guildId: string;
    targets: string[];
    attachments: string[];
    options: any;
    createdAt: Date;
}

const CommandSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    response: { type: String },
    guildId: { type: String, required: true },
    targets: { type: [String], default: [] },
    attachments: { type: [String], default: [] },
    options: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ICommand>('Command', CommandSchema);
