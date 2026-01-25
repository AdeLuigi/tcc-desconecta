import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProgressBar = ({ progress = 0 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.backgroundBar}>
        {/* Barra de Progresso */}
        <View style={[styles.fillBar, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.percentageText}>{progress}%</Text>
    </View>
  );
};
  
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backgroundBar: {
    height: 8,
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fillBar: {
    height: '100%',
    backgroundColor: '#5bc0de', // Cor azul da imagem
    borderRadius: 6,
  },
  percentageText: {
    marginLeft: 8,
    color: '#FFFFFF',
  },
});

export default ProgressBar;