import { Platform } from 'react-native';

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

// Agora RTC wrapper
// react-native-agora is a native module — this file provides typed wrappers

export interface AgoraCallConfig {
  token: string;
  channelName: string;
  uid: number;
}

export async function joinVoiceCall(
  engine: any,
  config: AgoraCallConfig,
): Promise<void> {
  await engine.setEnableSpeakerphone(true);
  await engine.enableAudio();
  await engine.setAudioProfile(0, 1); // DEFAULT, CHATROOM_ENTERTAINMENT
  await engine.joinChannel(config.token, config.channelName, null, config.uid);
}

export async function leaveVoiceCall(engine: any): Promise<void> {
  await engine.leaveChannel();
}

export function createAgoraEngine() {
  // Dynamically import to avoid breaking on web/simulator without native module
  try {
    const { default: RtcEngine } = require('react-native-agora');
    return RtcEngine.create(AGORA_APP_ID);
  } catch {
    console.warn('Agora RTC not available in this environment');
    return null;
  }
}
