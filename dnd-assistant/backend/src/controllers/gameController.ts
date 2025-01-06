import { Request, Response } from 'express';
import Game, { IGameState } from '../models/Game';
import { generateDMResponse, analyzeAction } from '../services/aiService';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user: IUser & { _id: string; username: string; };
}

const createInitialGameState = (name: string, description: string): IGameState => ({
  current_scene: 'start',
  memory: {
    key_events: [{
      event: 'Game started',
      timestamp: new Date(),
      importance: 5
    }],
    world_state: {
      current_location: 'Starting tavern',
      active_quests: [{
        title: 'Begin your adventure',
        description: 'Start your journey and discover your destiny',
        status: 'active'
      }],
      important_npcs: [{
        name: 'Tavern Keeper',
        description: 'A friendly tavern keeper who can provide information',
        relationship: 'neutral',
        last_interaction: new Date()
      }]
    },
    player_states: {}
  },
  environment: {}
});

export const createGame = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    const initialGameState = createInitialGameState(name, description);

    const game = new Game({
      name,
      description,
      dungeon_master: req.user._id,
      players: [req.user._id],
      status: 'active',
      messages: [{
        sender: 'DM',
        content: 'Welcome to your new adventure! You find yourself in a cozy tavern, the warm firelight casting dancing shadows on the wooden walls. The tavern keeper gives you a friendly nod. What would you like to do?',
        timestamp: new Date(),
        type: 'dm'
      }],
      game_state: initialGameState
    });

    await game.save();
    res.status(201).json(game);
  } catch (error: any) {
    console.error('Error creating game:', error);
    res.status(500).json({ 
      message: 'Error creating game',
      error: error.message 
    });
  }
};

export const getGames = async (req: AuthRequest, res: Response) => {
  try {
    const games = await Game.find({
      $or: [
        { dungeon_master: req.user._id },
        { players: req.user._id }
      ]
    }).populate('dungeon_master', 'username');
    
    res.json(games);
  } catch (error: any) {
    console.error('Error fetching games:', error);
    res.status(500).json({ 
      message: 'Error fetching games',
      error: error.message 
    });
  }
};

export const getGame = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: 'Game ID is required' });
    }

    const game = await Game.findById(req.params.id)
      .populate('dungeon_master', 'username')
      .populate('players', 'username');
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user has access to this game
    const hasAccess = game.players.some(player => player._id.toString() === req.user._id.toString()) ||
                     game.dungeon_master._id.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(game);
  } catch (error: any) {
    console.error('Error fetching game:', error);
    res.status(500).json({ 
      message: 'Error fetching game',
      error: error.message 
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    const gameId = req.params.id;

    if (!message || !gameId) {
      return res.status(400).json({ message: 'Message and game ID are required' });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user has access to this game
    const hasAccess = game.players.some(player => player.toString() === req.user._id.toString()) ||
                     game.dungeon_master.toString() === req.user._id.toString();

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Save player message first
    const playerMessage = {
      sender: req.user.username,
      content: message,
      timestamp: new Date(),
      type: 'player' as const
    };
    game.messages.push(playerMessage);

    // Convert game messages to the format expected by OpenAI
    const messageHistory = game.messages.map(msg => ({
      role: msg.type === 'dm' ? 'assistant' : 'user',
      content: msg.content
    })) as { role: 'user' | 'assistant' | 'system', content: string }[];

    try {
      // Analyze if the action needs a dice roll
      const actionAnalysis = await analyzeAction(message);

      // Generate DM response
      const response = await generateDMResponse(
        `Game: ${game.name}. Current scene: ${game.game_state.current_scene}`,
        message,
        messageHistory,
        game.game_state
      );

      if (!response || !response.content) {
        throw new Error('Invalid response from AI service');
      }

      // Save DM response
      const dmMessage = {
        sender: 'DM',
        content: response.content,
        timestamp: new Date(),
        type: 'dm' as const
      };
      game.messages.push(dmMessage);

      // Update game state with new memory if available
      if (response.updatedMemory) {
        // Ensure all required fields exist
        const updatedMemory = {
          key_events: response.updatedMemory.key_events || game.game_state.memory.key_events || [],
          world_state: {
            current_location: response.updatedMemory.world_state?.current_location || game.game_state.memory.world_state?.current_location || 'Starting tavern',
            active_quests: response.updatedMemory.world_state?.active_quests || game.game_state.memory.world_state?.active_quests || [],
            important_npcs: response.updatedMemory.world_state?.important_npcs || game.game_state.memory.world_state?.important_npcs || []
          },
          player_states: response.updatedMemory.player_states || game.game_state.memory.player_states || {}
        };

        // Update the game state memory
        game.game_state.memory = updatedMemory;
      }

      await game.save();

      res.json({
        messages: [playerMessage, dmMessage],
        actionAnalysis
      });
    } catch (error: any) {
      // Save the error message as a system message
      const errorMessage = {
        sender: 'System',
        content: 'The Dungeon Master is momentarily distracted. Please try your action again.',
        timestamp: new Date(),
        type: 'system' as const
      };
      game.messages.push(errorMessage);
      await game.save();

      console.error('Error with AI service:', error);
      res.status(500).json({ 
        message: 'Error processing message with AI',
        error: error.message,
        messages: [playerMessage, errorMessage]
      });
    }
  } catch (error: any) {
    console.error('Error processing message:', error);
    res.status(500).json({ 
      message: 'Error processing message',
      error: error.message 
    });
  }
};

export const deleteGame = async (req: AuthRequest, res: Response) => {
  try {
    const gameId = req.params.id;

    if (!gameId) {
      return res.status(400).json({ message: 'Game ID is required' });
    }

    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Only the dungeon master can delete the game
    if (game.dungeon_master.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the Dungeon Master can delete the game' });
    }

    await Game.findByIdAndDelete(gameId);
    res.json({ message: 'Game deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting game:', error);
    res.status(500).json({ 
      message: 'Error deleting game',
      error: error.message 
    });
  }
}; 