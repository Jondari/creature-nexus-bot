import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import { t } from '@/utils/i18n';

export type RulesContext = 'battle' | 'deck' | 'general';

interface Props {
  context?: RulesContext;
}

export function RulesContent({ context = 'general' }: Props) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator>
      {(context === 'general' || context === 'battle') && (
        <>
          <Text style={styles.h2}>{t('rules.sections.basics')}</Text>
          <Bullet>{t('rules.basics.hand')}</Bullet>
          <Bullet>{t('rules.basics.field')}</Bullet>
          <Bullet>{t('rules.basics.energyStart')}</Bullet>

          <Text style={styles.h2}>{t('rules.sections.turn')}</Text>
          <Bullet>{t('rules.turn.drawEnergy')}</Bullet>
          <Bullet>{t('rules.turn.mainPhase')}</Bullet>
          <Bullet>{t('rules.turn.autoEnd')}</Bullet>

          <Text style={styles.h2}>{t('rules.sections.energySpells')}</Text>
          <Bullet>{t('rules.energy.attacksCost')}</Bullet>
          <Bullet>{t('rules.energy.retireCost')}</Bullet>
          <Bullet>{t('rules.energy.catalyst')}</Bullet>

          <Text style={styles.h2}>{t('rules.sections.attacksAffinity')}</Text>
          <Bullet>{t('rules.attacks.p1NoAttack')}</Bullet>
          <Bullet>{t('rules.attacks.onePerTurn')}</Bullet>
          <Bullet>{t('rules.attacks.mythicCooldown')}</Bullet>
          <Bullet>{t('rules.affinity.title')}</Bullet>
          <SubBullet>{t('rules.affinity.line1')}</SubBullet>
          <SubBullet>{t('rules.affinity.line2')}</SubBullet>

          <Text style={styles.h2}>{t('rules.sections.targetsScoring')}</Text>
          <Bullet>{t('rules.targets.creatureKill')}</Bullet>
          <Bullet>{t('rules.targets.win')}</Bullet>
          <Bullet>{t('rules.targets.lose')}</Bullet>
        </>
      )}

      {(context === 'general' || context === 'deck') && (
        <>
          <Text style={styles.h2}>{t('rules.sections.deckBuilding')}</Text>
          <Bullet>{t('rules.deck.size')}</Bullet>
          <Bullet>{t('rules.deck.copies')}</Bullet>
          <Bullet>{t('rules.deck.save')}</Bullet>
        </>
      )}
    </ScrollView>
  );
}

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const SubBullet = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.subBulletRow}>
    <Text style={styles.subBulletDash}>–</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: 200,
  },
  container: {
    padding: 16,
    gap: 8,
  },
  h1: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  h2: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  subBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginLeft: 16,
    marginTop: 2,
  },
  bulletDot: {
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  subBulletDash: {
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bulletText: {
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
