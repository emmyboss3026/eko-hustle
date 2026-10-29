import { useState } from "react";
import { dayOf, type Command, type GameState } from "../../engine/game";
import { naira } from "../../engine/economy";
import { contactState, phoneBlocker } from "../../engine/phone";
import { CONTACTS, CLOSE, GIFT_COST, HELP_EVERY_DAYS, bondKey, type ContactId } from "../../data/contacts";
import { useLang } from "../../i18n/react";
import { Progress } from "../ui";

/** 📇 Contacts: the people in your life, how close you are, and ways to stay in touch. */
export default function ContactsApp({ state, dispatch, onMessages }: { state: GameState; dispatch: (c: Command) => void; onMessages: () => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState<ContactId | null>(null);
  const day = dayOf(state.time);
  const sorted = [...CONTACTS].sort((a, b) => contactState(state, b.id).rel - contactState(state, a.id).rel);

  return (
    <>
      <p className="note">{t("contacts.lede", { close: CLOSE })}</p>
      <div className="group">
        {sorted.map(c => {
          const cs = contactState(state, c.id);
          const isOpen = open === c.id;
          const helpProblem = phoneBlocker(state, { type: "contact", id: c.id, how: "help" });
          const giftProblem = phoneBlocker(state, { type: "contact", id: c.id, how: "gift" });
          const daysToHelp = cs.helped !== undefined ? HELP_EVERY_DAYS - (day - cs.helped) : 0;
          return (
            <div key={c.id} className={`contact ${isOpen ? "open" : ""}`}>
              <button className="contact-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : c.id)}>
                <span className="contact-face" aria-hidden>{c.emoji}</span>
                <span className="row-main">
                  <b>{t(`contact.${c.id}.name`)}</b>
                  <small>{t(`contact.${c.id}.role`)} · {t(bondKey(c, cs.rel))}</small>
                  <Progress value={cs.rel} max={100} />
                </span>
                <span className="contact-rel">{Math.round(cs.rel)}</span>
              </button>
              {isOpen && (
                <div className="contact-body">
                  <p className="note">{t(`contact.${c.id}.about`)}</p>
                  <div className="btn-row wrap">
                    <button className="btn" onClick={() => dispatch({ type: "contact", id: c.id, how: "call" })}>📞 {t("contacts.call")}</button>
                    <button className="btn plain" onClick={() => dispatch({ type: "contact", id: c.id, how: "text" })}>💬 {t("contacts.text")}</button>
                    <button className="btn plain" disabled={!!giftProblem} onClick={() => dispatch({ type: "contact", id: c.id, how: "gift" })}>🎁 {t("contacts.gift", { money: naira(GIFT_COST) })}</button>
                    <button className="btn plain" disabled={!!helpProblem} onClick={() => dispatch({ type: "contact", id: c.id, how: "help" })}>🤝🏾 {t("contacts.help")}</button>
                  </div>
                  <p className="note">
                    {helpProblem === "phone.err.notClose" ? t("contacts.helpNeeds", { close: CLOSE })
                      : helpProblem === "phone.err.helpedRecently" ? t("contacts.helpIn", { days: daysToHelp })
                      : t(`contact.${c.id}.helps`)}
                  </p>
                  <button className="btn plain block" onClick={onMessages}>✉️ {t("contacts.messages")}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
