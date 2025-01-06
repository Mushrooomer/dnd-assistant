import { Request, Response } from 'express';
import Game, { IGameState } from '../models/Game';
import { generateDMResponse, analyzeAction, generateInitialStory } from '../services/aiService';
import { IUser } from '../models/User';
import Adventure from '../models/Adventure';
import Character from '../models/Character';

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
    const { name, description, adventureId, characterId } = req.body;
    
    if (!name || !adventureId || !characterId) {
      return res.status(400).json({ message: 'Name, adventure selection, and character selection are required' });
    }

    // Get the selected adventure
    const adventure = await Adventure.findById(adventureId);
    if (!adventure) {
      return res.status(404).json({ message: 'Selected adventure not found' });
    }

    // Verify character ownership and get character details
    const character = await Character.findOne({ _id: characterId, owner: req.user._id });
    if (!character) {
      return res.status(404).json({ message: 'Selected character not found or not owned by you' });
    }

    // Generate an engaging initial story
    const initialStory = await generateInitialStory(adventure, character);

    const initialGameState = {
      current_scene: adventure.initialScene,
      memory: {
        key_events: [{
          event: 'Game started',
          timestamp: new Date(),
          importance: 5
        }],
        world_state: {
          current_location: adventure.initialScene,
          active_quests: [{
            title: 'Begin your adventure',
            description: `Start your journey in ${adventure.title}`,
            status: 'active'
          }],
          important_npcs: []
        },
        player_states: {
          [req.user._id.toString()]: {
            character_name: character.name,
            class: character.class,
            race: character.race,
            level: character.level,
            notable_actions: []
          }
        }
      },
      environment: {}
    };

    const game = new Game({
      name,
      description: description || '',
      adventure: adventureId,
      dungeon_master: req.user._id,
      players: [{
        player: req.user._id,
        character: characterId,
        status: 'active',
        joined_at: new Date()
      }],
      status: 'active',
      messages: [{
        sender: 'DM',
        content: initialStory,
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

export const handleDiceRoll = async (req: AuthRequest, res: Response) => {
  try {
    const { diceType, reason } = req.body;
    const gameId = req.params.id;

    if (!diceType || !gameId) {
      return res.status(400).json({ message: 'Dice type and game ID are required' });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user has access to this game
    const playerState = game.players.find(p => {
      const playerId = p.player?.toString();
      return playerId && playerId === req.user._id.toString();
    });
    
    if (!playerState && game.dungeon_master.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the player's character
    const character = await Character.findById(playerState?.character);
    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }

    // Roll the dice
    const roll = Math.floor(Math.random() * parseInt(diceType.slice(1))) + 1;

    // Calculate modifier based on the reason (if it's an ability check)
    let modifier = 0;
    let modifierSource = '';
    
    if (reason) {
      const lowerReason = reason.toLowerCase();
      if (lowerReason.includes('strength') || lowerReason.includes('str')) {
        modifier = Math.floor((character.stats.strength - 10) / 2);
        modifierSource = 'Strength';
      } else if (lowerReason.includes('dexterity') || lowerReason.includes('dex')) {
        modifier = Math.floor((character.stats.dexterity - 10) / 2);
        modifierSource = 'Dexterity';
      } else if (lowerReason.includes('constitution') || lowerReason.includes('con')) {
        modifier = Math.floor((character.stats.constitution - 10) / 2);
        modifierSource = 'Constitution';
      } else if (lowerReason.includes('intelligence') || lowerReason.includes('int')) {
        modifier = Math.floor((character.stats.intelligence - 10) / 2);
        modifierSource = 'Intelligence';
      } else if (lowerReason.includes('wisdom') || lowerReason.includes('wis')) {
        modifier = Math.floor((character.stats.wisdom - 10) / 2);
        modifierSource = 'Wisdom';
      } else if (lowerReason.includes('charisma') || lowerReason.includes('cha')) {
        modifier = Math.floor((character.stats.charisma - 10) / 2);
        modifierSource = 'Charisma';
      }
    }

    // Create roll message
    const rollMessage = {
      sender: req.user.username,
      content: `🎲 Rolled ${diceType}${reason ? ` for ${reason}` : ''}: ${roll}${
        modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier} (${modifierSource})` : ''
      } = ${roll + modifier}`,
      timestamp: new Date(),
      type: 'roll' as const
    };

    // Convert game messages to the format expected by OpenAI
    const messageHistory = game.messages.map(msg => ({
      role: msg.type === 'dm' ? 'assistant' : 'user',
      content: msg.content
    })) as { role: 'user' | 'assistant' | 'system', content: string }[];

    // Get DM's interpretation of the roll
    const dmResponse = await generateDMResponse(
      `Game: ${game.name}. Current scene: ${game.game_state.current_scene}`,
      `Player rolled ${diceType}${reason ? ` for ${reason}` : ''} and got ${roll + modifier} (${roll}${
        modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier} ${modifierSource}` : ''
      })`,
      messageHistory,
      game.game_state
    );

    // Create DM response message
    const dmMessage = {
      sender: 'DM',
      content: dmResponse.content,
      timestamp: new Date(),
      type: 'dm' as const
    };

    // Save messages
    game.messages.push(rollMessage, dmMessage);
    await game.save();

    // Return both messages
    res.json({
      messages: [rollMessage, dmMessage]
    });
  } catch (error: any) {
    console.error('Error processing dice roll:', error);
    res.status(500).json({ 
      message: 'Error processing dice roll',
      error: error.message 
    });
  }
}; 