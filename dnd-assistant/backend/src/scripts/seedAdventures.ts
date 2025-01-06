import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Adventure from '../models/Adventure';

dotenv.config();

const adventures = [
  {
    title: "Lost Mine of Phandelver",
    description: "A D&D adventure for levels 1-5. The adventurers are hired to escort supplies to the frontier town of Phandalin. But the town has been taken over by a gang of bandits, and a mysterious force lurks in the nearby mine.",
    startingLevel: 1,
    endingLevel: 5,
    setting: "Sword Coast, Forgotten Realms",
    initialScene: "On the Triboar Trail, escorting a wagon of supplies to Phandalin",
    systemPrompt: "You are DMing the Lost Mine of Phandelver. The adventure begins on the Triboar Trail. The players are escorting a wagon of supplies to the frontier town of Phandalin. Keep track of key locations like Cragmaw Hideout, Phandalin, and Wave Echo Cave. Remember important NPCs like Sildar Hallwinter, Gundren Rockseeker, and the Black Spider."
  },
  {
    title: "Out of the Abyss",
    description: "A harrowing journey through the Underdark, where players must escape imprisonment by the drow and survive the dangers of the subterranean realm while madness spreads throughout the Underdark.",
    startingLevel: 1,
    endingLevel: 15,
    setting: "Underdark, Forgotten Realms",
    initialScene: "Imprisoned in the drow outpost of Velkenvelve",
    systemPrompt: "You are DMing Out of the Abyss. The players begin as prisoners in Velkenvelve. Focus on the themes of survival, madness, and the alien nature of the Underdark. Keep track of demon lords' activities and the growing madness in the Underdark. Remember key NPCs and their motivations."
  },
  {
    title: "The Wild Beyond the Witchlight",
    description: "A whimsical journey through the Feywild, where players must navigate the magical carnival and restore joy to a realm of eternal twilight.",
    startingLevel: 1,
    endingLevel: 8,
    setting: "The Feywild",
    initialScene: "At the Witchlight Carnival, where magic and wonder await",
    systemPrompt: "You are DMing The Wild Beyond the Witchlight. The adventure begins at the Witchlight Carnival. Emphasize whimsy, wonder, and the unusual logic of the Feywild. Remember that most conflicts can be resolved without violence. Keep track of the players' choices and their impact on the story."
  },
  {
    title: "Baldur's Gate: Descent into Avernus",
    description: "A dark journey from the city of Baldur's Gate to Avernus, the first layer of the Nine Hells, where players must save the city from being dragged into hell.",
    startingLevel: 1,
    endingLevel: 13,
    setting: "Baldur's Gate and Avernus",
    initialScene: "In the city of Baldur's Gate, investigating a series of mysterious disappearances",
    systemPrompt: "You are DMing Descent into Avernus. The adventure begins in Baldur's Gate. Focus on themes of corruption, redemption, and the consequences of choices. Keep track of infernal contracts, soul coins, and the politics of both Baldur's Gate and Avernus."
  },
  {
    title: "Frozen Sick",
    description: "An adventure in the frozen frontier of Eiselcross, where players investigate a mysterious illness that turns people into solid ice from the inside out.",
    startingLevel: 1,
    endingLevel: 3,
    setting: "Eiselcross, Wildemount",
    initialScene: "In the village of Palebank, investigating the frozen sick",
    systemPrompt: "You are DMing Frozen Sick. The adventure begins in Palebank Village. Focus on the mystery of the frozen sick and the harsh environment of Eiselcross. Keep track of infected NPCs, research progress, and the players' exposure to the illness."
  }
];

const seedAdventures = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Clear existing adventures
    await Adventure.deleteMany({});
    console.log('Cleared existing adventures');

    // Insert new adventures
    await Adventure.insertMany(adventures);
    console.log('Seeded adventures successfully');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding adventures:', error);
  }
};

// Run the seeding function
seedAdventures(); 