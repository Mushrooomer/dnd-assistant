import mongoose, { Document, Schema } from 'mongoose';

export interface ICharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface ICharacter extends Document {
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  experience: number;
  stats: ICharacterStats;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
  proficiencies: string[];
  equipment: string[];
  features: string[];
  owner: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const characterSchema = new Schema<ICharacter>({
  name: { type: String, required: true },
  race: { type: String, required: true },
  class: { type: String, required: true },
  level: { type: Number, required: true, default: 1 },
  background: { type: String, required: true },
  alignment: { type: String, required: true },
  experience: { type: Number, default: 0 },
  stats: {
    strength: { type: Number, required: true },
    dexterity: { type: Number, required: true },
    constitution: { type: Number, required: true },
    intelligence: { type: Number, required: true },
    wisdom: { type: Number, required: true },
    charisma: { type: Number, required: true }
  },
  hitPoints: { type: Number, required: true },
  maxHitPoints: { type: Number, required: true },
  armorClass: { type: Number, required: true },
  proficiencies: [{ type: String }],
  equipment: [{ type: String }],
  features: [{ type: String }],
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const Character = mongoose.model<ICharacter>('Character', characterSchema);
export default Character; 