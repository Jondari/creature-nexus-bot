export interface AvailableAvatar {
  name: string;        // Nom de la créature (ex: "Flareen")
  element: string;     // Élément (ex: "fire")
  displayName?: string; // Nom d'affichage traduit (optionnel)
}

export type AvatarCreature = string | null;
