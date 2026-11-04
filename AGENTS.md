<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep predictive math in the pure browser-safe model module, separate from offer fixtures and UI, so coefficients and thresholds can be tested deterministically.
- Keep supplied map-based scoring fixtures separate from Connect offers; the same pure ranking engine accepts either map points plus a user location or explicit sample distances, so test merchants do not change the partner UI.
- Keep trained rankings separate from unscored offers; reject scoring without coefficients and sort unscored offers by value so no consumer can promote an unsupported category.
- Recommendation views use a root-level shared provider for clock, demo controls, rankings and banner state; initialize after hydration so navigation preserves demo scenarios and all screens agree.
- User feedback trains the likely-now model via pure online-learning updates (learning module) on a browser-local copy of the trained weights and usual hours, passed into the scoring engine so every screen ranks with the same learned parameters; trained constants are never mutated.
- Use the shared brand-logo component and asset pointers for downloaded official logos, rather than initials or emoji placeholders.
- Keep notification eligibility and formatting in a pure tested module; a browser-local daily ledger limits this account-free demo across reloads, while skip feedback remains session-only.
- Demo fixtures adapt to the common offer shape and payment lookup without entering Connect; real GPS checks use haversine distances only for explicitly georeferenced stores, never fictional map points.
- Keep mock merchant connection IDs in the shared root provider for navigation-only demo state; catalog data drives Connect, recommendations and payment lookup without real account authentication or credentials.
- Keep preference rules (interest ordering, history-off sorting, quiet hours, expiry alerts, banner gating) in the pure tested preferences module; a browser-local preferences store restored after hydration feeds the root recommendation provider so Home, For You and banners react immediately.
- Keep bank card points (Chase example partner) in their own pure tested bank module and root-provider state, never in merchant offers, so they never get a match score, never enter expiry/progress lists, and payment splits deduct from one shared balance.
- Credit points offer lists reuse the shared engine ordering and pure payment estimate; an explicit payment search flag enables Credit points independent of auto-use preferences, so displayed point costs match checkout.
- Bank-funded offers (bankFunded flag, e.g. Amazon, Netflix, Spotify) have no merchant balance and never appear on Connect; their cost is paid fully with Credit points via offerRewardValue = 0, and offerCostLabel is the single source of cost wording so list math, labels and checkout agree.
- Use the shared pure pickForNow selector on recommendation screens; fallbacks must be trained, open and in offer hours, and never loosen notification eligibility.
- Guard bank-funded redemptions with canFundOffer and record offerSavings so a card offer cannot be redeemed without its full point cost or counted twice in savings.
- Present the app as a phone: a device-shaped shell that fills the viewport height and as much width as the window allows, dropping the frame to run edge-to-edge at phone-sized or very short viewports; keep one independently scrolling main area and safe-area-aware persistent navigation.
