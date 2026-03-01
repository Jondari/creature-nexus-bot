/**
 * BattleDialogueTriggers type definitions.
 *
 * This module is content-independent: no game-specific messages or data are
 * stored here. Callers supply their own DialogueTrigger arrays and receive a
 * plain string[] back from the engine.
 */

/** Discriminated union of every supported trigger condition. */
export type DialogueTriggerCondition =
  | { type: 'turn'; turnNumber: number }
  | { type: 'hp_threshold'; threshold: number; operator: 'below' | 'above' }
  | { type: 'action'; actionType: 'damage' | 'heal' };

/**
 * A single trigger definition.
 *
 * @property id       - Stable unique identifier used for once-tracking.
 * @property condition - When the trigger fires.
 * @property messages  - Messages returned when the trigger matches.
 * @property once      - When true the trigger fires at most once per engine instance.
 */
export interface DialogueTrigger {
  id: string;
  condition: DialogueTriggerCondition;
  messages: string[];
  once?: boolean;
}

/**
 * The snapshot of battle state passed to BattleDialogueTriggers.evaluate().
 *
 * All fields except turnNumber are optional so callers only populate what is
 * relevant for the current evaluation call.
 *
 * @property turnNumber  - Current turn number (1-based).
 * @property actionType  - Set to 'damage' or 'heal' for action-based triggers.
 * @property hpPercent   - HP ratio of the relevant card in the [0, 1] range.
 */
export interface BattleDialogueContext {
  turnNumber: number;
  actionType?: 'damage' | 'heal';
  hpPercent?: number;
}
