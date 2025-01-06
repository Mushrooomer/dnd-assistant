import OpenAI from 'openai';
import dotenv from 'dotenv';
import { IGameMemory, IGameState } from '../models/Game';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are an experienced Dungeon Master for a D&D 5E game. 
Your role is to create an engaging and immersive experience while following D&D rules.
Respond in character as a DM, describing scenes vividly and managing game mechanics naturally.
Keep responses concise but descriptive, and always maintain the fantasy atmosphere.
If players want to perform an action, indicate if they need to roll dice and which type.`;

const formatGameContext = (gameState: IGameState): string => {
  if (!gameState || !gameState.memory) {
    return 'New game session starting in a tavern.';
  }

  const { current_scene, memory } = gameState;
  const { world_state, key_events } = memory;

  try {
    // Get recent key events (last 5)
    const recentEvents = key_events
      ?.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      ?.slice(0, 5)
      ?.map(event => event.event)
      ?.join('. ') || '';

    // Get active quests
    const activeQuests = world_state?.active_quests
      ?.filter(quest => quest.status === 'active')
      ?.map(quest => quest.title)
      ?.join(', ') || '';

    // Get recent NPCs (interacted with in the last 24 hours)
    const recentNPCs = world_state?.important_npcs
      ?.filter(npc => {
        const hoursSinceLastInteraction = 
          (Date.now() - new Date(npc.last_interaction).getTime()) / (1000 * 60 * 60);
        return hoursSinceLastInteraction <= 24;
      })
      ?.map(npc => `${npc.name} (${npc.relationship})`)
      ?.join(', ') || '';

    return `
Current Scene: ${current_scene || 'tavern'}
Location: ${world_state?.current_location || 'Starting tavern'}
Recent Events: ${recentEvents}
Active Quests: ${activeQuests}
Recent NPC Interactions: ${recentNPCs}
    `.trim();
  } catch (error) {
    console.error('Error formatting game context:', error);
    return 'Continuing the current scene.';
  }
};

const updateGameMemory = (
  gameState: IGameState,
  playerMessage: string,
  dmResponse: string
): Partial<IGameMemory> => {
  try {
    const memory = gameState?.memory || {
      key_events: [],
      world_state: {
        current_location: 'Starting tavern',
        active_quests: [],
        important_npcs: []
      },
      player_states: {}
    };

    const timestamp = new Date();

    // Add player action to notable actions
    const playerState = Object.values(memory.player_states)[0];
    if (playerState) {
      playerState.notable_actions = playerState.notable_actions || [];
      playerState.notable_actions.push({
        action: playerMessage,
        timestamp
      });
    }

    // Add significant events (if any)
    if (playerMessage.toLowerCase().includes('kill') || 
        playerMessage.toLowerCase().includes('defeat') ||
        playerMessage.toLowerCase().includes('complete')) {
      memory.key_events = memory.key_events || [];
      memory.key_events.push({
        event: playerMessage,
        timestamp,
        importance: 8
      });
    }

    // Update NPC relationships if mentioned
    if (memory.world_state?.important_npcs) {
      memory.world_state.important_npcs.forEach(npc => {
        if (playerMessage.toLowerCase().includes(npc.name.toLowerCase())) {
          npc.last_interaction = timestamp;
        }
      });
    }

    return memory;
  } catch (error) {
    console.error('Error updating game memory:', error);
    return {};
  }
};

export const generateDMResponse = async (
  gameContext: string,
  playerMessage: string,
  messageHistory: { role: 'user' | 'assistant' | 'system', content: string }[],
  gameState: IGameState
) => {
  try {
    const formattedContext = formatGameContext(gameState);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `Game Context:\n${formattedContext}` },
      ...messageHistory.slice(-10), // Keep last 10 messages for short-term memory
      { role: 'user', content: playerMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 300,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    });

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('Empty response from OpenAI');
    }

    // Update game memory
    const updatedMemory = updateGameMemory(gameState, playerMessage, response.choices[0].message.content);

    return {
      content: response.choices[0].message.content,
      updatedMemory
    };
  } catch (error: any) {
    console.error('Error generating DM response:', error);
    if (error.response?.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 500) {
      throw new Error('OpenAI service error. Please try again later.');
    }
    throw new Error(error.message || 'Failed to generate DM response');
  }
};

export const analyzeAction = async (playerMessage: string) => {
  try {
    const messages = [
      {
        role: 'system',
        content: `You are a D&D 5E game analyzer. Analyze the player's action and respond with ONLY a JSON object in this exact format:
{
  "needsRoll": boolean,
  "diceType": string | null,
  "skillCheck": string | null,
  "advantage": boolean,
  "disadvantage": boolean
}
Do not include any other text or explanation.`
      },
      { role: 'user', content: playerMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0,
      max_tokens: 100
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error('Error analyzing action:', error);
    // Return a safe default if analysis fails
    return {
      needsRoll: false,
      diceType: null,
      skillCheck: null,
      advantage: false,
      disadvantage: false
    };
  }
}; 