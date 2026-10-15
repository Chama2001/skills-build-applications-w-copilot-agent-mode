import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  name: { type: String, required: true, trim: true },
  mascot: { type: String, required: true, trim: true },
  members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [], required: true },
});

export const Team = model('Team', teamSchema);
