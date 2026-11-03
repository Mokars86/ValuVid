// Web Audio API sound effects disabled per user request
class SoundManager {
  playCoinTip() {}
  playLikePop() {}
  playRewardTick() {}
  playSuccessPayout() {}
}

export const sounds = new SoundManager();
