import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  sender: string;
  content: string;
  timestamp: Date;
  type: 'dm' | 'player' | 'system' | 'roll';
}

export interface IGameMemory {
  key_events: Array<{
    event: string;
    timestamp: Date;
    importance: number;
  }>;
  world_state: {
    current_location: string;
    active_quests: Array<{
      title: string;
      description: string;
      status: 'active' | 'completed' | 'failed';
    }>;
    important_npcs: Array<{
      name: string;
      description: string;
      relationship: string;
      last_interaction: Date;
    }>;
  };
  player_states: Record<string, {
    character_name: string;
    class: string;
    race: string;
    level: number;
    notable_actions: Array<{
      action: string;
      timestamp: Date;
    }>;
  }>;
}

export interface IGameState {
  current_scene: string;
  memory: IGameMemory;
  environment: Record<string, any>;
}

export interface IGame extends Document {
  name: string;
  description: string;
  dungeon_master: mongoose.Types.ObjectId;
  players: mongoose.Types.ObjectId[];
  status: 'active' | 'paused' | 'completed';
  messages: IMessage[];
  game_state: IGameState;
  created_at: Date;
  updated_at: Date;
}

const gameSchema = new Schema<IGame>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  dungeon_master: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  messages: [{
    sender: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['dm', 'player', 'system', 'roll'],
      required: true
    }
  }],
  game_state: {
    current_scene: { type: String, default: 'start' },
    memory: {
      key_events: [{
        event: String,
        timestamp: Date,
        importance: Number
      }],
      world_state: {
        current_location: String,
        active_quests: [{
          title: String,
          description: String,
          status: {
            type: String,
            enum: ['active', 'completed', 'failed'],
            default: 'active'
          }
        }],
        important_npcs: [{
          name: String,
          description: String,
          relationship: String,
          last_interaction: Date
        }]
      },
      player_states: {
        type: Map,
        of: {
          character_name: String,
          class: String,
          race: String,
          level: Number,
          notable_actions: [{
            action: String,
            timestamp: Date
          }]
        }
      }
    },
    environment: { type: Map, of: Schema.Types.Mixed, default: {} }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export const Game = mongoose.model<IGame>('Game', gameSchema);
export default Game; 