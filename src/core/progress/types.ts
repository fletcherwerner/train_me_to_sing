/** One Prove pass. `date` is the local calendar day `YYYY-MM-DD`; `tonicMidi` -1 means unknown (older data). */
export interface Proof {
  date: string;
  tonicMidi: number;
  score: number;
}

export interface ReviewState {
  step: number;
  /** Local calendar day `YYYY-MM-DD` the review falls due. */
  dueOn: string;
}

/** The part of a lesson's saved progress that mastery and review depend on. */
export interface MasteryProgress {
  passed: boolean;
  proofs: Proof[];
  review: ReviewState | null;
}
