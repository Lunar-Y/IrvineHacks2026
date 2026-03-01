import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ViroARSceneNavigator, ViroARScene, ViroBox, ViroAmbientLight, ViroSpotLight, ViroNode, ViroQuad } from '@reactvision/react-viro';

const PlantScene = () => {
  const [plants, setPlants] = useState<any[]>([]);

  const onSceneClick = (anchor: any) => {
    // Drop a plant at the clicked location on the plane
    const newPlant = {
      position: anchor.position,
      rotation: [0, 0, 0],
      scale: [0.2, 0.2, 0.2],
    };
    setPlants((prev) => [...prev, newPlant]);
  };

  return (
    <ViroARScene onAnchorFound={onSceneClick}>
      <ViroAmbientLight color="#ffffff" />
      <ViroSpotLight
        innerAngle={5}
        outerAngle={90}
        direction={[0, -1, -.2]}
        position={[0, 3, 1]}
        color="#ffffff"
        castsShadow={true}
      />

      {plants.map((plant, index) => (
        <ViroNode key={index} position={plant.position}>
          <ViroBox scale={plant.scale} />
          <ViroQuad
            rotation={[-90, 0, 0]}
            scale={[1, 1, 1]}
            opacity={0.3}
          />
        </ViroNode>
      ))}
    </ViroARScene>
  );
};

export default function ARView() {
  return (
    <View style={styles.container}>
      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{
          scene: PlantScene,
        }}
        style={{ flex: 1 }}
      />
      <View style={styles.controls}>
        <Text style={styles.instruction}>Tap the lawn to place a plant</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instruction: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    padding: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
