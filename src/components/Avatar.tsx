import { usePhoto } from "../lib/photo";

/** Your picture if you set one, otherwise your character's face. */
export default function Avatar({ emoji, className = "" }: { emoji: string; className?: string }) {
  const photo = usePhoto();
  return photo
    ? <img className={`avatar-photo ${className}`} src={photo} alt="" />
    : <span className={className} aria-hidden>{emoji}</span>;
}
