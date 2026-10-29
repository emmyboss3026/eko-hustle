import { useState } from "react";
import { avatars, supporterAvatars, traits, type Sim, type TraitId } from "../data/traits";
import { useAccount } from "../lib/account";
import PaymentNotice from "../components/PaymentNotice";
import { naira, RENT, START_MONEY } from "../engine/economy";

export default function CreateSim({ onDone }: { onDone: (sim: Sim) => void }) {
  const { profile } = useAccount();
  const looks = profile?.supporter ? [...avatars, ...supporterAvatars] : avatars;
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [trait, setTrait] = useState<TraitId>("hustler");
  const ready = name.trim().length > 0;

  return (
    <main className="app create">
      <header className="create-hero">
        <h1>Eko Hustle</h1>
        <p>
          You land in a bare self-contain in Mushin with {naira(START_MONEY)}. Rent is {naira(RENT)} a week and NEPA
          does as it likes. Furnish your room, hustle your way up, then decide: japa abroad, or become a landlord at home.
        </p>
      </header>

      <PaymentNotice />
      <div className="create-body">
        <label className="field">
          What's your name?
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Chuka"
            maxLength={20}
            autoFocus
          />
        </label>

        <h3>Pick a look</h3>
        <div className="avatars">
          {looks.map(a => (
            <button key={a} type="button" aria-pressed={avatar === a} aria-label={`Avatar ${a}`} onClick={() => setAvatar(a)}>
              {a}
            </button>
          ))}
        </div>

        <h3>Pick a trait</h3>
        {(Object.keys(traits) as TraitId[]).map(id => (
          <button key={id} type="button" className="trait" aria-pressed={trait === id} onClick={() => setTrait(id)}>
            <span className="row-emoji">{traits[id].emoji}</span>
            <span>
              <b>{traits[id].name}</b>
              <br />
              <span className="note">{traits[id].desc}</span>
            </span>
          </button>
        ))}

        {profile?.supporter && <p className="note">🌟 Supporter looks unlocked. Thank you!</p>}

        <button
          className="btn block"
          disabled={!ready}
          onClick={() => onDone({ name: name.trim(), avatar, trait })}
        >
          {ready ? `Start ${name.trim()}'s life in Lagos` : "Type a name to start"}
        </button>
        <p className="note footer-links">
          <a href="/privacy.html">Privacy policy</a> · <a href="/terms.html">Terms of use</a>
        </p>
      </div>
    </main>
  );
}
