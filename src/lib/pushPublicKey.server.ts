import { VAPID_PUBLIC_KEY } from "@/lib/pushVapid";

type PushVapidDetails = {
  publicKey: string;
};

type LoadPushVapidDetails = () => Promise<PushVapidDetails>;

export async function resolvePushPublicKey(
  loadPushVapidDetails: LoadPushVapidDetails,
): Promise<string> {
  try {
    const { publicKey } = await loadPushVapidDetails();
    return publicKey;
  } catch (error) {
    if (error instanceof Error && error.message === "WEB_PUSH_PRIVATE_KEY missing") {
      return VAPID_PUBLIC_KEY;
    }

    throw error;
  }
}
