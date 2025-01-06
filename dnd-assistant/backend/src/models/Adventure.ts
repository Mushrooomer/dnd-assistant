import mongoose, { Document, Schema } from 'mongoose';

export interface IAdventure extends Document {
  title: string;
  description: string;
  startingLevel: number;
  endingLevel: number;
  setting: string;
  initialScene: string;
  systemPrompt: string;
}

const adventureSchema = new Schema<IAdventure>({
  title: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  startingLevel: { type: Number, required: true },
  endingLevel: { type: Number, required: true },
  setting: { type: String, required: true },
  initialScene: { type: String, required: true },
  systemPrompt: { type: String, required: true }
});

export const Adventure = mongoose.model<IAdventure>('Adventure', adventureSchema);
export default Adventure; 