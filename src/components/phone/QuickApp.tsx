import { actions } from "../../data/actions";
import type { Command, GameState } from "../../engine/game";
import { useLang } from "../../i18n/react";
import ActionRow from "../ActionRow";

/** 🛵 Quick: everything you can do on your phone anywhere (call home, hustle, order food, buy fuel…). */
export default function QuickApp({ state, dispatch }: { state: GameState; dispatch: (c: Command) => void }) {
  const { t } = useLang();
  const list = actions.filter(a => a.spot === "phone");
  return (
    <>
      <p className="note">{t("quick.lede")}</p>
      <div className="group">
        {list.map(a => <ActionRow key={a.id} state={state} action={a} dispatch={dispatch} />)}
      </div>
    </>
  );
}
