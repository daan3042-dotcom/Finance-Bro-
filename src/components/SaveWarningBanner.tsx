import { StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
};

// Kort, niet-blokkerend bannertje: de gebruiker gaat altijd gewoon door met
// de les (optie 2 uit C6), dit laat alleen even merken dat de laatste
// voortgang niet is opgeslagen. Verdwijnt vanzelf (zie useAutoHideFlag).
export function SaveWarningBanner({ visible }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Niet opgeslagen. Controleer je verbinding.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FCEAEA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E14343',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  text: {
    color: '#B92B2B',
    fontSize: 13,
    fontWeight: '600',
  },
});
