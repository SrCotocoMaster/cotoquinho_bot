require('dotenv').config();
const mongoose = require('mongoose');
const ActivityLog = require('../src/models/ActivityLog');

async function test() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to', process.env.MONGODB_URI);

        console.log('Attempting to save log...');
        const log = new ActivityLog({
            type: 'BOT_READY',
            details: 'Manual Debug Log',
            status: 'SUCCESS'
        });

        const res = await log.save();
        console.log('Log saved successfully:', res);

        console.log('Attempting verify find...');
        const found = await ActivityLog.find({});
        console.log('Found logs count:', found.length);
        console.log('Last log:', found[0]);

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await mongoose.disconnect();
    }
}

test();
