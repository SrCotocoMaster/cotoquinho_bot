import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomation extends Document {
    guildId: string;
    name: string;
    triggerType: 'WEBHOOK' | 'WELCOME' | 'MEMBER_JOIN' | 'ROLE_ADDED';
    action: 'SEND_MESSAGE' | 'ADD_ROLE' | 'REMOVE_ROLE';
    config: any;
    enabled: boolean;
    createdAt: Date;
}

const AutomationSchema: Schema = new Schema({
    guildId: {
        type: String,
        required: [true, 'ID da guilda é obrigatório'],
    },
    name: {
        type: String,
        required: [true, 'Nome da automação é obrigatório'],
        trim: true,
    },
    triggerType: {
        type: String,
        enum: ['WEBHOOK', 'WELCOME', 'MEMBER_JOIN', 'ROLE_ADDED'],
        required: true,
    },
    action: {
        type: String,
        enum: ['SEND_MESSAGE', 'ADD_ROLE', 'REMOVE_ROLE'],
        required: true,
    },
    config: {
        type: Schema.Types.Mixed,
        default: {},
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

AutomationSchema.index({ guildId: 1 });

export default mongoose.model<IAutomation>('Automation', AutomationSchema);
