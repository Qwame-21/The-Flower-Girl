import { CARD_STYLES } from '../data/cardStyles';

export default function CardStylePicker({ disabled = false }) {
  return <fieldset className="card-style-picker" disabled={disabled}><legend>Lettering style</legend><div>{CARD_STYLES.map((style, index) => <label className={style.className} key={style.value}><input type="radio" name="cardStyleNotes" value={style.value} defaultChecked={index === 0} /><span>{style.label}</span><b>{style.sample}</b></label>)}</div></fieldset>;
}
