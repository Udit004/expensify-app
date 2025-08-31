import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getEnvironmentInfo } from '../config/environment';

export const EnvironmentInfo: React.FC = () => {
  const envInfo = getEnvironmentInfo();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Environment Info</Text>
      <Text style={styles.info}>Development: {envInfo.isDevelopment ? 'Yes' : 'No'}</Text>
      <Text style={styles.info}>Platform: {envInfo.platform}</Text>
      <Text style={styles.info}>Expo Go: {envInfo.isExpoGo ? 'Yes' : 'No'}</Text>
      <Text style={styles.info}>Web: {envInfo.isWeb ? 'Yes' : 'No'}</Text>
      <Text style={styles.info}>API URL: {envInfo.apiUrl}</Text>
      <Text style={styles.info}>Production URL: {envInfo.productionUrl}</Text>
      <Text style={styles.info}>Local URL: {envInfo.localUrl}</Text>
      <Text style={styles.info}>Explicit API URL: {envInfo.explicitApiUrl}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  info: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
});
