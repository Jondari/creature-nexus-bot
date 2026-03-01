import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Privacy Policy',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.background.primary },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: { fontFamily: 'Poppins-SemiBold' }
      }} />
      
      <LinearGradient
        colors={[Colors.primary[900], Colors.background.primary]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>Creature Nexus TCG</Text>
          <Text style={styles.lastUpdated}>Last updated: 2025-08-26</Text>
        </View>

        <Text style={styles.introText}>
          We respect your privacy. This policy explains what data we collect, how we use it, and your rights.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who we are</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Controller:</Text> Creature Nexus (sole proprietor). Contact:{' '}
            <Text style={styles.link}>contact.giovanni.i@gmail.com</Text>.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What we collect</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Account data</Text>: email, display name, Google user ID (via Firebase Auth).
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Gameplay data</Text>: progress, deck lists, in-game items/coins (Firebase Firestore).
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Purchase data</Text>: product IDs, timestamps, purchase status (Google Play Billing & RevenueCat). We never collect full card details.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Device/technical data</Text>: IP, device/OS info and logs for security and fraud prevention.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How we use data</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Provide and improve the game and features you request.</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Process in-app purchases and deliver digital goods (packs/coins).</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Secure accounts, prevent abuse, and comply with legal obligations.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal bases (EEA/UK)</Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Contract</Text> (to provide the app and IAP you request).
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Legitimate interests</Text> (security, fraud prevention, improvements).
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Consent</Text> where required.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sharing</Text>
          <Text style={styles.sectionText}>
            Shared only with service providers necessary to run the app:
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Google Firebase (Authentication, Firestore)</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>Google Play Billing (Android purchases)</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>RevenueCat (purchase validation & entitlements)</Text>
          </View>
          <Text style={styles.sectionText}>
            No third-party ad networks. We do not sell personal data.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data retention</Text>
          <Text style={styles.sectionText}>
            We keep account/gameplay data while your account is active. Purchase records may be retained as required by law.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your rights</Text>
          <Text style={styles.sectionText}>
            You may request access, correction, deletion, restriction, or portability, and object to certain processing. Contact us at{' '}
            <Text style={styles.link}>contact.giovanni.i@gmail.com</Text>.
          </Text>
        </View>

        <View id="delete-account" style={styles.section}>
          <Text style={styles.sectionTitle}>Account & data deletion</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>In-app:</Text> Settings → Delete account. This action is <Text style={styles.bold}>irreversible</Text>.
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Without the app:</Text> email <Text style={styles.link}>contact.giovanni.i@gmail.com</Text> (subject “Deletion request – Creature Nexus TCG”) and include your account email or UID if possible.
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Data deleted:</Text> Firebase account and Firestore profile (progress, decks, cards, nexusCoins, avatar, preferences).
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Data retained:</Text> purchase records (Google Play / RevenueCat) kept for legal/accounting purposes; technical logs and backups for up to 30 days.
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Timeline:</Text> deletion starts immediately; completed within 30 days (backups may take up to 30 days to fully purge).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children</Text>
          <Text style={styles.sectionText}>
            The app is not directed to children under 13. If a child has provided personal data, contact us and we will delete it.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>International transfers</Text>
          <Text style={styles.sectionText}>
            Data may be processed in the EU or other countries where our providers operate, with appropriate safeguards where required.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changes</Text>
          <Text style={styles.sectionText}>
            We may update this policy; we will post changes here with a new "Last updated" date.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.frenchSection}>
          <Text style={styles.frenchTitle}>Version française</Text>
          <Text style={styles.title}>Politique de confidentialité</Text>
          <Text style={styles.subtitle}>Creature Nexus TCG</Text>
          <Text style={styles.lastUpdated}>Dernière mise à jour : 26/08/2025</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Qui sommes-nous ?</Text>
            <Text style={styles.sectionText}>
              <Text style={styles.bold}>Responsable de traitement :</Text> Creature Nexus (entreprise individuelle). Contact :{' '}
              <Text style={styles.link}>contact.giovanni.i@gmail.com</Text>.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Données collectées</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Compte</Text> : e-mail, nom d'affichage, identifiant Google (via Firebase Auth).
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Jeu</Text> : progression, decks, objets/coins (Firebase Firestore).
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Achat</Text> : identifiants produits, horodatages, statut (Google Play Billing & RevenueCat). Aucune donnée complète de carte bancaire n'est collectée.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Technique</Text> : IP, infos appareil/OS et journaux pour la sécurité et la prévention de la fraude.
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Finalités</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Fournir et améliorer le jeu et les fonctionnalités demandées.</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Traiter les achats intégrés et livrer les biens numériques (boosters/coins).</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Sécuriser les comptes, prévenir les abus et respecter nos obligations légales.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bases légales (UE/R.-U.)</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Exécution du contrat</Text>
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Intérêt légitime</Text> (sécurité, anti-fraude, amélioration)
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Consentement</Text> lorsque requis
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Partage</Text>
            <Text style={styles.sectionText}>
              Partage limité à nos prestataires techniques : Firebase, Google Play Billing, RevenueCat. Pas de réseaux publicitaires tiers. Aucune vente de données personnelles.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Durées de conservation</Text>
            <Text style={styles.sectionText}>
              Données de compte conservées tant que le compte est actif. Les preuves d'achat peuvent être conservées selon la loi.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vos droits</Text>
            <Text style={styles.sectionText}>
              Accès, rectification, suppression, limitation, portabilité, opposition : écrivez à{' '}
              <Text style={styles.link}>contact.giovanni.i@gmail.com</Text>.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suppression du compte et des données</Text>
            <Text style={styles.sectionText}>
              <Text style={styles.bold}>Dans l’application :</Text> Réglages → Supprimer le compte. Action <Text style={styles.bold}>irréversible</Text>.
            </Text>
            <Text style={styles.sectionText}>
              <Text style={styles.bold}>Sans l’app :</Text> écrivez à <Text style={styles.link}>contact.giovanni.i@gmail.com</Text> (objet « Deletion request – Creature Nexus TCG ») avec votre e-mail de compte ou UID si possible.
            </Text>
            <Text style={styles.sectionText}>
              <Text style={styles.bold}>Données supprimées :</Text> compte Firebase et profil Firestore (progression, decks, cartes, nexusCoins, avatar, préférences).
            </Text>
            <Text style={styles.sectionText}>
              <Text style={styles.bold}>Données conservées :</Text> preuves d’achat (Google Play / RevenueCat) pour obligations comptables/légales ; journaux techniques et sauvegardes jusqu’à 30 jours.
            </Text>
            <Text style={styles.sectionText}>
              <Text style={styles.bold}>Délai :</Text> démarrage immédiat ; finalisation sous 30 jours (les sauvegardes peuvent nécessiter jusqu’à 30 jours).
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transferts internationaux</Text>
            <Text style={styles.sectionText}>
              Des traitements peuvent avoir lieu hors UE chez nos prestataires, avec garanties appropriées le cas échéant.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Modifications</Text>
            <Text style={styles.sectionText}>
              Cette politique peut évoluer ; la version à jour et la date de mise à jour seront publiées ici.
            </Text>
          </View>

          <Text style={styles.footnote}>
            Note : ce document est informatif et ne constitue pas un conseil juridique.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Colors.text.secondary,
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  introText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    lineHeight: 22,
    flex: 1,
  },
  bold: {
    fontFamily: 'Inter-Medium',
    color: Colors.text.primary,
  },
  link: {
    color: Colors.accent?.[500] || Colors.primary || '#007AFF',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.background.secondary,
    marginVertical: 32,
  },
  frenchSection: {
    marginTop: 24,
  },
  frenchTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  footnote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 16,
  },
});