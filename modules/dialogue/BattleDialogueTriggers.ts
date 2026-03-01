import {
  BattleDialogueContext,
  DialogueTrigger,
  DialogueTriggerCondition,
} from '../../types/dialogue';

/**
 * Generic, content-independent battle dialogue trigger engine.
 *
 * Usage:
 *   const engine = new BattleDialogueTriggers();
 *   // At battle start:
 *   engine.reset();
 *   // After each relevant game event:
 *   const messages = engine.evaluate(myTriggers, ctx);
 *   // messages is a plain string[] – display however suits the caller.
 *
 * The engine itself holds zero game content. All messages and conditions live
 * in the DialogueTrigger[] arrays supplied by the caller.
 */
export class BattleDialogueTriggers {
  /** IDs of once-triggers that have already fired in this battle. */
  private readonly firedTriggers = new Set<string>();

  /**
   * Evaluate triggers against the current battle context.
   *
   * @param triggers - Trigger definitions supplied by the caller.
   * @param ctx      - Current battle snapshot.
   * @returns Concatenated messages from every matching trigger.
   */
  evaluate(triggers: DialogueTrigger[], ctx: BattleDialogueContext): string[] {
    const messages: string[] = [];

    for (const trigger of triggers) {
      // Skip once-triggers that have already fired.
      if (trigger.once && this.firedTriggers.has(trigger.id)) {
        continue;
      }

      if (this.matches(trigger.condition, ctx)) {
        messages.push(...trigger.messages);
        if (trigger.once) {
          this.firedTriggers.add(trigger.id);
        }
      }
    }

    return messages;
  }

  /**
   * Reset once-fired tracking.
   * Call this at the start of each new battle.
   */
  reset(): void {
    this.firedTriggers.clear();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private matches(
    cond: DialogueTriggerCondition,
    ctx: BattleDialogueContext,
  ): boolean {
    switch (cond.type) {
      case 'turn':
        return ctx.turnNumber === cond.turnNumber;

      case 'hp_threshold':
        if (ctx.hpPercent === undefined) return false;
        return cond.operator === 'below'
          ? ctx.hpPercent < cond.threshold
          : ctx.hpPercent > cond.threshold;

      case 'action':
        return ctx.actionType === cond.actionType;
    }
  }
}
