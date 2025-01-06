import { Request, Response } from 'express';
import Adventure from '../models/Adventure';

export const getAdventures = async (_req: Request, res: Response) => {
  try {
    const adventures = await Adventure.find({}, {
      title: 1,
      description: 1,
      startingLevel: 1,
      endingLevel: 1,
      setting: 1
    });
    
    res.json(adventures);
  } catch (error: any) {
    console.error('Error fetching adventures:', error);
    res.status(500).json({ 
      message: 'Error fetching adventures',
      error: error.message 
    });
  }
}; 