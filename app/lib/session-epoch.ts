/* =========================================================
   STALE-ANSWER GUARD FOR THE SESSION CHECK
   The page asks the API "is there a session?" as soon as it loads. If the shopper signs in while that request is still
   on its way (the Google callback page does exactly this), its late "no session" answer must not undo the sign-in that
   happened after it was sent. Every sign-in and log out bumps the epoch; an answer is applied only if the epoch is the
   one it was asked under.
========================================================= */

export function createSessionEpoch() {
  let epoch = 0;
  return {
    /* Call when sending a check */
    begin: () => epoch,
    /* Call on every sign-in and log out */
    bump: () => {
      epoch += 1;
    },
    /* Whether a newer sign-in or log out happened since `started` */
    isStale: (started: number) => started !== epoch,
  };
}
