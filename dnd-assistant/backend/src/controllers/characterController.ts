import { Request, Response } from 'express';
import Character, { ICharacter } from '../models/Character';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
  user: IUser & { _id: string; };
}

export const createCharacter = async (req: AuthRequest, res: Response) => {
  try {
    const characterData = {
      ...req.body,
      owner: req.user._id
    };

    const character = new Character(characterData);
    await character.save();

    res.status(201).json(character);
  } catch (error: any) {
    console.error('Error creating character:', error);
    res.status(500).json({
      message: 'Error creating character',
      error: error.message
    });
  }
};

export const getCharacters = async (req: AuthRequest, res: Response) => {
  try {
    const characters = await Character.find({ owner: req.user._id });
    res.json(characters);
  } catch (error: any) {
    console.error('Error fetching characters:', error);
    res.status(500).json({
      message: 'Error fetching characters',
      error: error.message
    });
  }
};

export const getCharacter = async (req: AuthRequest, res: Response) => {
  try {
    const character = await Character.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }

    res.json(character);
  } catch (error: any) {
    console.error('Error fetching character:', error);
    res.status(500).json({
      message: 'Error fetching character',
      error: error.message
    });
  }
};

export const updateCharacter = async (req: AuthRequest, res: Response) => {
  try {
    const character = await Character.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );

    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }

    res.json(character);
  } catch (error: any) {
    console.error('Error updating character:', error);
    res.status(500).json({
      message: 'Error updating character',
      error: error.message
    });
  }
};

export const deleteCharacter = async (req: AuthRequest, res: Response) => {
  try {
    const character = await Character.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }

    res.json({ message: 'Character deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting character:', error);
    res.status(500).json({
      message: 'Error deleting character',
      error: error.message
    });
  }
}; 