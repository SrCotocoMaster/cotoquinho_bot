import mongoose from 'mongoose';

export function connectDB() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cotoquinho';
    mongoose.connect(mongoUri)
        .then(() => console.log('[DB] Conectado ao MongoDB'))
        .catch(err => console.error('[DB] Erro ao conectar ao MongoDB:', err.message));
}
