import { StreamChat } from 'stream-chat';

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || '';

let client: StreamChat | null = null;

export function getStreamClient(): StreamChat {
  if (!client) {
    client = StreamChat.getInstance(STREAM_API_KEY);
  }
  return client;
}

export async function connectStreamUser(userId: string, token: string): Promise<void> {
  const streamClient = getStreamClient();
  if (streamClient.userID) return; // already connected

  await streamClient.connectUser({ id: userId }, token);
}

export async function disconnectStreamUser(): Promise<void> {
  const streamClient = getStreamClient();
  if (streamClient.userID) {
    await streamClient.disconnectUser();
  }
}

export async function getMatchChannel(channelId: string) {
  const streamClient = getStreamClient();
  const channel = streamClient.channel('messaging', channelId);
  await channel.watch();
  return channel;
}
