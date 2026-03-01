import { Element } from '@/utils/storyDeckGenerator';

export interface StoryBattle {
  id: string;
  name: string;
  description: string;
  x: number; // Position on the map (0-100)
  y: number; // Position on the map (0-100)
  connections: string[]; // IDs of connected battles
  isCompleted: boolean;
  isAccessible: boolean;
  isBoss: boolean;
}

export interface StoryChapter {
  id: number;
  name: string;
  description: string;
  element: Element;
  colorTheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  battles: StoryBattle[];
  isUnlocked: boolean;
  isCompleted: boolean;
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 1,
    name: 'story.data.chapter_1.name',
    description: 'story.data.chapter_1.description',
    element: "all",
    colorTheme: {
      primary: "#8B5CF6", // Purple
      secondary: "#A78BFA",
      accent: "#C4B5FD",
      background: "#1E1B4B",
    },
    battles: [
      {
        id: "nexus_1",
        name: 'story.data.chapter_1.battles.nexus_1.name',
        description: 'story.data.chapter_1.battles.nexus_1.description',
        x: 20,
        y: 80,
        connections: ["nexus_2"],
        isCompleted: false,
        isAccessible: true,
        isBoss: false,
      },
      {
        id: "nexus_2",
        name: 'story.data.chapter_1.battles.nexus_2.name',
        description: 'story.data.chapter_1.battles.nexus_2.description',
        x: 40,
        y: 60,
        connections: ["nexus_3", "nexus_4"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "nexus_3",
        name: 'story.data.chapter_1.battles.nexus_3.name',
        description: 'story.data.chapter_1.battles.nexus_3.description',
        x: 60,
        y: 40,
        connections: ["nexus_boss"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "nexus_4",
        name: 'story.data.chapter_1.battles.nexus_4.name',
        description: 'story.data.chapter_1.battles.nexus_4.description',
        x: 60,
        y: 80,
        connections: ["nexus_boss"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "nexus_boss",
        name: 'story.data.chapter_1.battles.nexus_boss.name',
        description: 'story.data.chapter_1.battles.nexus_boss.description',
        x: 80,
        y: 60,
        connections: [],
        isCompleted: false,
        isAccessible: false,
        isBoss: true,
      },
    ],
    isUnlocked: true,
    isCompleted: false,
  },
  {
    id: 2,
    name: 'story.data.chapter_2.name',
    description: 'story.data.chapter_2.description',
    element: "water",
    colorTheme: {
      primary: "#0EA5E9", // Blue
      secondary: "#38BDF8",
      accent: "#7DD3FC",
      background: "#0C4A6E",
    },
    battles: [
      {
        id: "water_1",
        name: 'story.data.chapter_2.battles.water_1.name',
        description: 'story.data.chapter_2.battles.water_1.description',
        x: 15,
        y: 85,
        connections: ["water_2"],
        isCompleted: false,
        isAccessible: true,
        isBoss: false,
      },
      {
        id: "water_2",
        name: 'story.data.chapter_2.battles.water_2.name',
        description: 'story.data.chapter_2.battles.water_2.description',
        x: 35,
        y: 70,
        connections: ["water_3", "water_4"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "water_3",
        name: 'story.data.chapter_2.battles.water_3.name',
        description: 'story.data.chapter_2.battles.water_3.description',
        x: 25,
        y: 45,
        connections: ["water_5"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "water_4",
        name: 'story.data.chapter_2.battles.water_4.name',
        description: 'story.data.chapter_2.battles.water_4.description',
        x: 55,
        y: 55,
        connections: ["water_5"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "water_5",
        name: 'story.data.chapter_2.battles.water_5.name',
        description: 'story.data.chapter_2.battles.water_5.description',
        x: 65,
        y: 30,
        connections: ["water_boss"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "water_boss",
        name: 'story.data.chapter_2.battles.water_boss.name',
        description: 'story.data.chapter_2.battles.water_boss.description',
        x: 85,
        y: 50,
        connections: [],
        isCompleted: false,
        isAccessible: false,
        isBoss: true,
      },
    ],
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 3,
    name: 'story.data.chapter_3.name',
    description: 'story.data.chapter_3.description',
    element: "fire",
    colorTheme: {
      primary: "#F97316", // Orange
      secondary: "#FB923C",
      accent: "#FDBA74",
      background: "#7C2D12",
    },
    battles: [
      {
        id: "fire_1",
        name: 'story.data.chapter_3.battles.fire_1.name',
        description: 'story.data.chapter_3.battles.fire_1.description',
        x: 20,
        y: 75,
        connections: ["fire_2"],
        isCompleted: false,
        isAccessible: true,
        isBoss: false,
      },
      {
        id: "fire_2",
        name: 'story.data.chapter_3.battles.fire_2.name',
        description: 'story.data.chapter_3.battles.fire_2.description',
        x: 40,
        y: 60,
        connections: ["fire_3", "fire_4"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "fire_3",
        name: 'story.data.chapter_3.battles.fire_3.name',
        description: 'story.data.chapter_3.battles.fire_3.description',
        x: 30,
        y: 35,
        connections: ["fire_5"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "fire_4",
        name: 'story.data.chapter_3.battles.fire_4.name',
        description: 'story.data.chapter_3.battles.fire_4.description',
        x: 60,
        y: 45,
        connections: ["fire_5"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "fire_5",
        name: 'story.data.chapter_3.battles.fire_5.name',
        description: 'story.data.chapter_3.battles.fire_5.description',
        x: 70,
        y: 25,
        connections: ["fire_boss"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "fire_boss",
        name: 'story.data.chapter_3.battles.fire_boss.name',
        description: 'story.data.chapter_3.battles.fire_boss.description',
        x: 85,
        y: 40,
        connections: [],
        isCompleted: false,
        isAccessible: false,
        isBoss: true,
      },
    ],
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 4,
    name: 'story.data.chapter_4.name',
    description: 'story.data.chapter_4.description',
    element: "earth",
    colorTheme: {
      primary: "#65A30D", // Green
      secondary: "#84CC16",
      accent: "#A3E635",
      background: "#365314",
    },
    battles: [
      {
        id: "earth_1",
        name: 'story.data.chapter_4.battles.earth_1.name',
        description: 'story.data.chapter_4.battles.earth_1.description',
        x: 25,
        y: 80,
        connections: ["earth_2"],
        isCompleted: false,
        isAccessible: true,
        isBoss: false,
      },
      {
        id: "earth_2",
        name: 'story.data.chapter_4.battles.earth_2.name',
        description: 'story.data.chapter_4.battles.earth_2.description',
        x: 45,
        y: 65,
        connections: ["earth_3", "earth_4"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "earth_3",
        name: 'story.data.chapter_4.battles.earth_3.name',
        description: 'story.data.chapter_4.battles.earth_3.description',
        x: 30,
        y: 40,
        connections: ["earth_5"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "earth_4",
        name: 'story.data.chapter_4.battles.earth_4.name',
        description: 'story.data.chapter_4.battles.earth_4.description',
        x: 65,
        y: 50,
        connections: ["earth_5"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "earth_5",
        name: 'story.data.chapter_4.battles.earth_5.name',
        description: 'story.data.chapter_4.battles.earth_5.description',
        x: 75,
        y: 30,
        connections: ["earth_boss"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "earth_boss",
        name: 'story.data.chapter_4.battles.earth_boss.name',
        description: 'story.data.chapter_4.battles.earth_boss.description',
        x: 90,
        y: 45,
        connections: [],
        isCompleted: false,
        isAccessible: false,
        isBoss: true,
      },
    ],
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 5,
    name: 'story.data.chapter_5.name',
    description: 'story.data.chapter_5.description',
    element: "air",
    colorTheme: {
      primary: "#E5E7EB", // Silver/White
      secondary: "#F3F4F6",
      accent: "#FFFFFF",
      background: "#374151",
    },
    battles: [
      {
        id: "air_1",
        name: 'story.data.chapter_5.battles.air_1.name',
        description: 'story.data.chapter_5.battles.air_1.description',
        x: 20,
        y: 70,
        connections: ["air_2"],
        isCompleted: false,
        isAccessible: true,
        isBoss: false,
      },
      {
        id: "air_2",
        name: 'story.data.chapter_5.battles.air_2.name',
        description: 'story.data.chapter_5.battles.air_2.description',
        x: 40,
        y: 55,
        connections: ["air_3", "air_4"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "air_3",
        name: 'story.data.chapter_5.battles.air_3.name',
        description: 'story.data.chapter_5.battles.air_3.description',
        x: 35,
        y: 30,
        connections: ["air_5"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "air_4",
        name: 'story.data.chapter_5.battles.air_4.name',
        description: 'story.data.chapter_5.battles.air_4.description',
        x: 60,
        y: 40,
        connections: ["air_5"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "air_5",
        name: 'story.data.chapter_5.battles.air_5.name',
        description: 'story.data.chapter_5.battles.air_5.description',
        x: 70,
        y: 20,
        connections: ["air_boss"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "air_boss",
        name: 'story.data.chapter_5.battles.air_boss.name',
        description: 'story.data.chapter_5.battles.air_boss.description',
        x: 85,
        y: 35,
        connections: [],
        isCompleted: false,
        isAccessible: false,
        isBoss: true,
      },
    ],
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 6,
    name: 'story.data.chapter_6.name',
    description: 'story.data.chapter_6.description',
    element: "all",
    colorTheme: {
      primary: "#7C3AED", // Deep Purple
      secondary: "#8B5CF6",
      accent: "#A78BFA",
      background: "#2D1B69",
    },
    battles: [
      {
        id: "final_1",
        name: 'story.data.chapter_6.battles.final_1.name',
        description: 'story.data.chapter_6.battles.final_1.description',
        x: 15,
        y: 85,
        connections: ["final_2", "final_3"],
        isCompleted: false,
        isAccessible: true,
        isBoss: false,
      },
      {
        id: "final_2",
        name: 'story.data.chapter_6.battles.final_2.name',
        description: 'story.data.chapter_6.battles.final_2.description',
        x: 30,
        y: 60,
        connections: ["final_4"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "final_3",
        name: 'story.data.chapter_6.battles.final_3.name',
        description: 'story.data.chapter_6.battles.final_3.description',
        x: 50,
        y: 70,
        connections: ["final_4"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "final_4",
        name: 'story.data.chapter_6.battles.final_4.name',
        description: 'story.data.chapter_6.battles.final_4.description',
        x: 65,
        y: 45,
        connections: ["final_boss"],
        isCompleted: false,
        isAccessible: false,
        isBoss: false,
      },
      {
        id: "final_boss",
        name: 'story.data.chapter_6.battles.final_boss.name',
        description: 'story.data.chapter_6.battles.final_boss.description',
        x: 85,
        y: 50,
        connections: [],
        isCompleted: false,
        isAccessible: false,
        isBoss: true,
      },
    ],
    isUnlocked: false,
    isCompleted: false,
  },
];

export function getChapterById(id: number): StoryChapter | undefined {
  return STORY_CHAPTERS.find(chapter => chapter.id === id);
}

export function getNextChapter(currentChapterId: number): StoryChapter | undefined {
  return STORY_CHAPTERS.find(chapter => chapter.id === currentChapterId + 1);
}

export function unlockNextChapter(completedChapterId: number): void {
  const nextChapter = getNextChapter(completedChapterId);
  if (nextChapter) {
    nextChapter.isUnlocked = true;
  }
}

export function updateBattleProgress(chapterId: number, battleId: string, completed: boolean): void {
  const chapter = getChapterById(chapterId);
  if (!chapter) return;

  const battle = chapter.battles.find(b => b.id === battleId);
  if (!battle) return;

  battle.isCompleted = completed;

  // Update accessibility of connected battles
  if (completed) {
    battle.connections.forEach(connectionId => {
      const connectedBattle = chapter.battles.find(b => b.id === connectionId);
      if (connectedBattle) {
        connectedBattle.isAccessible = true;
      }
    });

    // Check if chapter is completed (all battles completed)
    const allBattlesCompleted = chapter.battles.every(b => b.isCompleted);
    if (allBattlesCompleted) {
      chapter.isCompleted = true;
      unlockNextChapter(chapterId);
    }
  }
}
